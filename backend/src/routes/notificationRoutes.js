// backend/src/routes/notificationRoutes.js
import express from 'express';
import {
    getMine, getUnreadCount, markAsRead, markAllAsRead, remove,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Every notification route is private and scoped to req.user — enforced
// again inside the controller so one user can never touch another's rows.
router.use(protect);

router.get('/',               getMine);
router.get('/unread-count',   getUnreadCount);
router.put('/read-all',       markAllAsRead);
router.put('/:id/read',       markAsRead);
router.delete('/:id',         remove);

export default router;
