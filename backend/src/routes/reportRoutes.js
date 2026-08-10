// backend/src/routes/reportRoutes.js
import express from 'express';
import { createReport, getReports, resolveReport, bulkResolveReports } from '../controllers/reportController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createReport);
router.get('/', protect, adminOnly, getReports);
router.post('/bulk-resolve', protect, adminOnly, bulkResolveReports);
router.put('/:id/resolve', protect, adminOnly, resolveReport);

export default router;
