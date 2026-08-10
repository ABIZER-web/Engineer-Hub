// backend/src/controllers/authController.js
import crypto from 'crypto';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';
import { welcomeEmail } from '../utils/emailTemplates.js';
import jwt from 'jsonwebtoken';

const MAX_LOGIN_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
const LOCK_TIME_MS = Number(process.env.LOCK_TIME_MINUTES || 15) * 60 * 1000;

const generateToken = (id) => {
    // JWT_EXPIRES_IN is intentionally unset by default now (see .env) — no
    // expiresIn means the token's `exp` claim is omitted entirely, so it
    // never expires. Set JWT_EXPIRES_IN (e.g. "7d") in .env to restore an
    // expiry if you change your mind later.
    const opts = process.env.JWT_EXPIRES_IN ? { expiresIn: process.env.JWT_EXPIRES_IN } : {};
    return jwt.sign({ id }, process.env.JWT_SECRET, opts);
};

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    // Matches the non-expiring token above — 10 years is the practical
    // ceiling browsers respect for "effectively forever."
    maxAge: 10 * 365 * 24 * 60 * 60 * 1000,
};

// @desc    Self-register (students/developers/admin with passcode)
// @route   POST /api/auth/self-register
// @access  Public
export const selfRegister = async (req, res) => {
    try {
        const { firstName, middleName, lastName, email, password, role, passcode, branch, semester, rollNumber } = req.body;

        if (!firstName || !email || !password) {
            return res.status(400).json({ success: false, message: 'First name, email, and password are required' });
        }

        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists' });
        }

        let userRole = 'student';
        if (role === 'developer') {
            userRole = 'developer';
        } else if (role === 'admin') {
            if (!process.env.ADMIN_PASSCODE || passcode !== process.env.ADMIN_PASSCODE) {
                return res.status(403).json({ success: false, message: 'Invalid admin passcode' });
            }
            userRole = 'admin';
        } else if (role === 'super_admin') {
            if (!process.env.SUPER_ADMIN_PASSCODE || passcode !== process.env.SUPER_ADMIN_PASSCODE) {
                return res.status(403).json({ success: false, message: 'Invalid super admin passcode' });
            }
            userRole = 'super_admin';
        }

        const user = await User.create({
            firstName: firstName.trim(),
            middleName: middleName?.trim() || '',
            lastName: lastName?.trim() || '',
            email: email.toLowerCase().trim(),
            password,
            role: userRole,
            branch: branch || '',
            semester: semester || null,
            rollNumber: rollNumber?.trim() || '',
            isEmailVerified: true,
        });

        const token = generateToken(user._id);

        res.cookie('token', token, cookieOptions);

        const { subject, html, text } = welcomeEmail(user);
        sendEmail({ to: user.email, subject, html, text }); // fire-and-forget — don't delay the response on SMTP

        return res.status(201).json({
            success: true,
            message: 'Account created successfully! Welcome to Engineer Hub.',
            user: {
                _id: user._id,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                branch: user.branch,
                semester: user.semester,
                rollNumber: user.rollNumber,
                profileImage: user.profileImage,
                token,
            },
        });
    } catch (error) {
        console.error('Self-register error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }
        return res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact admin.' });
        }

        if (user.isLocked()) {
            const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.status(423).json({
                success: false,
                message: `Account temporarily locked due to too many failed login attempts. Try again in ${minutesLeft} minute(s).`,
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
            }
            await user.save({ validateBeforeSave: false });
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        const token = generateToken(user._id);
        res.cookie('token', token, cookieOptions);

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                _id: user._id,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                branch: user.branch,
                semester: user.semester,
                rollNumber: user.rollNumber,
                profileImage: user.profileImage,
                phone: user.phone,
                bio: user.bio,
                upiId: user.upiId,
                token,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Server error during login' });
    }
};

// @desc    Get current user from token
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('GetMe error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });
        return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update user role (admin/super_admin only)
// @route   PUT /api/auth/update-role/:id
// @access  Private (Admin/Super Admin)
export const updateRole = async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ['student', 'developer', 'admin', 'super_admin'];

        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role specified' });
        }

        if (role === 'super_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Only super admins can assign super_admin role' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, message: 'Role updated successfully', user });
    } catch (error) {
        console.error('Update role error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Request a password reset token
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        const genericResponse = {
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.',
        };

        if (!user) return res.status(200).json(genericResponse);

        const rawToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
        await user.save({ validateBeforeSave: false });

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;

        await sendEmail({
            to: user.email,
            subject: 'Reset your Engineer Hub password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #059669;">Reset your password</h2>
                    <p>Hi ${user.firstName || 'there'},</p>
                    <p>We got a request to reset your Engineer Hub password. This link expires in 30 minutes.</p>
                    <p style="margin: 24px 0;">
                        <a href="${resetUrl}" style="background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a>
                    </p>
                    <p style="color:#64748b;font-size:13px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
                    <p style="color:#94a3b8;font-size:11px;word-break:break-all;">Or copy this link: ${resetUrl}</p>
                </div>
            `,
            text: `Reset your Engineer Hub password: ${resetUrl} (expires in 30 minutes)`,
        });

        return res.status(200).json({
            ...genericResponse,
            ...(process.env.NODE_ENV !== 'production' && { devResetUrl: resetUrl }),
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Reset password using a valid token
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        user.password = password;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        return res.status(200).json({ success: true, message: 'Password reset successfully. Please log in.' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
