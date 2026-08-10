// backend/src/routes/eventRoutes.js
import express from 'express';
import {
    getAllEvents, getUpcomingEvents, getPastEvents, getEventById,
    createEvent, updateEvent, deleteEvent, registerForEvent
} from '../controllers/eventController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getAllEvents);
router.get('/upcoming', protect, getUpcomingEvents);
router.get('/past', protect, getPastEvents);
router.get('/:id', protect, getEventById);
router.post('/', protect, adminOnly, createEvent);
router.put('/:id', protect, adminOnly, updateEvent);
router.delete('/:id', protect, adminOnly, deleteEvent);
router.post('/:eventId/register', protect, registerForEvent);

export default router;
