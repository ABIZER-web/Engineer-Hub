// backend/src/routes/settingsRoutes.js
import express from 'express';
import { getAll, getByKey, getPublic, update, bulkUpdate } from '../controllers/settingsController.js';
import { protect, adminOnly, superAdminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/public',  getPublic);                          // public – no auth needed
router.get('/',        protect, adminOnly, getAll);
router.get('/:key',    protect, adminOnly, getByKey);
router.put('/bulk',    protect, superAdminOnly, bulkUpdate);
router.put('/',        protect, adminOnly, update);

export default router;
