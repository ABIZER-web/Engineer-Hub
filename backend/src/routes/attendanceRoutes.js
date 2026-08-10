// backend/src/routes/attendanceRoutes.js
import express from 'express';
import {
    getUserLectures, getAttendanceHistory, getAttendanceStats,
    createLecture, updateLecture, deleteLecture, markAttendance, resetLectureAttendance
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/lectures/:userId', protect, getUserLectures);
router.get('/history/:userId', protect, getAttendanceHistory);
router.get('/user/:userId/stats', protect, getAttendanceStats);
router.get('/user/:userId/history', protect, getAttendanceHistory);
router.post('/lectures', protect, createLecture);
router.put('/lectures/:id', protect, updateLecture);
router.put('/lectures/:id/reset', protect, resetLectureAttendance);
router.delete('/lectures/:id', protect, deleteLecture);
router.post('/mark/:lectureId', protect, markAttendance);

export default router;
