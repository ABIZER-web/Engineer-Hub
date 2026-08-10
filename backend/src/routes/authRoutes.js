// backend/src/routes/authRoutes.js
import express from 'express';
import {
    selfRegister, loginUser, getMe, logoutUser, updateRole,
    forgotPassword, resetPassword,
} from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
    validateRegister, validateLogin, validateForgotPassword, validateResetPassword,
} from '../middleware/validators.js';

const router = express.Router();

// Both /register aliases so frontend POST /api/users/register AND /api/auth/... both work
router.post('/register',              validateRegister, selfRegister);
router.post('/self-register',         validateRegister, selfRegister);
router.post('/login',                 validateLogin, loginUser);
router.post('/logout',                protect, logoutUser);
router.get('/me',                     protect, getMe);
router.put('/update-role/:id',        protect, adminOnly, updateRole);
router.post('/forgot-password',       authLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password/:token', authLimiter, validateResetPassword, resetPassword);

export default router;
