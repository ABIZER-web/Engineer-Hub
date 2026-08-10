// backend/src/routes/freelancerRoutes.js
import express from 'express';
import {
    getAllProjects, getOpenProjects, getPendingProjects, getProjectById, getProjectsByClient,
    createProject, updateProject, deleteProject, submitBid, updateBidStatus, approveProject, rejectProject, bulkModerateProjects, rateFreelancer
} from '../controllers/freelanceController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getAllProjects);
router.get('/open', protect, getOpenProjects);
router.get('/pending', protect, adminOnly, getPendingProjects);
router.get('/client/:clientId', protect, getProjectsByClient);
router.post('/bulk-moderate', protect, adminOnly, bulkModerateProjects);
router.get('/:id', protect, getProjectById);
router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.put('/:id/approve', protect, adminOnly, approveProject);
router.put('/:id/reject', protect, adminOnly, rejectProject);
router.delete('/:id', protect, deleteProject);
router.post('/:id/bid', protect, submitBid);
router.put('/:id/bid-status', protect, updateBidStatus);
router.post('/:id/rate-freelancer', protect, rateFreelancer);

export default router;
