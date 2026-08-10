// backend/src/controllers/announcementController.js
import Announcement from '../models/Announcement.js';

export const getAll = async (req, res) => {
  try {
    const a = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, announcements: a });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getActive = async (req, res) => {
  try {
    const now = new Date();
    const a = await Announcement.find({
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).sort({ createdAt: -1 });
    res.json({ success: true, announcements: a });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getById = async (req, res) => {
  try {
    const a = await Announcement.findById(req.params.id);
    if (!a) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, announcement: a });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const create = async (req, res) => {
  try {
    const { text, priority, expiresAt } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text is required' });
    const a = await Announcement.create({ text, priority, expiresAt: expiresAt || null, createdBy: req.user._id });
    res.status(201).json({ success: true, announcement: a });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const update = async (req, res) => {
  try {
    const a = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!a) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, announcement: a });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const remove = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const toggleStatus = async (req, res) => {
  try {
    const a = await Announcement.findById(req.params.id);
    if (!a) return res.status(404).json({ success: false, message: 'Not found' });
    a.active = !a.active;
    await a.save();
    res.json({ success: true, announcement: a });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
