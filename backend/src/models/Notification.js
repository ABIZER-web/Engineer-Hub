// backend/src/models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
        type: String,
        enum: [
            'order_placed', 'order_status', 'item_approved', 'item_rejected',
            'withdrawal_update', 'announcement', 'general',
        ],
        default: 'general',
    },
    title:   { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    link:    { type: String, default: '' },        // relative frontend route, e.g. '/purchases'
    isRead:  { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

// Auto-expire read notifications after 60 days to keep the collection lean
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
