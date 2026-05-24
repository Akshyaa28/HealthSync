import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getNotifications, markRead, markAllRead } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', authMiddleware, getNotifications);
router.patch('/:id/read', authMiddleware, markRead);
router.patch('/mark-all-read', authMiddleware, markAllRead);

export default router;