// backend/src/controllers/notificationController.js
import Notification from '../models/Notification.js';
import { sendPushToUser, sendPushToUsers } from '../utils/sendPush.js';

// Internal helper — call this from other controllers to raise a notification.
// Never throws: a notification failure should never break the action that triggered it.
export const createNotification = async ({ user, type = 'general', title, message, link = '' }) => {
    try {
        if (!user || !title || !message) return null;
        const notification = await Notification.create({ user, type, title, message, link });
        sendPushToUser(user, { title, body: message, url: link || '/' }); // fire-and-forget — no-op if push isn't configured
        return notification;
    } catch (error) {
        console.error('createNotification error:', error.message);
        return null;
    }
};

// Broadcast helper — notifies many users at once (e.g. a new placement drive or
// announcement). Uses insertMany for efficiency instead of one create() per user.
// Never throws: a notification failure should never break the action that triggered it.
export const broadcastNotification = async ({ userIds, type = 'announcement', title, message, link = '' }) => {
    try {
        if (!userIds?.length || !title || !message) return null;
        const docs = userIds.map(user => ({ user, type, title, message, link }));
        const created = await Notification.insertMany(docs, { ordered: false });
        sendPushToUsers(userIds, { title, body: message, url: link || '/' }); // fire-and-forget
        return created;
    } catch (error) {
        console.error('broadcastNotification error:', error.message);
        return null;
    }
};

// @desc    Get current user's notifications (most recent first, capped)
// @route   GET /api/notifications
// @access  Private
export const getMine = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get count of unread notifications for the badge
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id }, // scoped to owner — no IDOR
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark all of the current user's notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const remove = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
