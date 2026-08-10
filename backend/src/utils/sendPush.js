// backend/src/utils/sendPush.js
import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';

let configured = false;
const isConfigured = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

const ensureConfigured = () => {
    if (configured || !isConfigured()) return;
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:support@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
    configured = true;
};

/**
 * Sends a push notification to every device a user has subscribed on.
 * Never throws — a push failure should never break the action that triggered it.
 * Dead subscriptions (410 Gone / 404) are cleaned up automatically.
 */
export const sendPushToUser = async (userId, { title, body, url = '/' }) => {
    if (!isConfigured()) return; // silently no-op if VAPID keys aren't set — same graceful pattern as sendEmail
    ensureConfigured();

    try {
        const subs = await PushSubscription.find({ user: userId });
        if (!subs.length) return;

        const payload = JSON.stringify({ title, body, url });

        await Promise.all(subs.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: sub.keys },
                    payload
                );
            } catch (err) {
                // 404/410 means the browser has revoked this subscription — remove it
                if (err.statusCode === 404 || err.statusCode === 410) {
                    await PushSubscription.deleteOne({ _id: sub._id });
                } else {
                    console.error('sendPush error:', err.message);
                }
            }
        }));
    } catch (error) {
        console.error('sendPushToUser error:', error.message);
    }
};

/** Same as above, for many users at once (e.g. a placement drive broadcast). */
export const sendPushToUsers = async (userIds, payload) => {
    if (!isConfigured() || !userIds?.length) return;
    await Promise.all(userIds.map(id => sendPushToUser(id, payload)));
};
