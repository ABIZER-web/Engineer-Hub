// backend/src/models/PushSubscription.js
import mongoose from 'mongoose';

// One document per browser/device a user has enabled push on — a user can
// have several (phone, laptop, etc.), so this is not embedded on User.
const pushSubscriptionSchema = new mongoose.Schema({
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
        p256dh: { type: String, required: true },
        auth:   { type: String, required: true },
    },
    userAgent: { type: String, default: '' },
}, { timestamps: true });

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
export default PushSubscription;
