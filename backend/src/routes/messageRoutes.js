// backend/src/routes/messageRoutes.js
import express from 'express';
import {
    getOrCreateConversation, getMyConversations, getMessages, sendMessage, getUnreadMessageCount
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/conversations',            protect, getOrCreateConversation);
router.get('/conversations',             protect, getMyConversations);
router.get('/conversations/:id',         protect, getMessages);
router.post('/conversations/:id',        protect, sendMessage);
router.get('/unread-count',              protect, getUnreadMessageCount);

export default router;
