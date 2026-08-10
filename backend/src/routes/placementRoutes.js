// backend/src/routes/placementRoutes.js
import express from 'express';
import { getPlacements, createPlacement, updatePlacement, deletePlacement } from '../controllers/placementController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getPlacements);
router.post('/', protect, adminOnly, createPlacement);
router.put('/:id', protect, adminOnly, updatePlacement);
router.delete('/:id', protect, adminOnly, deletePlacement);

export default router;
