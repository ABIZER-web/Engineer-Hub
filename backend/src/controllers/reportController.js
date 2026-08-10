// backend/src/controllers/reportController.js
import Report from '../models/Report.js';
import MarketplaceItem from '../models/MarketplaceItem.js';
import Resource from '../models/Resource.js';
import FreelanceProject from '../models/FreelanceProject.js';
import { createNotification } from './notificationController.js';
import { logAction } from './auditLogController.js';

const MODELS = { marketplace: MarketplaceItem, resource: Resource, freelance: FreelanceProject };
const LABELS = { marketplace: 'marketplace listing', resource: 'study resource', freelance: 'freelance project' };

// @desc    Report a listing (spam, scam, inappropriate, etc.)
// @route   POST /api/reports
// @access  Private
export const createReport = async (req, res) => {
    try {
        const { targetType, targetId, reason, note } = req.body;
        if (!MODELS[targetType]) return res.status(400).json({ success: false, message: 'Invalid target type' });
        if (!['spam', 'scam_fraud', 'inappropriate', 'misleading', 'copyright', 'other'].includes(reason)) {
            return res.status(400).json({ success: false, message: 'Invalid reason' });
        }

        const target = await MODELS[targetType].findById(targetId);
        if (!target) return res.status(404).json({ success: false, message: 'Content not found' });

        // one open report per user per item — quietly succeed instead of erroring, so
        // the button doesn't feel broken if someone double-taps it
        const existing = await Report.findOne({ targetId, reporterId: req.user._id, status: 'pending' });
        if (existing) return res.status(200).json({ success: true, message: 'You already reported this — our team will review it', report: existing });

        const report = await Report.create({
            targetType, targetId,
            targetTitle: target.title || '(untitled)',
            reporterId: req.user._id,
            reporterName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
            reason, note: (note || '').slice(0, 500),
        });

        return res.status(201).json({ success: true, message: 'Report submitted — our team will review it', report });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    List reports (default: pending)
// @route   GET /api/reports?status=pending
// @access  Private/Admin
export const getReports = async (req, res) => {
    try {
        const status = req.query.status || 'pending';
        const reports = await Report.find({ status }).sort({ createdAt: -1 }).limit(200);
        return res.status(200).json({ success: true, reports });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Dismiss a report or take action (deactivates the reported content)
// @route   PUT /api/reports/:id/resolve
// @access  Private/Admin
export const resolveReport = async (req, res) => {
    try {
        const { action, note } = req.body; // action: 'dismiss' | 'action'
        if (!['dismiss', 'action'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Action must be dismiss or action' });
        }

        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        report.status = action === 'action' ? 'actioned' : 'dismissed';
        report.resolvedBy = req.user._id;
        report.resolvedAt = new Date();
        report.resolutionNote = note || '';
        await report.save();

        if (action === 'action') {
            const Model = MODELS[report.targetType];
            const target = await Model.findByIdAndUpdate(report.targetId, { isActive: false }, { new: true });
            if (target) {
                const ownerField = target.uploadedBy || target.sellerId || target.clientId;
                if (ownerField) {
                    createNotification({
                        user: ownerField,
                        type: 'item_rejected',
                        title: 'Listing removed',
                        message: `Your ${LABELS[report.targetType]} "${report.targetTitle}" was removed after a review.${note ? ` Reason: ${note}` : ''}`,
                        link: '/',
                    });
                }
            }
        }

        logAction({ actor: req.user, action: `${action}_report`, targetType: report.targetType, targetId: report.targetId, targetLabel: report.targetTitle, note: note || '' });

        return res.status(200).json({ success: true, message: `Report ${report.status}`, report });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Dismiss or take action on many reports at once
// @route   POST /api/reports/bulk-resolve
// @access  Private/Admin
export const bulkResolveReports = async (req, res) => {
    try {
        const { ids, action, note } = req.body; // action: 'dismiss' | 'action'
        if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ success: false, message: 'ids must be a non-empty array' });
        if (!['dismiss', 'action'].includes(action)) return res.status(400).json({ success: false, message: 'Action must be dismiss or action' });

        const reports = await Report.find({ _id: { $in: ids } });
        const status = action === 'action' ? 'actioned' : 'dismissed';
        await Report.updateMany({ _id: { $in: ids } }, { status, resolvedBy: req.user._id, resolvedAt: new Date(), resolutionNote: note || '' });

        for (const report of reports) {
            if (action === 'action') {
                const Model = MODELS[report.targetType];
                const target = await Model.findByIdAndUpdate(report.targetId, { isActive: false }, { new: true });
                if (target) {
                    const ownerField = target.uploadedBy || target.sellerId || target.clientId;
                    if (ownerField) {
                        createNotification({
                            user: ownerField,
                            type: 'item_rejected',
                            title: 'Listing removed',
                            message: `Your ${LABELS[report.targetType]} "${report.targetTitle}" was removed after a review.${note ? ` Reason: ${note}` : ''}`,
                            link: '/',
                        });
                    }
                }
            }
            logAction({ actor: req.user, action: `${action}_report`, targetType: report.targetType, targetId: report.targetId, targetLabel: report.targetTitle, note: note || 'bulk action' });
        }

        return res.status(200).json({ success: true, message: `${reports.length} report(s) ${status}`, count: reports.length });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
