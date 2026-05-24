import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { translatePrescription } from '../controllers/prescriptionController.js';

const router = express.Router();

router.post('/translate', authMiddleware, translatePrescription);

export default router;

