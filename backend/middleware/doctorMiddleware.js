import { json } from 'express';

// Protects routes so only users with role === 'doctor' can proceed
// Assumes authentication middleware has already set `req.user` (id, role)
const doctorMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Forbidden - doctor access only' });
  }

  next();
};

export default doctorMiddleware;
