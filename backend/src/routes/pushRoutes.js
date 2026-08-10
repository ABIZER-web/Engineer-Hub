// backend/src/routes/pushRoutes.js
import express from 'express';
import { subscribe, unsubscribe } from '../controllers/pushController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/subscribe', protect, subscribe);
router.delete('/subscribe', protect, unsubscribe);

export default router;
