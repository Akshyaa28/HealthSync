import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who triggered it (optional)
  type: { type: String, enum: ['highRisk','appointmentRequest','reportUploaded','appointmentApproved','reportReviewed','riskAlert'], required: true },
  message: { type: String, required: true },
  data: { type: Object, default: {} },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);
