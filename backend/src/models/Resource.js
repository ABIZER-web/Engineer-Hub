// backend/src/models/Resource.js
import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: '' },
    branch: { type: String, enum: ['CSE', 'ECE', 'ME', 'CE', 'EE', 'Other', ''], default: '' },
    semester: { type: Number, min: 1, max: 8, default: null },
    resourceType: {
        type: String,
        enum: ['notes', 'assignment', 'paper', 'book', 'video', 'slides', 'code', 'other'],
        default: 'notes'
    },
    fileUrl: { type: String, required: true },
    fileSize: { type: String, default: '' },
    fileType: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedByName: { type: String, default: '' },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionNote: { type: String, default: '' },
    downloadCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

resourceSchema.index({ branch: 1, semester: 1 });
resourceSchema.index({ isApproved: 1 });

const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;
