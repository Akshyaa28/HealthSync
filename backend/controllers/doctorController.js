import User from '../models/User.js';
import Report from '../models/Report.js';
import RiskHistory from '../models/RiskHistory.js';
import ActionHistory from '../models/ActionHistory.js';

// Minimal safe response to verify doctor-only access
export const doctorPing = (req, res) => {
  res.status(200).json({ message: 'Doctor access confirmed', userId: req.user.id });
};

// Helper: compute dynamic risk from an array of reports (sorted desc by date)
const computeRiskFromReports = (reports = []) => {
  // Reports expected sorted by createdAt desc (latest first)
  const safeReports = reports.slice(0, 10); // limit to recent 10 for calculation
  const latest = safeReports[0]?.risk ?? 0;

  // criticalFlag: big jump or extremely high value in any historical report
  const criticalFlag = safeReports.some(r => r.risk >= 90) ? 30 : 0;

  // trendScore: detect increasing trend based on deltas between recent reports
  let trendScore = 0;
  if (safeReports.length >= 2) {
    const diffs = [];
    for (let i = 0; i < Math.min(4, safeReports.length - 1); i++) {
      diffs.push((safeReports[i].risk || 0) - (safeReports[i + 1].risk || 0));
    }
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    // Scale average diff to a score (positive only)
    trendScore = Math.max(0, Math.round(avgDiff * 10));
    trendScore = Math.min(trendScore, 50);
  } else {
    // fallback: proportional to latest when insufficient history
    trendScore = Math.round(latest * 0.25);
  }

  // recoveryScore: if last 3 reports show no improvement (non-decreasing), add penalty
  let recoveryScore = 0;
  if (safeReports.length >= 3) {
    const last3 = safeReports.slice(0, 3).map(r => r.risk || 0);
    if (last3[0] >= last3[1] && last3[1] >= last3[2]) {
      // no recovery seen across recent reports
      recoveryScore = 20;
    }
  }

  // Compose final risk score using the specified formula
  let riskScore = trendScore + recoveryScore + criticalFlag;

  // Safe default: if insufficient data and computed score is very low, use latest as baseline
  if (safeReports.length < 2 && riskScore < Math.round(latest * 0.6)) {
    riskScore = Math.round(latest * 0.6);
  }

  // Clamp
  riskScore = Math.max(0, Math.min(100, Math.round(riskScore)));

  // Derive readable level
  let riskLevel = 'Normal';
  if (riskScore >= 75) riskLevel = 'High';
  else if (riskScore >= 40) riskLevel = 'Medium';

  return { riskScore, trendScore, recoveryScore, criticalFlag, riskLevel };
};

// GET /api/doctor/patients?sort=risk
// Returns list of patients with their latest report summary and dynamic risk info
export const getPatients = async (req, res) => {
  try {
    const sort = req.query.sort;

    const patients = await User.find({ role: 'patient' }).select('name email');

    const results = await Promise.all(
      patients.map(async (p) => {
        // fetch recent reports to compute dynamic score
        const reports = await Report.find({ user: p._id }).sort({ createdAt: -1 }).limit(10);

        const { riskScore, trendScore, recoveryScore, criticalFlag, riskLevel } = computeRiskFromReports(reports);

        // Save risk history entry to MongoDB (add timestamp via timestamps option)
        try {
          await RiskHistory.create({
            user: p._id,
            riskScore,
            trendScore,
            recoveryScore,
            criticalFlag,
            notes: `Computed from ${reports.length} reports`,
          });
        } catch (e) {
          // Log but do not fail response if saving history fails
          console.warn('Failed to save RiskHistory for user', p._id, e?.message || e);
        }

        return {
          id: p._id,
          name: p.name,
          email: p.email,
          riskScore,
          riskLevel,
          reason: (reports[0]?.reasons && reports[0].reasons.length) ? reports[0].reasons[0] : (reports[0]?.summary || 'No reports'),
          lastReportDate: reports[0]?.createdAt || null,
        };
      })
    );

    if (sort === 'risk') {
      results.sort((a, b) => b.riskScore - a.riskScore);
    }

    res.status(200).json(results);
  } catch (err) {
    console.error('Get Patients Error:', err);
    res.status(500).json({ message: 'Failed to fetch patients' });
  }
};

// GET /api/doctor/patients/:id
// Returns patient profile and their reports
export const getPatientDetails = async (req, res) => {
  try {
    const patientId = req.params.id;
    const user = await User.findById(patientId).select('-password');
    if (!user || user.role !== 'patient') return res.status(404).json({ message: 'Patient not found' });

    const reports = await Report.find({ user: patientId }).sort({ createdAt: -1 });

    // record that doctor viewed this patient's profile
    try {
      await ActionHistory.create({ actor: req.user.id, patient: patientId, type: 'viewed_patient', data: { viewedAt: new Date() } });
    } catch (e) {
      console.warn('Failed to record viewed_patient action', e?.message || e);
    }

    res.status(200).json({ user, reports });
  } catch (err) {
    console.error('Get Patient Details Error:', err);
    res.status(500).json({ message: 'Failed to fetch patient details' });
  }
};
