// backend/src/models/Placement.js
import mongoose from 'mongoose';

const placementSchema = new mongoose.Schema({
    title:       { type: String, required: true, trim: true, maxlength: 150 },
    company:     { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    type: { type: String, enum: ['placement', 'internship'], default: 'placement' },

    branch: {
        type: String,
        enum: ['CSE', 'ECE', 'ME', 'CE', 'EE', 'Other', 'All'],
        default: 'All',
    },
    minSemester: { type: Number, min: 1, max: 8, default: null },
    package:     { type: String, default: '' }, // e.g. "6-8 LPA" or "₹25,000/mo stipend" — free text, ranges vary too much for a number field
    location:    { type: String, default: '' },
    deadline:    { type: Date, default: null },
    applyLink:   { type: String, default: '' },

    posterUrl: { type: String, default: '' }, // uploaded via /api/uploads/poster

    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

placementSchema.index({ isActive: 1, type: 1, createdAt: -1 });
placementSchema.index({ branch: 1 });

const Placement = mongoose.model('Placement', placementSchema);
export default Placement;
