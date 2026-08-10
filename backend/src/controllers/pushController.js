// backend/src/controllers/pushController.js
import PushSubscription from '../models/PushSubscription.js';

// @desc    Save a browser's push subscription for the current user
// @route   POST /api/push/subscribe
// @access  Private
export const subscribe = async (req, res) => {
    try {
        const { endpoint, keys, userAgent } = req.body;
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ success: false, message: 'Invalid subscription payload' });
        }

        // upsert by endpoint — the same browser re-subscribing (e.g. after a permission
        // reset) should update, not duplicate
        await PushSubscription.findOneAndUpdate(
            { endpoint },
            { user: req.user._id, endpoint, keys, userAgent: userAgent || '' },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.status(201).json({ success: true, message: 'Push subscription saved' });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Remove a push subscription (e.g. user disabled notifications)
// @route   DELETE /api/push/subscribe
// @access  Private
export const unsubscribe = async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (!endpoint) return res.status(400).json({ success: false, message: 'Endpoint is required' });

        // scoped to the current user — can't delete someone else's subscription by guessing an endpoint
        await PushSubscription.deleteOne({ endpoint, user: req.user._id });
        return res.status(200).json({ success: true, message: 'Unsubscribed' });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
