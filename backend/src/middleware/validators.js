// backend/src/middleware/validators.js
// Centralised input validation for the auth endpoints. Keeps controllers
// focused on business logic and stops obviously-bad input before it
// touches the database.
import { body, param, validationResult } from 'express-validator';

export const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};

export const validateRegister = [
    body('firstName').trim().notEmpty().withMessage('First name is required')
        .isLength({ max: 60 }).withMessage('First name is too long'),
    body('lastName').optional({ checkFalsy: true }).trim().isLength({ max: 60 }),
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .isLength({ max: 128 }).withMessage('Password is too long'),
    body('role').optional({ checkFalsy: true }).isIn(['student', 'developer', 'admin', 'super_admin'])
        .withMessage('Invalid role'),
    body('semester').optional({ checkFalsy: true }).isInt({ min: 1, max: 8 }).withMessage('Semester must be 1-8'),
    handleValidation,
];

export const validateLogin = [
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidation,
];

export const validateForgotPassword = [
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    handleValidation,
];

export const validateResetPassword = [
    param('token').isHexadecimal().withMessage('Invalid reset token').isLength({ min: 64, max: 64 }),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .isLength({ max: 128 }).withMessage('Password is too long'),
    handleValidation,
];
