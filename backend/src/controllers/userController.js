// backend/src/controllers/userController.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { logAction } from './auditLogController.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin/SuperAdmin)
export const getAllUsers = async (req, res) => {
    try {
        const { role, branch, semester, search, page = 1, limit = 50 } = req.query;
        const query = {};

        if (role) query.role = role;
        if (branch) query.branch = branch;
        if (semester) query.semester = parseInt(semester);
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { rollNumber: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        return res.status(200).json({
            success: true,
            users,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
        });
    } catch (error) {
        console.error('Get all users error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
    try {
        const isSelfOrAdmin = req.user._id.toString() === req.params.id
            || ['admin', 'super_admin'].includes(req.user.role);

        // Full profile (email, phone, upiId, etc.) only for the owner or an
        // admin. Everyone else just gets public-facing fields, so a student
        // can't harvest another user's phone number / email by guessing IDs.
        const fields = isSelfOrAdmin
            ? '-password'
            : 'firstName middleName lastName role profileImage bio branch semester skills createdAt';

        const user = await User.findById(req.params.id).select(fields);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Get user by ID error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get user by email
// @route   GET /api/users/email/:email
// @access  Private
export const getUserByEmail = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.toLowerCase() }).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private
export const getUsersByRole = async (req, res) => {
    try {
        const users = await User.find({ role: req.params.role }).select('-password').sort({ createdAt: -1 });
        return res.status(200).json({ success: true, users, count: users.length });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = async (req, res) => {
    try {
        const { firstName, middleName, lastName, phone, bio, location, branch, semester, rollNumber, profileImage, upiId, skills } = req.body;

        // Only allow admins to update other users, regular users can only update themselves
        if (req.user._id.toString() !== req.params.id && !['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const updateFields = {};
        if (firstName !== undefined) updateFields.firstName = firstName.trim();
        if (middleName !== undefined) updateFields.middleName = middleName.trim();
        if (lastName !== undefined) updateFields.lastName = lastName.trim();
        if (phone !== undefined) updateFields.phone = phone.trim();
        if (bio !== undefined) updateFields.bio = bio;
        if (location !== undefined) updateFields.location = location.trim();
        if (branch !== undefined) updateFields.branch = branch;
        if (semester !== undefined) updateFields.semester = semester;
        if (rollNumber !== undefined) updateFields.rollNumber = rollNumber.trim();
        if (profileImage !== undefined) updateFields.profileImage = profileImage;
        if (upiId !== undefined) updateFields.upiId = upiId.trim();
        if (skills !== undefined) updateFields.skills = skills;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Change user password
// @route   PUT /api/users/:id/password
// @access  Private
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (SuperAdmin)
export const deleteUser = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Only super admins can delete users' });
        }

        if (req.user._id.toString() === req.params.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        logAction({ actor: req.user, action: 'delete_user', targetType: 'user', targetId: user._id, targetLabel: `${user.firstName} ${user.lastName || ''} (${user.email})` });

        return res.status(200).json({ success: true, message: 'User deleted permanently' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle user active status
// @route   PUT /api/users/:id/toggle-status
// @access  Private (Admin/SuperAdmin)
export const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.isActive = !user.isActive;
        await user.save({ validateBeforeSave: false });

        logAction({ actor: req.user, action: user.isActive ? 'activate_user' : 'deactivate_user', targetType: 'user', targetId: user._id, targetLabel: `${user.firstName} ${user.lastName || ''}` });

        return res.status(200).json({
            success: true,
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            user,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update UPI ID
// @route   PUT /api/users/:id/upi
// @access  Private
export const updateUpiId = async (req, res) => {
    try {
        // Only the account owner can change their own payout UPI ID —
        // otherwise an attacker could redirect someone else's withdrawals
        // to their own UPI ID.
        if (req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const { upiId } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { upiId },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, message: 'UPI ID updated', user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete your own account (requires password confirmation)
// @route   DELETE /api/users/me
// @access  Private — self only
export const deleteMe = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ success: false, message: 'Enter your password to confirm account deletion' });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect password' });

        // Super admins can't delete themselves via self-service — would risk
        // an org losing its only super admin. They'd need another super admin
        // to do it via the admin panel instead.
        if (user.role === 'super_admin') {
            return res.status(403).json({ success: false, message: 'Super admin accounts cannot be self-deleted. Ask another super admin to remove your account.' });
        }

        await logAction({ actor: req.user, action: 'self_delete_account', targetType: 'user', targetId: user._id, targetLabel: `${user.firstName} ${user.lastName || ''} (${user.email})` });

        await User.findByIdAndDelete(user._id);

        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });

        return res.status(200).json({ success: true, message: 'Your account has been deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
