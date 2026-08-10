// backend/src/controllers/eventController.js
import Event from '../models/Event.js';

export const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find({ isActive: true }).sort({ date: -1 });
        return res.status(200).json({ success: true, events });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getUpcomingEvents = async (req, res) => {
    try {
        const events = await Event.find({ date: { $gte: new Date() }, isActive: true }).sort({ date: 1 });
        return res.status(200).json({ success: true, events });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getPastEvents = async (req, res) => {
    try {
        const events = await Event.find({ date: { $lt: new Date() }, isActive: true }).sort({ date: -1 });
        return res.status(200).json({ success: true, events });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
        return res.status(200).json({ success: true, event });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const createEvent = async (req, res) => {
    try {
        const { title, description, eventType, date, endDate, time, venue, organizer, registrationLink, imageUrl, prize, fee, maxParticipants, tags } = req.body;
        if (!title || !date) return res.status(400).json({ success: false, message: 'Title and date are required' });
        const event = await Event.create({
            title: title.trim(), description, eventType, date, endDate, time,
            venue, organizer, registrationLink, imageUrl, prize, fee,
            maxParticipants, tags: tags || [],
            createdBy: req.user._id,
        });
        return res.status(201).json({ success: true, message: 'Event created successfully', event });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const updateEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
        return res.status(200).json({ success: true, event });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
        return res.status(200).json({ success: true, message: 'Event deleted' });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

export const registerForEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        const userId = req.user._id;
        const alreadyRegistered = event.registeredUsers.some(id => id.toString() === userId.toString());

        if (alreadyRegistered) {
            // Unregister
            event.registeredUsers = event.registeredUsers.filter(id => id.toString() !== userId.toString());
            event.registeredCount = Math.max(0, event.registeredCount - 1);
        } else {
            if (event.maxParticipants && event.registeredCount >= event.maxParticipants) {
                return res.status(400).json({ success: false, message: 'Event is fully booked' });
            }
            event.registeredUsers.push(userId);
            event.registeredCount += 1;
        }

        await event.save();
        return res.status(200).json({
            success: true,
            message: alreadyRegistered ? 'Unregistered from event' : 'Registered for event',
            event,
            isRegistered: !alreadyRegistered,
        });
    } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
