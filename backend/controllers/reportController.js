import pkg from "pdf-parse";
const pdf = pkg;
import Report from "../models/Report.js";
import RiskHistory from '../models/RiskHistory.js';
import ActionHistory from '../models/ActionHistory.js';
import jwt from "jsonwebtoken";
import fs from 'fs';
import path from 'path';

export const analyzeReport = async (req, res) => {
  try {
    if (!req.files || !req.files.report) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const buffer = req.files.report.data;
    const parsed = await pdf(buffer);
    const text = parsed.text;

    let riskScore = 0;
    const reasons = [];

    if (/Blood Pressure:\s*(1[4-9]\d|[2-9]\d\d)/i.test(text)) {
      riskScore += 25;
      reasons.push("High Blood Pressure");
    }
    if (/Blood Sugar/i.test(text)) {
      riskScore += 25;
      reasons.push("High Blood Sugar");
    }
    if (/Cholesterol/i.test(text)) {
      riskScore += 25;
      reasons.push("High Cholesterol");
    }
    if (/CRP/i.test(text)) {
      riskScore += 25;
      reasons.push("High Inflammation (CRP)");
    }

    // Normalize status values to match the Report model enum
    let statusKey = "Stable";
    if (riskScore >= 75) statusKey = "High";
    else if (riskScore >= 40) statusKey = "Moderate";

    const trend = riskScore > 50 ? "Increasing" : "Stable";

    const summary = reasons.length ? reasons.join(", ") : "No notable findings";

    // If a token is provided, try to save the report for the authenticated user
    let savedReport = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
        if (decoded?.id) {
          // Save uploaded PDF to uploads/reports and build accessible URL
          let pdfUrl = '';
          try {
            const folder = path.join(process.cwd(), 'uploads', 'reports');
            fs.mkdirSync(folder, { recursive: true });
            const ext = path.extname(req.files.report.name) || '.pdf';
            const filename = `report_${decoded.id}_${Date.now()}${ext}`;
            const filepath = path.join(folder, filename);
            await fs.promises.writeFile(filepath, req.files.report.data);
            pdfUrl = `${req.protocol}://${req.get('host')}/uploads/reports/${filename}`;
          } catch (fileErr) {
            console.warn('Failed to save uploaded PDF:', fileErr?.message || fileErr);
          }

          savedReport = await Report.create({
            user: decoded.id,
            text,
            summary,
            risk: riskScore,
            status: statusKey,
            reasons,
            pdfUrl,
          });

          // Notify doctors of new report upload
          try {
            const Notification = (await import('../models/Notification.js')).default;
            const User = (await import('../models/User.js')).default;
            const doctors = await User.find({ role: 'doctor' }).select('_id name');
            for (const d of doctors) {
              await Notification.create({
                user: d._id,
                actor: decoded.id,
                type: 'reportUploaded',
                message: `New report uploaded for patient ${decoded.id}`,
                data: { reportId: savedReport._id, patientId: decoded.id }
              });
            }

            // If high risk, notify all doctors and the patient as a risk alert
            if (statusKey === 'High') {
              for (const d of doctors) {
                await Notification.create({
                  user: d._id,
                  actor: decoded.id,
                  type: 'highRisk',
                  message: `High-risk report detected for patient ${decoded.id}`,
                  data: { reportId: savedReport._id, patientId: decoded.id }
                });
              }

              // notify patient
              await Notification.create({
                user: decoded.id,
                actor: null,
                type: 'riskAlert',
                message: `High-risk detected in your recent report. Please consult a doctor.`,
                data: { reportId: savedReport._id }
              });
            }

            // Record RiskHistory for this saved report
            try {
              const criticalFlag = riskScore >= 90 ? 30 : 0;
              await RiskHistory.create({ user: decoded.id, riskScore, trendScore: 0, recoveryScore: 0, criticalFlag, notes: `Report upload: ${savedReport._id}` });

              // also log an action entry about risk score change
              await ActionHistory.create({ actor: decoded.id, patient: decoded.id, type: 'risk_score_changed', data: { reportId: savedReport._id, riskScore } });
            } catch (e) {
              console.warn('Failed to persist risk history/action for report', e?.message || e);
            }
          } catch (notifyErr) {
            console.warn('Failed to create report notifications', notifyErr?.message || notifyErr);
          }
        }
      } catch (e) {
        // ignore token errors - analysis still returns
        console.warn("Token verification failed, skipping save");
      }
    }

    res.json({
      riskScore,
      status: statusKey === "High" ? "High Risk" : statusKey === "Moderate" ? "Moderate Risk" : "Healthy",
      trend,
      reasons,
      history: [
        {
          date: new Date(savedReport?.createdAt || Date.now()).toLocaleDateString(),
          risk: savedReport?.risk ?? riskScore,
          status: savedReport ? savedReport.status : (statusKey === "High" ? "High Risk" : statusKey === "Moderate" ? "Moderate Risk" : "Healthy"),
          reasons
        }
      ]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Analysis failed" });
  }
};


export const getUserReports = async (req, res) => {
  try {
    // Query by the 'user' field on the Report schema
    const reports = await Report.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

// Doctor action: mark report as reviewed -> notify patient
export const reviewReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.reviewedAt = new Date();
    await report.save();

    try {
      const Notification = (await import('../models/Notification.js')).default;
      const doctor = await (await import('../models/User.js')).default.findById(req.user.id).select('name');
      await Notification.create({
        user: report.user,
        actor: req.user.id,
        type: 'reportReviewed',
        message: `Your report was reviewed by Dr ${doctor?.name || 'doctor'}`,
        data: { reportId: report._id }
      });

      // record action history
      try {
        await ActionHistory.create({ actor: req.user.id, patient: report.user, type: 'reviewed_report', data: { reportId: report._id } });
      } catch (e) {
        console.warn('Failed to create action history for review', e?.message || e);
      }

    } catch (notifyErr) {
      console.warn('Failed to create report-reviewed notification', notifyErr?.message || notifyErr);
    }

    res.json(report);
  } catch (err) {
    console.error('Review report error:', err);
    res.status(500).json({ message: 'Failed to mark report reviewed' });
  }
};


