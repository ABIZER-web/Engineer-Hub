// backend/src/models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  buyerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerEmail:    { type: String, required: true },
  buyerName:     { type: String, default: '' },
  itemId:        { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceItem', required: true },
  itemTitle:     { type: String, default: '' },
  sellerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerEmail:   { type: String, default: '' },
  sellerName:    { type: String, default: '' },
  amount:        { type: Number, required: true },
  platformFee:   { type: Number, default: 0 },
  sellerEarning: { type: Number, default: 0 },
  status:        { type: String, enum: ['pending','completed','refunded','cancelled'], default: 'completed' },
  paymentMethod: { type: String, default: 'upi' },
  paymentRef:    { type: String, default: '' },
  payoutStatus:  { type: String, enum: ['pending','paid','failed'], default: 'pending' },
  payoutAt:      { type: Date, default: null },
}, { timestamps: true });

orderSchema.index({ buyerId: 1 });
orderSchema.index({ sellerId: 1 });
export default mongoose.model('Order', orderSchema);
