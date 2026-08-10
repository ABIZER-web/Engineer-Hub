// backend/src/controllers/testimonialController.js
import Testimonial from '../models/Testimonial.js';

export const getAll = async (req, res) => {
  try {
    const t = await Testimonial.find().sort({ createdAt: -1 });
    res.json({ success: true, testimonials: t });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getApproved = async (req, res) => {
  try {
    const t = await Testimonial.find({ isApproved: true }).sort({ createdAt: -1 });
    res.json({ success: true, testimonials: t });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getPending = async (req, res) => {
  try {
    const t = await Testimonial.find({ isApproved: false }).sort({ createdAt: -1 });
    res.json({ success: true, testimonials: t });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getByUser = async (req, res) => {
  try {
    const t = await Testimonial.find({ userId: req.params.userId });
    res.json({ success: true, testimonials: t });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getCount = async (req, res) => {
  try {
    const count = await Testimonial.countDocuments({ isApproved: true });
    res.json({ success: true, count });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const create = async (req, res) => {
  try {
    const { rating, text } = req.body;
    if (!rating || !text) return res.status(400).json({ success: false, message: 'Rating and text required' });
    const t = await Testimonial.create({
      userId: req.user._id,
      userName: `${req.user.firstName} ${req.user.lastName}`.trim(),
      userRole: req.user.role,
      userImage: req.user.profileImage || '',
      branch: req.user.branch || '',
      rating: Number(rating),
      text,
    });
    res.status(201).json({ success: true, message: 'Submitted for review', testimonial: t });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const approve = async (req, res) => {
  try {
    const t = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    if (!t) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, testimonial: t });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const remove = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found' });

    const isOwner = testimonial.userId.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this testimonial' });
    }

    await testimonial.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
