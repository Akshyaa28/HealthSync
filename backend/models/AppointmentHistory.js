import mongoose from 'mongoose';

const AppointmentHistorySchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromStatus: { type: String, enum: ['pending','approved','cancelled', null], default: null },
  toStatus: { type: String, enum: ['pending','approved','cancelled'], required: true },
  note: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('AppointmentHistory', AppointmentHistorySchema);