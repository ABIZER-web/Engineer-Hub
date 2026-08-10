// backend/src/models/Withdrawal.js
import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:     { type: String, default: '' },
  userEmail:    { type: String, required: true },
  upiId:        { type: String, required: true },
  amount:       { type: Number, required: true, min: 1 },
  status:       { type: String, enum: ['pending','processing','paid','rejected'], default: 'pending' },
  requestedAt:  { type: Date, default: Date.now },
  processedAt:  { type: Date, default: null },
  processedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rejectionNote:{ type: String, default: '' },
  transactionId:{ type: String, default: '' },
}, { timestamps: true });

withdrawalSchema.index({ userId: 1 });
withdrawalSchema.index({ status: 1 });
export default mongoose.model('Withdrawal', withdrawalSchema);
