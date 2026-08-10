// backend/src/routes/resourceRoutes.js
import express from 'express';
import {
    getAllResources, getApprovedResources, getPendingResources,
    getResourcesByUser, getResourceById, createResource,
    updateResource, deleteResource, approveResource, rejectResource, bulkModerateResources, incrementDownloads
} from '../controllers/resourceController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getApprovedResources);
router.get('/all', protect, adminOnly, getAllResources);
router.get('/approved', protect, getApprovedResources);
router.get('/pending', protect, adminOnly, getPendingResources);
router.get('/user/:userId', protect, getResourcesByUser);
router.post('/bulk-moderate', protect, adminOnly, bulkModerateResources);
router.get('/:id', protect, getResourceById);
router.post('/', protect, createResource);
router.put('/:id', protect, updateResource);
router.put('/:id/approve', protect, adminOnly, approveResource);
router.put('/:id/reject', protect, adminOnly, rejectResource);
router.put('/:id/download', protect, incrementDownloads);
router.delete('/:id', protect, deleteResource);

export default router;
