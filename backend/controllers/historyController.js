import AppointmentHistory from '../models/AppointmentHistory.js';
import ActionHistory from '../models/ActionHistory.js';

// GET patient's action history (patient view)
export const getMyActions = async (req, res) => {
  try {
    const actions = await ActionHistory.find({ patient: req.user.id }).sort({ createdAt: -1 }).limit(200);
    res.json(actions);
  } catch (err) {
    console.error('Get my actions error:', err);
    res.status(500).json({ message: 'Failed to fetch actions' });
  }
};

// GET doctor-facing action history for a patient
export const getPatientActionsForDoctor = async (req, res) => {
  try {
    const { patientId } = req.query;
    if (!patientId) return res.status(400).json({ message: 'patientId required' });
    const actions = await ActionHistory.find({ patient: patientId }).sort({ createdAt: -1 }).limit(500);
    res.json(actions);
  } catch (err) {
    console.error('Get patient actions error:', err);
    res.status(500).json({ message: 'Failed to fetch patient actions' });
  }
};

// GET appointment history for appointment or patient
export const getAppointmentHistory = async (req, res) => {
  try {
    const { appointmentId, patientId } = req.query;
    const q = {};
    if (appointmentId) q.appointment = appointmentId;
    if (patientId) q.patient = patientId;
    if (!appointmentId && !patientId) return res.status(400).json({ message: 'appointmentId or patientId required' });

    const hist = await AppointmentHistory.find(q).sort({ createdAt: -1 }).limit(500);
    res.json(hist);
  } catch (err) {
    console.error('Get appointment history error:', err);
    res.status(500).json({ message: 'Failed to fetch appointment history' });
  }
};