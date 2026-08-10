// backend/src/controllers/freelanceController.js
import FreelanceProject from '../models/FreelanceProject.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';
import { logAction } from './auditLogController.js';

export const getAllProjects = async (req, res) => {
    try {
        const { status, skills, search, page = 1, limit = 24 } = req.query;
        const query = { isActive: true, moderationStatus: 'approved' };
        if (status) query.status = status;
        if (skills) query.skills = { $in: skills.split(',').map(s => s.trim()) };
        if (search) query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(60, Math.max(1, parseInt(limit)));

        const [projects, totalCount] = await Promise.all([
            FreelanceProject.find(query).populate('clientId', 'firstName lastName email').sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
            FreelanceProject.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true, projects,
            page: pageNum, totalPages: Math.ceil(totalCount / limitNum), totalCount, hasMore: pageNum * limitNum < totalCount,
        });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getOpenProjects = async (req, res) => {
    try {
        const projects = await FreelanceProject.find({ status: 'open', isActive: true, moderationStatus: 'approved' }).populate('clientId', 'firstName lastName').sort({ createdAt: -1 });
        return res.status(200).json({ success: true, projects });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Projects awaiting moderation
// @route   GET /api/freelancers/pending
// @access  Private/Admin
export const getPendingProjects = async (req, res) => {
    try {
        const projects = await FreelanceProject.find({ moderationStatus: 'pending', isActive: true })
            .populate('clientId', 'firstName lastName email').sort({ createdAt: -1 });
        return res.status(200).json({ success: true, projects });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Approve a pending project listing
// @route   PUT /api/freelancers/:id/approve
// @access  Private/Admin
export const approveProject = async (req, res) => {
    try {
        const project = await FreelanceProject.findByIdAndUpdate(
            req.params.id,
            { moderationStatus: 'approved', approvedBy: req.user._id, approvedAt: new Date(), rejectionNote: '' },
            { new: true }
        );
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        createNotification({
            user: project.clientId,
            type: 'item_approved',
            title: 'Project listing approved 🎉',
            message: `Your freelance listing "${project.title}" is now live and open for bids.`,
            link: '/freelance',
        });

        logAction({ actor: req.user, action: 'approve_freelance_project', targetType: 'freelance', targetId: project._id, targetLabel: project.title });

        return res.status(200).json({ success: true, message: 'Project approved', project });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Reject a pending project listing with a reason
// @route   PUT /api/freelancers/:id/reject
// @access  Private/Admin
export const rejectProject = async (req, res) => {
    try {
        const { note } = req.body;
        const project = await FreelanceProject.findByIdAndUpdate(
            req.params.id,
            { moderationStatus: 'rejected', isActive: false, rejectionNote: note || '', approvedBy: req.user._id, approvedAt: new Date() },
            { new: true }
        );
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        createNotification({
            user: project.clientId,
            type: 'item_rejected',
            title: 'Project listing rejected',
            message: `Your freelance listing "${project.title}" wasn't approved.${note ? ` Reason: ${note}` : ''}`,
            link: '/freelance',
        });

        logAction({ actor: req.user, action: 'reject_freelance_project', targetType: 'freelance', targetId: project._id, targetLabel: project.title, note: note || '' });

        return res.status(200).json({ success: true, message: 'Project rejected', project });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Approve or reject many project listings at once
// @route   POST /api/freelancers/bulk-moderate
// @access  Private/Admin
export const bulkModerateProjects = async (req, res) => {
    try {
        const { ids, action, note } = req.body; // action: 'approved' | 'rejected'
        if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ success: false, message: 'ids must be a non-empty array' });
        if (!['approved', 'rejected'].includes(action)) return res.status(400).json({ success: false, message: 'action must be approved or rejected' });

        const projects = await FreelanceProject.find({ _id: { $in: ids } });
        const updates = action === 'approved'
            ? { moderationStatus: 'approved', approvedBy: req.user._id, approvedAt: new Date(), rejectionNote: '' }
            : { moderationStatus: 'rejected', isActive: false, rejectionNote: note || '', approvedBy: req.user._id, approvedAt: new Date() };
        await FreelanceProject.updateMany({ _id: { $in: ids } }, updates);

        for (const project of projects) {
            createNotification({
                user: project.clientId,
                type: action === 'approved' ? 'item_approved' : 'item_rejected',
                title: action === 'approved' ? 'Project listing approved 🎉' : 'Project listing rejected',
                message: action === 'approved'
                    ? `Your freelance listing "${project.title}" is now live and open for bids.`
                    : `Your freelance listing "${project.title}" wasn't approved.${note ? ` Reason: ${note}` : ''}`,
                link: '/freelancing',
            });
            logAction({ actor: req.user, action: `${action}_freelance_project`, targetType: 'freelance', targetId: project._id, targetLabel: project.title, note: note || 'bulk action' });
        }

        return res.status(200).json({ success: true, message: `${projects.length} project(s) ${action}`, count: projects.length });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getProjectById = async (req, res) => {
    try {
        const project = await FreelanceProject.findById(req.params.id).populate('clientId', 'firstName lastName email').populate('assignedTo', 'firstName lastName email');
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
        project.viewCount += 1;
        await project.save({ validateBeforeSave: false });
        return res.status(200).json({ success: true, project });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getProjectsByClient = async (req, res) => {
    try {
        const projects = await FreelanceProject.find({ clientId: req.params.clientId, isActive: true }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, projects });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const createProject = async (req, res) => {
    try {
        const { title, description, budget, budgetType, timeline, skills, category } = req.body;
        if (!title || !description || !budget) return res.status(400).json({ success: false, message: 'Title, description, and budget are required' });

        const project = await FreelanceProject.create({
            title: title.trim(),
            description: description.trim(),
            clientId: req.user._id,
            clientName: `${req.user.firstName} ${req.user.lastName}`.trim(),
            clientEmail: req.user.email,
            budget: parseFloat(budget),
            budgetType: budgetType || 'fixed',
            timeline, skills: skills || [], category: category || 'Other',
        });
        return res.status(201).json({ success: true, message: 'Project submitted for admin review', project });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const updateProject = async (req, res) => {
    try {
        const EDITABLE_FIELDS = ['title', 'description', 'budget', 'budgetType', 'timeline', 'skills', 'category', 'status', 'attachments'];
        const CLIENT_SETTABLE_STATUSES = ['open', 'in_progress', 'completed', 'cancelled', 'on_hold'];

        const updates = {};
        for (const field of EDITABLE_FIELDS) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }
        if (updates.status && !CLIENT_SETTABLE_STATUSES.includes(updates.status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        if (updates.status === 'completed') updates.completedAt = new Date();

        const project = await FreelanceProject.findOneAndUpdate(
            { _id: req.params.id, clientId: req.user._id },
            updates,
            { new: true }
        );
        if (!project) return res.status(404).json({ success: false, message: 'Project not found or access denied' });
        return res.status(200).json({ success: true, project });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const deleteProject = async (req, res) => {
    try {
        const project = await FreelanceProject.findOneAndUpdate(
            { _id: req.params.id, clientId: req.user._id },
            { isActive: false },
            { new: true }
        );
        if (!project) return res.status(404).json({ success: false, message: 'Project not found or access denied' });
        return res.status(200).json({ success: true, message: 'Project deleted' });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const submitBid = async (req, res) => {
    try {
        const { bidAmount, timeline, proposal } = req.body;
        if (!bidAmount || !proposal) return res.status(400).json({ success: false, message: 'Bid amount and proposal are required' });

        const project = await FreelanceProject.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
        if (project.status !== 'open') return res.status(400).json({ success: false, message: 'Project is not accepting bids' });

        const alreadyBid = project.bids.some(b => b.bidderId.toString() === req.user._id.toString());
        if (alreadyBid) return res.status(400).json({ success: false, message: 'You have already submitted a bid' });

        project.bids.push({
            bidderId: req.user._id,
            bidderName: `${req.user.firstName} ${req.user.lastName}`.trim(),
            bidderEmail: req.user.email,
            bidAmount: parseFloat(bidAmount),
            timeline,
            proposal,
        });
        await project.save();

        createNotification({
            user: project.clientId,
            type: 'general',
            title: 'New bid received',
            message: `${req.user.firstName || 'Someone'} bid ₹${bidAmount} on "${project.title}".`,
            link: '/freelancing',
        });

        return res.status(201).json({ success: true, message: 'Bid submitted successfully', project });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const updateBidStatus = async (req, res) => {
    try {
        const { bidId, status } = req.body;
        const project = await FreelanceProject.findOne({ _id: req.params.id, clientId: req.user._id });
        if (!project) return res.status(404).json({ success: false, message: 'Project not found or access denied' });

        const bid = project.bids.id(bidId);
        if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });

        bid.status = status;
        if (status === 'accepted') {
            project.assignedTo = bid.bidderId;
            project.status = 'in_progress';
            project.bids.forEach(b => { if (b._id.toString() !== bidId) b.status = 'rejected'; });
        }
        await project.save();

        createNotification({
            user: bid.bidderId,
            type: status === 'accepted' ? 'item_approved' : 'item_rejected',
            title: status === 'accepted' ? 'Your bid was accepted! 🎉' : 'Bid update',
            message: status === 'accepted'
                ? `You got the job! "${project.title}" — time to get started.`
                : `Your bid on "${project.title}" wasn't selected this time.`,
            link: '/freelancing',
        });
        if (status === 'accepted') {
            // let every other bidder know the project has been filled
            project.bids
                .filter(b => b._id.toString() !== bidId && b.status === 'rejected')
                .forEach(b => createNotification({
                    user: b.bidderId,
                    type: 'item_rejected',
                    title: 'Bid update',
                    message: `"${project.title}" has been assigned to another freelancer.`,
                    link: '/freelancing',
                }));
        }

        return res.status(200).json({ success: true, message: `Bid ${status}`, project });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Client rates the freelancer after project completion (one review per project)
// @route   POST /api/freelancers/:id/rate-freelancer
// @access  Private — must be the project's client, project must be completed
export const rateFreelancer = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const stars = Number(rating);
        if (!stars || stars < 1 || stars > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        const project = await FreelanceProject.findOne({ _id: req.params.id, clientId: req.user._id });
        if (!project) return res.status(404).json({ success: false, message: 'Project not found or access denied' });
        if (project.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'You can only rate a freelancer after the project is marked completed' });
        }
        if (!project.assignedTo) {
            return res.status(400).json({ success: false, message: 'No freelancer was assigned to this project' });
        }

        const alreadyReviewed = project.freelancerReview?.rating != null;

        project.freelancerReview = { rating: stars, comment: (comment || '').slice(0, 500), createdAt: new Date() };
        await project.save();

        // Recompute the freelancer's aggregate rating across all their reviewed projects
        const reviewedProjects = await FreelanceProject.find({
            assignedTo: project.assignedTo, 'freelancerReview.rating': { $ne: null },
        });
        const total = reviewedProjects.reduce((sum, p) => sum + p.freelancerReview.rating, 0);
        await User.findByIdAndUpdate(project.assignedTo, {
            freelancerRating: total / reviewedProjects.length,
            freelancerReviewCount: reviewedProjects.length,
        });

        if (!alreadyReviewed) {
            createNotification({
                user: project.assignedTo,
                type: 'general',
                title: 'New review received',
                message: `${req.user.firstName || 'A client'} left a ${stars}★ review for your work on "${project.title}".`,
                link: '/freelance',
            });
        }

        return res.status(200).json({ success: true, message: 'Review saved', project });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
