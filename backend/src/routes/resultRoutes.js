// backend/src/routes/resultRoutes.js
import express from 'express';
import {
    getAllResults, getApprovedResults, getPendingResults, getResultsByUser,
    getResultById, createResult, updateResult, deleteResult, approveResult
} from '../controllers/resultController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, adminOnly, getAllResults);
router.get('/approved', protect, getApprovedResults);
router.get('/pending', protect, adminOnly, getPendingResults);
router.get('/user/:userId', protect, getResultsByUser);
router.get('/:id', protect, getResultById);
router.post('/', protect, createResult);
router.put('/:id', protect, updateResult);
router.put('/:id/approve', protect, adminOnly, approveResult);
router.delete('/:id', protect, adminOnly, deleteResult);

export default router;
