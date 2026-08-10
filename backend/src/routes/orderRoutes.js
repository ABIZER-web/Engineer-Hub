// backend/src/routes/orderRoutes.js
import express from 'express';
import { getAll, getByUser, getBySeller, getById, create, updateStatus, markPayout } from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();
router.get('/',                    protect, adminOnly, getAll);
router.get('/user/:userId',        protect, getByUser);
router.get('/seller/:sellerEmail', protect, getBySeller);
router.get('/:id',                 protect, getById);
router.post('/',                   protect, create);
router.put('/:id/status',          protect, updateStatus);
router.put('/:id/payout',          protect, adminOnly, markPayout);
export default router;


// ─── earningRoutes.js ─────────────────────────────────────────────────────
// (inline — loaded as its own file below)
