// backend/src/routes/userRoutes.js
import express from 'express';
import {
    getAllUsers, getUserById, getUserByEmail, getUsersByRole,
    updateUser, changePassword, deleteUser, deleteMe, toggleUserStatus, updateUpiId
} from '../controllers/userController.js';
import { protect, adminOnly, superAdminOnly } from '../middleware/auth.js';

const router = express.Router();

// User management
router.get('/',              protect, adminOnly,     getAllUsers);
router.get('/role/:role',    protect,                getUsersByRole);
// Email lookup returns full PII (phone, email, upiId) — admin-only to
// prevent it being used as a user-enumeration / data-harvesting endpoint.
router.get('/email/:email',  protect, adminOnly,      getUserByEmail);
// Must come before /:id — otherwise Express would treat "me" as an :id param
router.delete('/me',         protect,                deleteMe);
router.get('/:id',           protect,                getUserById);
router.put('/:id',           protect,                updateUser);
router.put('/:id/password',  protect,                changePassword);
router.put('/:id/upi',       protect,                updateUpiId);
router.put('/:id/toggle-status', protect, adminOnly, toggleUserStatus);
router.delete('/:id',        protect, superAdminOnly, deleteUser);

export default router;
