import User from '../models/User.js';
import RiskHistory from '../models/RiskHistory.js';

// GET /api/doctor/analytics
export const getDoctorAnalytics = async (req, res) => {
  try {
    // Total patients
    const totalPatients = await User.countDocuments({ role: 'patient' });

    // High-risk patient count (latest risk per user >= 75)
    const highAgg = await RiskHistory.aggregate([
      { $sort: { user: 1, createdAt: -1 } },
      { $group: { _id: '$user', latestRisk: { $first: '$riskScore' }, latestAt: { $first: '$createdAt' } } },
      { $match: { latestRisk: { $gte: 75 } } },
      { $count: 'highRiskCount' }
    ]);
    const highRiskCount = (highAgg[0] && highAgg[0].highRiskCount) || 0;

    // Average recovery delay: for each patient, find first high (>=75) and first subsequent entry with <75, compute days between
    const histories = await RiskHistory.find({}).sort({ user: 1, createdAt: 1 }).lean();
    const byUser = {};
    for (const h of histories) {
      const uid = String(h.user);
      byUser[uid] = byUser[uid] || [];
      byUser[uid].push(h);
    }

    const deltas = [];
    for (const uid of Object.keys(byUser)) {
      const arr = byUser[uid];
      let highIndex = arr.findIndex(r => r.riskScore >= 75);
      if (highIndex === -1) continue;
      let recoverIndex = -1;
      for (let i = highIndex + 1; i < arr.length; i++) {
        if (arr[i].riskScore < 75) { recoverIndex = i; break; }
      }
      if (recoverIndex !== -1) {
        const highAt = new Date(arr[highIndex].createdAt);
        const recoveredAt = new Date(arr[recoverIndex].createdAt);
        const days = Math.max(0, Math.round((recoveredAt - highAt) / (1000 * 60 * 60 * 24)));
        deltas.push(days);
      }
    }

    const avgRecoveryDelayDays = deltas.length ? Math.round(deltas.reduce((a,b)=>a+b,0) / deltas.length) : null;

    // Weekly trend summary: for last 7 days, count unique high-risk patients per day
    const now = new Date();
    const start = new Date(now);
    start.setHours(0,0,0,0);
    start.setDate(start.getDate() - 6);

    const weeklyAgg = await RiskHistory.aggregate([
      { $match: { createdAt: { $gte: start }, riskScore: { $gte: 75 } } },
      { $project: { user: 1, day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } } },
      { $group: { _id: { day: "$day", user: "$user" } } }, // unique user-day
      { $group: { _id: "$_id.day", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Build array for last 7 days
    const last7 = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const found = weeklyAgg.find(w => w._id === key);
      last7.push({ date: key, count: (found && found.count) || 0 });
    }

    // Compute breakdown of latest risk per patient: High(>=75), Medium(40-74), Low(<40)
    const latestAgg = await RiskHistory.aggregate([
      { $sort: { user: 1, createdAt: -1 } },
      { $group: { _id: '$user', latestRisk: { $first: '$riskScore' } } },
      { $group: {
        _id: null,
        high: { $sum: { $cond: [ { $gte: ['$latestRisk', 75] }, 1, 0 ] } },
        medium: { $sum: { $cond: [ { $and: [ { $gte: ['$latestRisk', 40] }, { $lt: ['$latestRisk', 75] } ] }, 1, 0 ] } },
        low: { $sum: { $cond: [ { $lt: ['$latestRisk', 40] }, 1, 0 ] } }
      } }
    ]);

    const breakdown = latestAgg[0]
      ? { high: latestAgg[0].high || 0, medium: latestAgg[0].medium || 0, low: latestAgg[0].low || 0 }
      : { high: 0, medium: 0, low: 0 };

    res.json({ totalPatients, highRiskCount, avgRecoveryDelayDays, weekly: last7, breakdown });
  } catch (err) {
    console.error('Doctor analytics error:', err);
    res.status(500).json({ message: 'Failed to compute analytics' });
  }
};
