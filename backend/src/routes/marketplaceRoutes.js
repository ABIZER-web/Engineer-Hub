// backend/src/routes/marketplaceRoutes.js
import express from 'express';
import {
    getAllItems, getApprovedItems, getPendingItems, getItemsByUser,
    getItemById, createItem, updateItem, deleteItem, approveItem, bulkModerateItems, addReview
} from '../controllers/marketplaceController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getApprovedItems);
router.get('/all', protect, adminOnly, getAllItems);
router.get('/pending', protect, adminOnly, getPendingItems);
router.get('/status/:status', protect, getApprovedItems);
router.get('/user/:userId', protect, getItemsByUser);
router.post('/bulk-moderate', protect, adminOnly, bulkModerateItems);
router.get('/:id', protect, getItemById);
router.post('/', protect, createItem);
router.post('/:id/review', protect, addReview);
router.put('/:id', protect, updateItem);
router.put('/:id/approve', protect, adminOnly, approveItem);
router.delete('/:id', protect, deleteItem);

export default router;
