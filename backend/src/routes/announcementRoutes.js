// backend/src/routes/announcementRoutes.js
import express from 'express';
import { getAll, getActive, getById, create, update, remove, toggleStatus } from '../controllers/announcementController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();
router.get('/',        protect, adminOnly, getAll);
router.get('/active',  protect, getActive);
router.get('/:id',     protect, getById);
router.post('/',       protect, adminOnly, create);
router.put('/:id',     protect, adminOnly, update);
router.delete('/:id',  protect, adminOnly, remove);
router.put('/:id/status', protect, adminOnly, toggleStatus);
export default router;
