import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import doctorMiddleware from '../middleware/doctorMiddleware.js';
import {
  requestAppointment,
  getPatientAppointments,
  cancelAppointment,
  getAvailability,
} from '../controllers/appointmentController.js';

const router = express.Router();

// Patient: request appointment and view their appointments
router.post('/', authMiddleware, requestAppointment);
router.get('/', authMiddleware, getPatientAppointments);
router.patch('/:id/cancel', authMiddleware, cancelAppointment);

// Availability lookup (accessible by patients/doctors)
router.get('/availability', authMiddleware, getAvailability);

export default router;
