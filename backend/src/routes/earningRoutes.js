// backend/src/routes/earningRoutes.js
import express from 'express';
import Order from '../models/Order.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Platform-wide stats (admin)
router.get('/platform/stats', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({ status: 'completed' });
    const totalRevenue = orders.reduce((s, o) => s + (o.amount || 0), 0);
    const platformFees = orders.reduce((s, o) => s + (o.platformFee || 0), 0);
    const sellerPayouts = orders.reduce((s, o) => s + (o.sellerEarning || 0), 0);
    const pendingPayouts = await Order.countDocuments({ payoutStatus: 'pending', status: 'completed' });
    res.json({ success: true, stats: { totalRevenue, platformFees, sellerPayouts, pendingPayouts, totalOrders: orders.length } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Sellers list (admin)
router.get('/sellers', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({ status: 'completed' });
    const map = {};
    orders.forEach(o => {
      if (!map[o.sellerEmail]) map[o.sellerEmail] = { sellerEmail: o.sellerEmail, sellerName: o.sellerName, sellerId: o.sellerId, totalEarned: 0, pendingPayout: 0, orders: 0 };
      map[o.sellerEmail].orders++;
      map[o.sellerEmail].totalEarned += o.sellerEarning || 0;
      if (o.payoutStatus === 'pending') map[o.sellerEmail].pendingPayout += o.sellerEarning || 0;
    });
    res.json({ success: true, sellers: Object.values(map) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Single seller stats
router.get('/seller/:sellerEmail', protect, async (req, res) => {
  try {
    const orders = await Order.find({ sellerEmail: req.params.sellerEmail, status: 'completed' })
      .populate('itemId', 'title').sort({ createdAt: -1 });
    const totalEarned = orders.reduce((s, o) => s + (o.sellerEarning || 0), 0);
    const pendingPayout = orders.filter(o => o.payoutStatus === 'pending').reduce((s, o) => s + (o.sellerEarning || 0), 0);
    res.json({ success: true, seller: { totalEarned, pendingPayout, orders } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Payout a seller
router.post('/seller/:sellerEmail/payout', protect, adminOnly, async (req, res) => {
  try {
    await Order.updateMany(
      { sellerEmail: req.params.sellerEmail, payoutStatus: 'pending', status: 'completed' },
      { payoutStatus: 'paid', payoutAt: new Date() }
    );
    res.json({ success: true, message: 'Payout processed' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
