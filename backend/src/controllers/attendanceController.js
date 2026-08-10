// backend/src/controllers/attendanceController.js
import Attendance from '../models/Attendance.js';

// @desc    Get lectures for a user, optionally filtered by day
// @route   GET /api/attendance/lectures/:userId
// @access  Private
export const getUserLectures = async (req, res) => {
    try {
        const query = { userId: req.params.userId, isActive: true };
        if (req.query.day) query.dayOfWeek = req.query.day;

        const lectures = await Attendance.find(query).sort({ dayOfWeek: 1, startTime: 1 });
        return res.status(200).json({ success: true, lectures });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get attendance history for a user
// @route   GET /api/attendance/history/:userId
// @access  Private
export const getAttendanceHistory = async (req, res) => {
    try {
        const lectures = await Attendance.find({ userId: req.params.userId, isActive: true });
        return res.status(200).json({ success: true, lectures });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get attendance stats for a user
// @route   GET /api/attendance/user/:userId/stats
// @access  Private
export const getAttendanceStats = async (req, res) => {
    try {
        const lectures = await Attendance.find({ userId: req.params.userId, isActive: true });

        let totalClasses = 0;
        let totalPresent = 0;
        const subjectStats = [];

        lectures.forEach((lec) => {
            totalClasses += lec.totalClasses;
            totalPresent += lec.presentCount;
            subjectStats.push({
                subject: lec.subject,
                totalClasses: lec.totalClasses,
                presentCount: lec.presentCount,
                absentCount: lec.absentCount,
                percentage: lec.totalClasses > 0
                    ? parseFloat(((lec.presentCount / lec.totalClasses) * 100).toFixed(2))
                    : 0,
            });
        });

        const overallPercentage = totalClasses > 0
            ? parseFloat(((totalPresent / totalClasses) * 100).toFixed(2))
            : 0;

        return res.status(200).json({
            success: true,
            stats: {
                totalSubjects: lectures.length,
                totalClasses,
                totalPresent,
                totalAbsent: totalClasses - totalPresent,
                overallPercentage,
                subjectStats,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new lecture
// @route   POST /api/attendance/lectures
// @access  Private
export const createLecture = async (req, res) => {
    try {
        const { subject, subjectCode, professor, dayOfWeek, startTime, endTime, room, branch, semester } = req.body;

        if (!subject || !dayOfWeek || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'Subject, day, start time and end time are required' });
        }

        const lecture = await Attendance.create({
            userId: req.user._id,
            subject: subject.trim(),
            subjectCode: subjectCode?.trim() || '',
            professor: professor?.trim() || '',
            dayOfWeek,
            startTime,
            endTime,
            room: room?.trim() || '',
            branch: branch || req.user.branch || '',
            semester: semester || req.user.semester || null,
        });

        return res.status(201).json({ success: true, message: 'Lecture created successfully', lecture });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update lecture details
// @route   PUT /api/attendance/lectures/:id
// @access  Private
export const updateLecture = async (req, res) => {
    try {
        const lecture = await Attendance.findOne({ _id: req.params.id, userId: req.user._id });
        if (!lecture) {
            return res.status(404).json({ success: false, message: 'Lecture not found or access denied' });
        }

        const fields = ['subject', 'subjectCode', 'professor', 'dayOfWeek', 'startTime', 'endTime', 'room'];
        fields.forEach((f) => { if (req.body[f] !== undefined) lecture[f] = req.body[f]; });
        await lecture.save();

        return res.status(200).json({ success: true, message: 'Lecture updated', lecture });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete lecture
// @route   DELETE /api/attendance/lectures/:id
// @access  Private
export const deleteLecture = async (req, res) => {
    try {
        const lecture = await Attendance.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!lecture) {
            return res.status(404).json({ success: false, message: 'Lecture not found or access denied' });
        }
        return res.status(200).json({ success: true, message: 'Lecture deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark attendance for a lecture on a specific date
// @route   POST /api/attendance/mark/:lectureId
// @access  Private
export const markAttendance = async (req, res) => {
    try {
        const { date, status } = req.body;
        const validStatuses = ['present', 'absent', 'cancelled', 'holiday'];

        if (!date || !status) {
            return res.status(400).json({ success: false, message: 'Date and status are required' });
        }
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        const lecture = await Attendance.findOne({ _id: req.params.lectureId, userId: req.user._id });
        if (!lecture) {
            return res.status(404).json({ success: false, message: 'Lecture not found or access denied' });
        }

        const attendanceDate = new Date(date);
        const existingIdx = lecture.records.findIndex(
            (r) => new Date(r.date).toDateString() === attendanceDate.toDateString()
        );

        const oldStatus = existingIdx !== -1 ? lecture.records[existingIdx].status : null;

        if (existingIdx !== -1) {
            // Update existing record
            if (oldStatus === 'present') lecture.presentCount = Math.max(0, lecture.presentCount - 1);
            if (oldStatus === 'absent') lecture.absentCount = Math.max(0, lecture.absentCount - 1);
            if (oldStatus === 'present' || oldStatus === 'absent') lecture.totalClasses = Math.max(0, lecture.totalClasses - 1);

            lecture.records[existingIdx].status = status;
            lecture.records[existingIdx].markedAt = new Date();
        } else {
            lecture.records.push({ date: attendanceDate, status, markedAt: new Date() });
        }

        if (status === 'present') { lecture.presentCount += 1; lecture.totalClasses += 1; }
        else if (status === 'absent') { lecture.absentCount += 1; lecture.totalClasses += 1; }

        await lecture.save();

        return res.status(200).json({ success: true, message: 'Attendance marked successfully', lecture });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reset all attendance for a lecture
// @route   PUT /api/attendance/lectures/:id/reset
// @access  Private
export const resetLectureAttendance = async (req, res) => {
    try {
        const lecture = await Attendance.findOne({ _id: req.params.id, userId: req.user._id });
        if (!lecture) {
            return res.status(404).json({ success: false, message: 'Lecture not found' });
        }

        lecture.records = [];
        lecture.totalClasses = 0;
        lecture.presentCount = 0;
        lecture.absentCount = 0;
        await lecture.save();

        return res.status(200).json({ success: true, message: 'Attendance reset successfully', lecture });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
