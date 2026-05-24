import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import doctorMiddleware from '../middleware/doctorMiddleware.js';
import { doctorPing, getPatients, getPatientDetails } from '../controllers/doctorController.js';
import { postAssistant, getAssistantHistory } from '../controllers/doctorAIController.js';
import { reviewReport } from '../controllers/reportController.js';
import { getDoctorAnalytics } from '../controllers/doctorAnalyticsController.js';

const router = express.Router();

// Protected example route for doctors
router.get('/ping', authMiddleware, doctorMiddleware, doctorPing);

// Get list of patients (supports ?sort=risk)
router.get('/patients', authMiddleware, doctorMiddleware, getPatients);

// Get patient details and reports
router.get('/patients/:id', authMiddleware, doctorMiddleware, getPatientDetails);

// Doctor AI Assistant endpoints
router.post('/ai-assistant', authMiddleware, doctorMiddleware, postAssistant);
router.get('/ai-assistant', authMiddleware, doctorMiddleware, getAssistantHistory);

// Mark report reviewed (doctor action)
router.post('/reports/:id/review', authMiddleware, doctorMiddleware, reviewReport);

// Doctor analytics
router.get('/analytics', authMiddleware, doctorMiddleware, getDoctorAnalytics);

// Doctor appointment management
import { getDoctorAppointments, approveOrRescheduleAppointment, setAvailability, getAvailability } from '../controllers/appointmentController.js';

router.get('/appointments', authMiddleware, doctorMiddleware, getDoctorAppointments);
router.patch('/appointments/:id', authMiddleware, doctorMiddleware, approveOrRescheduleAppointment);

// Availability (doctor sets; can also be read by patients via /api/appointments/availability)
router.post('/availability', authMiddleware, doctorMiddleware, setAvailability);
router.get('/availability', authMiddleware, doctorMiddleware, getAvailability);

export default router;
