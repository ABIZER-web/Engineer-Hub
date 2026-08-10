// backend/src/models/Conversation.js
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],

    // What this conversation is about — lets a "Message seller" button reuse an
    // existing thread instead of creating duplicates for the same item/project.
    contextType:  { type: String, enum: ['marketplace', 'freelance', 'general'], default: 'general' },
    contextId:    { type: mongoose.Schema.Types.ObjectId, default: null },
    contextLabel: { type: String, default: '' }, // snapshot, e.g. the item title

    lastMessageText: { type: String, default: '' },
    lastMessageAt:   { type: Date, default: Date.now },
    lastMessageBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

conversationSchema.index({ participants: 1 });
conversationSchema.index({ contextType: 1, contextId: 1 });
conversationSchema.index({ lastMessageAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
