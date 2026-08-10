// backend/src/models/Testimonial.js
import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:  { type: String, default: '' },
  userRole:  { type: String, default: 'student' },
  userImage: { type: String, default: '' },
  branch:    { type: String, default: '' },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  text:      { type: String, required: true, trim: true },
  isApproved:{ type: Boolean, default: false },
  approvedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt:{ type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('Testimonial', testimonialSchema);
