// backend/src/models/FreelanceProject.js
import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
    bidderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bidderName: { type: String, default: '' },
    bidderEmail: { type: String, default: '' },
    bidAmount: { type: Number, required: true },
    timeline: { type: String, default: '' },
    proposal: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    submittedAt: { type: Date, default: Date.now },
});

const freelanceProjectSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clientName: { type: String, default: '' },
    clientEmail: { type: String, default: '' },
    budget: { type: Number, required: true },
    budgetType: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' },
    currency: { type: String, default: 'INR' },
    timeline: { type: String, default: '' },
    skills: [{ type: String }],
    category: { type: String, default: 'Other' },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'completed', 'cancelled', 'on_hold'],
        default: 'open'
    },
    // Separate from `status` above (which tracks the project's lifecycle) — this gates
    // whether the listing is publicly visible at all.
    moderationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionNote: { type: String, default: '' },
    bids: [bidSchema],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    completedAt: { type: Date, default: null },
    // Client's review of the freelancer after project completion — one per project,
    // since each project has exactly one client and one assigned freelancer.
    freelancerReview: {
        rating:    { type: Number, min: 1, max: 5, default: null },
        comment:   { type: String, default: '' },
        createdAt: { type: Date, default: null },
    },
    attachments: [{ type: String }],
    viewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

freelanceProjectSchema.index({ status: 1 });
freelanceProjectSchema.index({ moderationStatus: 1 });
freelanceProjectSchema.index({ clientId: 1 });
freelanceProjectSchema.index({ skills: 1 });

const FreelanceProject = mongoose.model('FreelanceProject', freelanceProjectSchema);
export default FreelanceProject;
