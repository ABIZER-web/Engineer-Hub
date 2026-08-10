// backend/src/controllers/auditLogController.js
import AuditLog from '../models/AuditLog.js';

// Reusable helper other controllers call after a moderation action.
// Never throws — an audit-log failure should never break the action itself.
export const logAction = async ({ actor, action, targetType = '', targetId = null, targetLabel = '', note = '' }) => {
    try {
        if (!actor || !action) return null;
        return await AuditLog.create({
            actor: actor._id || actor,
            actorName: actor.firstName ? `${actor.firstName} ${actor.lastName || ''}`.trim() : '',
            actorRole: actor.role || '',
            action, targetType, targetId, targetLabel, note,
        });
    } catch (error) {
        console.error('logAction error:', error.message);
        return null;
    }
};

// @desc    List audit log entries (filterable, paginated)
// @route   GET /api/audit-logs?action=&targetType=&page=&limit=
// @access  Private/Admin
export const getAuditLogs = async (req, res) => {
    try {
        const { action, targetType, page = 1, limit = 50 } = req.query;
        const query = {};
        if (action) query.action = action;
        if (targetType) query.targetType = targetType;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

        const [logs, totalCount] = await Promise.all([
            AuditLog.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
            AuditLog.countDocuments(query),
        ]);

        res.json({
            success: true, logs,
            page: pageNum, totalPages: Math.ceil(totalCount / limitNum), totalCount,
        });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
