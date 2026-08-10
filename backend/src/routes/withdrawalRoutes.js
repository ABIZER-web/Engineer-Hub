// backend/src/routes/withdrawalRoutes.js
import express from 'express';
import { getAll, getMine, getSummary, create, updateStatus, remove } from '../controllers/withdrawalController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/',                    protect, adminOnly, getAll);
router.get('/mine',                protect, getMine);
router.get('/summary/:userId',     protect, getSummary);
router.get('/summary',             protect, getSummary);
router.post('/',                   protect, create);
router.put('/:id/status',          protect, adminOnly, updateStatus);
router.delete('/:id',              protect, adminOnly, remove);

export default router;
