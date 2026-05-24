import mongoose from 'mongoose';

const ActionHistorySchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who performed the action (doctor usually)
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // affected patient
  type: { type: String, enum: ['viewed_patient','reviewed_report','risk_score_changed','appointment_status_changed','doctor_ai_interaction'], required: true },
  data: { type: Object, default: {} },
}, { timestamps: true });

export default mongoose.model('ActionHistory', ActionHistorySchema);