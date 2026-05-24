import mongoose from 'mongoose';

const AvailabilitySchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  slots: [{ type: String }], // ['09:00', '09:30', ...]
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AvailabilitySchema.index({ doctor: 1, date: 1 }, { unique: true });

AvailabilitySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Availability', AvailabilitySchema);
