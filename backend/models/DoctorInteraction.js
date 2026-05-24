import mongoose from 'mongoose';

const doctorInteractionSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    language: { type: String, enum: ['en', 'ta', 'tanglish'], default: 'en' },
  },
  { timestamps: true }
);

export default mongoose.model('DoctorInteraction', doctorInteractionSchema);
