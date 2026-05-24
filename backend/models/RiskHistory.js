import mongoose from 'mongoose';

const riskHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    riskScore: { type: Number, required: true },
    trendScore: { type: Number, required: true },
    recoveryScore: { type: Number, required: true },
    criticalFlag: { type: Number, required: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('RiskHistory', riskHistorySchema);
