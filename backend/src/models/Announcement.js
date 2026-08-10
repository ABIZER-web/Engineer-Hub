// backend/src/models/Announcement.js
import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  priority: { type: String, enum: ['urgent','high','normal'], default: 'normal' },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

announcementSchema.index({ active: 1, createdAt: -1 });
export default mongoose.model('Announcement', announcementSchema);
