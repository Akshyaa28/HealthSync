import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import doctorMiddleware from '../middleware/doctorMiddleware.js';
import { getMyActions, getPatientActionsForDoctor, getAppointmentHistory } from '../controllers/historyController.js';

const router = express.Router();

// Patient: view own action history
router.get('/actions/me', authMiddleware, getMyActions);

// Doctor: view action history for a patient
router.get('/actions/patient', authMiddleware, doctorMiddleware, getPatientActionsForDoctor);

// Appointment history lookup (doctor or patient) - requires either appointmentId or patientId
router.get('/appointments/history', authMiddleware, getAppointmentHistory);

export default router;