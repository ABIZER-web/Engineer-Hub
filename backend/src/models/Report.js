// backend/src/models/Report.js
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    targetType: { type: String, enum: ['marketplace', 'resource', 'freelance'], required: true },
    targetId:   { type: mongoose.Schema.Types.ObjectId, required: true },
    targetTitle:{ type: String, default: '' }, // snapshot at report time — avoids a populate/join just to render the list

    reporterId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reporterName: { type: String, default: '' },

    reason: {
        type: String,
        enum: ['spam', 'scam_fraud', 'inappropriate', 'misleading', 'copyright', 'other'],
        required: true,
    },
    note: { type: String, default: '', maxlength: 500 },

    status: { type: String, enum: ['pending', 'dismissed', 'actioned'], default: 'pending' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    resolutionNote: { type: String, default: '' },
}, { timestamps: true });

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });
// One open report per user per item — stops a single user from spamming reports on the same listing
reportSchema.index({ targetId: 1, reporterId: 1, status: 1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
