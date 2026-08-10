// backend/src/routes/testimonialRoutes.js
import express from 'express';
import { getAll, getApproved, getPending, getByUser, getCount, create, approve, remove } from '../controllers/testimonialController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();
router.get('/',              protect, adminOnly, getAll);
router.get('/approved',      protect, getApproved);
router.get('/pending',       protect, adminOnly, getPending);
router.get('/active/count',  protect, getCount);
router.get('/user/:userId',  protect, getByUser);
router.post('/',             protect, create);
router.put('/:id/approve',   protect, adminOnly, approve);
router.delete('/:id',        protect, remove);
export default router;
