// backend/src/models/AuditLog.js
import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    actor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorName: { type: String, default: '' },
    actorRole: { type: String, default: '' },

    action: { type: String, required: true }, // e.g. 'approve_item', 'reject_resource', 'take_down_report'
    targetType: { type: String, default: '' }, // 'marketplace' | 'resource' | 'freelance' | 'withdrawal' | 'user' | 'report' | 'placement'
    targetId:   { type: mongoose.Schema.Types.ObjectId, default: null },
    targetLabel:{ type: String, default: '' }, // human-readable snapshot, e.g. the item title

    note: { type: String, default: '' }, // rejection reason, resolution note, etc.
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
