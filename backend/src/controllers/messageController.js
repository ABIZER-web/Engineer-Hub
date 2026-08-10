// backend/src/controllers/messageController.js
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { createNotification } from './notificationController.js';

// @desc    Get (or create) a conversation with another user, optionally tied to
//          a marketplace item / freelance project so "Message seller" reuses
//          the same thread instead of spawning duplicates.
// @route   POST /api/messages/conversations
// @access  Private
export const getOrCreateConversation = async (req, res) => {
    try {
        const { otherUserId, contextType = 'general', contextId = null, contextLabel = '' } = req.body;
        if (!otherUserId) return res.status(400).json({ success: false, message: 'otherUserId is required' });
        if (otherUserId === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "You can't message yourself" });
        }

        const query = {
            participants: { $all: [req.user._id, otherUserId], $size: 2 },
            contextType,
        };
        if (contextId) query.contextId = contextId;

        let conversation = await Conversation.findOne(query);
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [req.user._id, otherUserId],
                contextType, contextId, contextLabel,
            });
        }

        return res.status(200).json({ success: true, conversation });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    List the current user's conversations, most recent first
// @route   GET /api/messages/conversations
// @access  Private
export const getMyConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({ participants: req.user._id })
            .populate('participants', 'firstName lastName email profileImage')
            .sort({ lastMessageAt: -1 })
            .limit(100);

        // unread count per conversation — messages in that thread not sent by me and not read by me
        const withUnread = await Promise.all(conversations.map(async (c) => {
            const unreadCount = await Message.countDocuments({
                conversation: c._id,
                sender: { $ne: req.user._id },
                readBy: { $ne: req.user._id },
            });
            return { ...c.toObject(), unreadCount };
        }));

        return res.status(200).json({ success: true, conversations: withUnread });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Get messages in a conversation (must be a participant)
// @route   GET /api/messages/conversations/:id
// @access  Private
export const getMessages = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
        if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
            return res.status(403).json({ success: false, message: 'Not a participant in this conversation' });
        }

        const messages = await Message.find({ conversation: req.params.id }).sort({ createdAt: 1 }).limit(200);

        // mark everything not sent by me as read
        await Message.updateMany(
            { conversation: req.params.id, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
            { $addToSet: { readBy: req.user._id } }
        );

        return res.status(200).json({ success: true, messages, conversation });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Send a message in a conversation (must be a participant)
// @route   POST /api/messages/conversations/:id
// @access  Private
export const sendMessage = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ success: false, message: 'Message cannot be empty' });

        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
        if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
            return res.status(403).json({ success: false, message: 'Not a participant in this conversation' });
        }

        const message = await Message.create({
            conversation: conversation._id,
            sender: req.user._id,
            senderName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
            text: text.trim().slice(0, 2000),
            readBy: [req.user._id],
        });

        conversation.lastMessageText = message.text.slice(0, 120);
        conversation.lastMessageAt = message.createdAt;
        conversation.lastMessageBy = req.user._id;
        await conversation.save();

        const recipient = conversation.participants.find(p => p.toString() !== req.user._id.toString());
        if (recipient) {
            createNotification({
                user: recipient,
                type: 'general',
                title: `New message from ${req.user.firstName || 'someone'}`,
                message: message.text.slice(0, 100),
                link: `/messages/${conversation._id}`,
            });
        }

        return res.status(201).json({ success: true, message });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Total unread message count across all conversations (for a nav badge)
// @route   GET /api/messages/unread-count
// @access  Private
export const getUnreadMessageCount = async (req, res) => {
    try {
        const myConversations = await Conversation.find({ participants: req.user._id }).select('_id');
        const count = await Message.countDocuments({
            conversation: { $in: myConversations.map(c => c._id) },
            sender: { $ne: req.user._id },
            readBy: { $ne: req.user._id },
        });
        return res.status(200).json({ success: true, count });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
