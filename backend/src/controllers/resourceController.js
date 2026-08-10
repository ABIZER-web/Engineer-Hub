// backend/src/controllers/resourceController.js
import Resource from '../models/Resource.js';
import { createNotification } from './notificationController.js';
import { logAction } from './auditLogController.js';

const isSafeUrl = (url) => /^https?:\/\//i.test(String(url).trim()); // blocks javascript:/data: URI XSS in the link field

export const getAllResources = async (req, res) => {
    try {
        const resources = await Resource.find({ isActive: true }).populate('uploadedBy', 'firstName lastName email').sort({ createdAt: -1 });
        return res.status(200).json({ success: true, resources });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getApprovedResources = async (req, res) => {
    try {
        const { branch, semester, resourceType, page = 1, limit = 24 } = req.query;
        const query = { isApproved: true, isActive: true };
        if (branch) query.branch = branch;
        if (semester) query.semester = parseInt(semester);
        if (resourceType) query.resourceType = resourceType;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(60, Math.max(1, parseInt(limit)));

        const [resources, totalCount] = await Promise.all([
            Resource.find(query).populate('uploadedBy', 'firstName lastName').sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
            Resource.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true, resources,
            page: pageNum, totalPages: Math.ceil(totalCount / limitNum), totalCount, hasMore: pageNum * limitNum < totalCount,
        });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getPendingResources = async (req, res) => {
    try {
        const resources = await Resource.find({ isApproved: false, isActive: true }).populate('uploadedBy', 'firstName lastName email').sort({ createdAt: -1 });
        return res.status(200).json({ success: true, resources });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getResourcesByUser = async (req, res) => {
    try {
        const resources = await Resource.find({ uploadedBy: req.params.userId, isActive: true }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, resources });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getResourceById = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id).populate('uploadedBy', 'firstName lastName email');
        if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
        return res.status(200).json({ success: true, resource });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const createResource = async (req, res) => {
    try {
        const { title, description, subject, branch, semester, resourceType, fileUrl, fileSize, fileType, tags } = req.body;
        if (!title || !fileUrl) return res.status(400).json({ success: false, message: 'Title and file URL are required' });
        if (!isSafeUrl(fileUrl)) return res.status(400).json({ success: false, message: 'File link must be a valid http(s) URL' });
        const resource = await Resource.create({
            title: title.trim(), description, subject, branch, semester,
            resourceType, fileUrl, fileSize, fileType,
            uploadedBy: req.user._id,
            uploadedByName: `${req.user.firstName} ${req.user.lastName}`.trim(),
            tags: tags || [],
        });
        return res.status(201).json({ success: true, message: 'Resource uploaded successfully', resource });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const updateResource = async (req, res) => {
    try {
        const EDITABLE_FIELDS = ['title', 'description', 'subject', 'branch', 'semester', 'resourceType', 'fileUrl', 'fileSize', 'fileType', 'tags'];
        const updates = {};
        for (const field of EDITABLE_FIELDS) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }

        const existing = await Resource.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: 'Resource not found' });

        const isOwner = existing.uploadedBy.toString() === req.user._id.toString();
        const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this resource' });
        }

        const resource = await Resource.findByIdAndUpdate(req.params.id, updates, { new: true });
        return res.status(200).json({ success: true, resource });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const deleteResource = async (req, res) => {
    try {
        await Resource.findByIdAndDelete(req.params.id);
        return res.status(200).json({ success: true, message: 'Resource deleted' });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const approveResource = async (req, res) => {
    try {
        const resource = await Resource.findByIdAndUpdate(
            req.params.id,
            { isApproved: true, approvedBy: req.user._id, approvedAt: new Date(), rejectionNote: '' },
            { new: true }
        );
        if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

        createNotification({
            user: resource.uploadedBy,
            type: 'item_approved',
            title: 'Resource approved 🎉',
            message: `Your resource "${resource.title}" is now live in the library.`,
            link: '/resources',
        });

        logAction({ actor: req.user, action: 'approve_resource', targetType: 'resource', targetId: resource._id, targetLabel: resource.title });

        return res.status(200).json({ success: true, message: 'Resource approved', resource });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Reject a pending resource with a reason (soft — keeps the record, notifies the uploader)
// @route   PUT /api/resources/:id/reject
// @access  Private/Admin
export const rejectResource = async (req, res) => {
    try {
        const { note } = req.body;
        const resource = await Resource.findByIdAndUpdate(
            req.params.id,
            { isApproved: false, isActive: false, rejectionNote: note || '', approvedBy: req.user._id, approvedAt: new Date() },
            { new: true }
        );
        if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

        createNotification({
            user: resource.uploadedBy,
            type: 'item_rejected',
            title: 'Resource rejected',
            message: `Your resource "${resource.title}" wasn't approved.${note ? ` Reason: ${note}` : ''}`,
            link: '/resources',
        });

        logAction({ actor: req.user, action: 'reject_resource', targetType: 'resource', targetId: resource._id, targetLabel: resource.title, note: note || '' });

        return res.status(200).json({ success: true, message: 'Resource rejected', resource });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const incrementDownloads = async (req, res) => {
    try {
        const resource = await Resource.findByIdAndUpdate(
            req.params.id,
            { $inc: { downloadCount: 1 } },
            { new: true }
        );
        if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
        return res.status(200).json({ success: true, downloadCount: resource.downloadCount });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Approve or reject many resources at once
// @route   POST /api/resources/bulk-moderate
// @access  Private/Admin
export const bulkModerateResources = async (req, res) => {
    try {
        const { ids, action, note } = req.body; // action: 'approved' | 'rejected'
        if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ success: false, message: 'ids must be a non-empty array' });
        if (!['approved', 'rejected'].includes(action)) return res.status(400).json({ success: false, message: 'action must be approved or rejected' });

        const resources = await Resource.find({ _id: { $in: ids } });
        const updates = action === 'approved'
            ? { isApproved: true, approvedBy: req.user._id, approvedAt: new Date(), rejectionNote: '' }
            : { isApproved: false, isActive: false, rejectionNote: note || '', approvedBy: req.user._id, approvedAt: new Date() };
        await Resource.updateMany({ _id: { $in: ids } }, updates);

        for (const resource of resources) {
            createNotification({
                user: resource.uploadedBy,
                type: action === 'approved' ? 'item_approved' : 'item_rejected',
                title: action === 'approved' ? 'Resource approved 🎉' : 'Resource rejected',
                message: action === 'approved'
                    ? `Your resource "${resource.title}" is now live in the library.`
                    : `Your resource "${resource.title}" wasn't approved.${note ? ` Reason: ${note}` : ''}`,
                link: '/resources',
            });
            logAction({ actor: req.user, action: `${action}_resource`, targetType: 'resource', targetId: resource._id, targetLabel: resource.title, note: note || 'bulk action' });
        }

        return res.status(200).json({ success: true, message: `${resources.length} resource(s) ${action}`, count: resources.length });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
