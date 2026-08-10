// backend/src/models/Event.js
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    eventType: {
        type: String,
        enum: ['hackathon', 'workshop', 'seminar', 'competition', 'cultural', 'sports', 'placement', 'other'],
        default: 'other'
    },
    date: { type: Date, required: true },
    endDate: { type: Date, default: null },
    time: { type: String, default: '' },
    venue: { type: String, trim: true, default: '' },
    organizer: { type: String, trim: true, default: '' },
    registrationLink: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    prize: { type: String, default: '' },
    fee: { type: Number, default: 0 },
    maxParticipants: { type: Number, default: null },
    registeredCount: { type: Number, default: 0 },
    interestedCount: { type: Number, default: 0 },
    registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true
});

eventSchema.index({ date: 1 });
eventSchema.index({ isActive: 1 });

const Event = mongoose.model('Event', eventSchema);
export default Event;
