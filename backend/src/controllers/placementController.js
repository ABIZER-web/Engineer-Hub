// backend/src/controllers/placementController.js
import Placement from '../models/Placement.js';
import User from '../models/User.js';
import { broadcastNotification } from './notificationController.js';
import { sendEmail } from '../utils/sendEmail.js';
import { placementDriveEmail } from '../utils/emailTemplates.js';
import fs from 'fs';
import path from 'path';

// @desc    List active placement/internship drives (all authenticated users)
// @route   GET /api/placements?type=&branch=
// @access  Private
export const getPlacements = async (req, res) => {
    try {
        const { type, branch, page = 1, limit = 24 } = req.query;
        const query = { isActive: true };
        if (type && type !== 'all') query.type = type;
        if (branch && branch !== 'All') query.branch = { $in: [branch, 'All'] };

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(60, Math.max(1, parseInt(limit)));

        const [placements, totalCount] = await Promise.all([
            Placement.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
            Placement.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true, placements,
            page: pageNum, totalPages: Math.ceil(totalCount / limitNum), totalCount, hasMore: pageNum * limitNum < totalCount,
        });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Create a placement/internship drive
// @route   POST /api/placements
// @access  Private/Admin
export const createPlacement = async (req, res) => {
    try {
        const { title, company, description, type, branch, minSemester, package: pkg, location, deadline, applyLink, posterUrl } = req.body;
        if (!title || !company) return res.status(400).json({ success: false, message: 'Title and company are required' });
        if (applyLink && !/^https?:\/\//i.test(applyLink.trim())) {
            return res.status(400).json({ success: false, message: 'Apply link must be a valid http(s) URL' });
        }

        const placement = await Placement.create({
            title, company, description: description || '',
            type: type === 'internship' ? 'internship' : 'placement',
            branch: branch || 'All',
            minSemester: minSemester || null,
            package: pkg || '',
            location: location || '',
            deadline: deadline || null,
            applyLink: applyLink || '',
            posterUrl: posterUrl || '',
            postedBy: req.user._id,
        });

        notifyStudentsOfPlacement(placement); // fire-and-forget

        return res.status(201).json({ success: true, placement });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// Fire-and-forget — don't block the response on notifying every matching student
const notifyStudentsOfPlacement = async (placement) => {
    const query = { isActive: true, role: 'student' };
    if (placement.branch !== 'All') query.branch = { $in: [placement.branch, ''] };
    const students = await User.find(query).select('_id firstName email');
    if (!students.length) return;

    await broadcastNotification({
        userIds: students.map(s => s._id),
        type: 'announcement',
        title: `New ${placement.type === 'internship' ? 'internship' : 'placement'} drive: ${placement.company}`,
        message: `${placement.title} at ${placement.company}${placement.deadline ? ` — apply by ${new Date(placement.deadline).toLocaleDateString('en-IN')}` : ''}.`,
        link: '/placements',
    });

    // Email is capped and gently staggered — raw SMTP (Gmail etc.) will get rate-limited
    // or flagged as spam past a few hundred sends. For a larger student body, swap
    // sendEmail's transport for a bulk provider (SendGrid/Mailgun/SES) instead of
    // raising this cap.
    const EMAIL_CAP = 300;
    const STAGGER_MS = 150;
    students.slice(0, EMAIL_CAP).forEach((student, i) => {
        if (!student.email) return;
        setTimeout(() => {
            const mail = placementDriveEmail({
                studentName: student.firstName, title: placement.title,
                company: placement.company, type: placement.type, deadline: placement.deadline,
            });
            sendEmail({ to: student.email, ...mail });
        }, i * STAGGER_MS);
    });
};

// @desc    Update a placement/internship drive
// @route   PUT /api/placements/:id
// @access  Private/Admin
export const updatePlacement = async (req, res) => {
    try {
        const EDITABLE_FIELDS = ['title', 'company', 'description', 'type', 'branch', 'minSemester', 'package', 'location', 'deadline', 'applyLink', 'posterUrl', 'isActive'];
        const updates = {};
        for (const field of EDITABLE_FIELDS) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }
        if (updates.applyLink && !/^https?:\/\//i.test(String(updates.applyLink).trim())) {
            return res.status(400).json({ success: false, message: 'Apply link must be a valid http(s) URL' });
        }

        const placement = await Placement.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!placement) return res.status(404).json({ success: false, message: 'Placement not found' });
        return res.status(200).json({ success: true, placement });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Delete a placement/internship drive (and its poster file, if local)
// @route   DELETE /api/placements/:id
// @access  Private/Admin
export const deletePlacement = async (req, res) => {
    try {
        const placement = await Placement.findByIdAndDelete(req.params.id);
        if (!placement) return res.status(404).json({ success: false, message: 'Placement not found' });

        if (placement.posterUrl?.startsWith('/uploads/posters/')) {
            const filePath = path.join(process.cwd(), placement.posterUrl);
            fs.unlink(filePath, () => {}); // best-effort cleanup, don't fail the request over it
        }

        return res.status(200).json({ success: true, message: 'Placement deleted' });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
