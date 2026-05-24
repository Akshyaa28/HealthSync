import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: list doctors (auth optional but let's require auth)
router.get('/doctors', authMiddleware, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('name email avatar');
    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch doctors' });
  }
});

export default router;
