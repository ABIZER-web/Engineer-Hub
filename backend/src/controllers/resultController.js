// backend/src/controllers/resultController.js
import Result from '../models/Result.js';

export const getAllResults = async (req, res) => {
    try {
        const results = await Result.find().populate('userId', 'firstName lastName email branch').sort({ createdAt: -1 });
        return res.status(200).json({ success: true, results });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getApprovedResults = async (req, res) => {
    try {
        const results = await Result.find({ isApproved: true }).sort({ semester: -1 });
        return res.status(200).json({ success: true, results });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getPendingResults = async (req, res) => {
    try {
        const results = await Result.find({ isApproved: false }).populate('userId', 'firstName lastName email').sort({ createdAt: -1 });
        return res.status(200).json({ success: true, results });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getResultsByUser = async (req, res) => {
    try {
        const isSelf = req.params.userId === req.user._id.toString();
        const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
        if (!isSelf && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to view these results' });
        }
        const results = await Result.find({ userId: req.params.userId }).sort({ semester: -1 });
        return res.status(200).json({ success: true, results });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getResultById = async (req, res) => {
    try {
        const result = await Result.findById(req.params.id).populate('userId', 'firstName lastName email');
        if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

        const isSelf = result.userId._id.toString() === req.user._id.toString();
        const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
        if (!isSelf && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this result' });
        }

        return res.status(200).json({ success: true, result });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// India's standard 10-point CBCS grade scale (O=10 ... F=0)
const GRADE_POINTS = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, D: 4, F: 0 };

// Credit-weighted SGPA = Σ(credits × gradePoint) / Σcredits, using only graded subjects
const computeSgpa = (subjects = []) => {
    const graded = subjects.filter(s => GRADE_POINTS[s.grade] !== undefined);
    if (!graded.length) return null;
    const totalCredits = graded.reduce((sum, s) => sum + (s.credits || 3), 0);
    if (!totalCredits) return null;
    const weighted = graded.reduce((sum, s) => sum + GRADE_POINTS[s.grade] * (s.credits || 3), 0);
    return Math.round((weighted / totalCredits) * 100) / 100;
};

export const createResult = async (req, res) => {
    try {
        const { semester, academicYear, examType, subjects, totalPercentage, resultStatus, remarks } = req.body;
        if (!semester || !academicYear) return res.status(400).json({ success: false, message: 'Semester and academic year are required' });

        const cleanSubjects = (subjects || []).map(s => ({ ...s, gradePoints: GRADE_POINTS[s.grade] ?? null, credits: s.credits || 3 }));

        const result = await Result.create({
            userId: req.user._id,
            semester, academicYear, examType, subjects: cleanSubjects,
            sgpa: computeSgpa(cleanSubjects), // server-computed — the client-supplied sgpa is never trusted
            totalPercentage, resultStatus, remarks,
        });
        return res.status(201).json({ success: true, message: 'Result submitted successfully', result });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const updateResult = async (req, res) => {
    try {
        const EDITABLE_FIELDS = ['examType', 'semester', 'academicYear', 'subjects', 'remarks'];
        const updates = {};
        for (const field of EDITABLE_FIELDS) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }
        if (updates.subjects) {
            updates.subjects = updates.subjects.map(s => ({ ...s, gradePoints: GRADE_POINTS[s.grade] ?? null, credits: s.credits || 3 }));
            updates.sgpa = computeSgpa(updates.subjects);
        }

        const existing = await Result.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: 'Result not found' });

        const isOwner = existing.userId.toString() === req.user._id.toString();
        const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this result' });
        }
        // Editing a result puts it back into review — a student can't silently
        // keep an already-approved status after changing their own marks.
        if (isOwner && !isAdmin) updates.isApproved = false;

        const result = await Result.findByIdAndUpdate(req.params.id, updates, { new: true });
        return res.status(200).json({ success: true, result });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const deleteResult = async (req, res) => {
    try {
        await Result.findByIdAndDelete(req.params.id);
        return res.status(200).json({ success: true, message: 'Result deleted' });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const approveResult = async (req, res) => {
    try {
        const result = await Result.findByIdAndUpdate(
            req.params.id,
            { isApproved: true, approvedBy: req.user._id, approvedAt: new Date() },
            { new: true }
        );
        if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
        return res.status(200).json({ success: true, message: 'Result approved', result });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
