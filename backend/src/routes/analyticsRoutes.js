// backend/src/routes/analyticsRoutes.js
import express from 'express';
import User from '../models/User.js';
import MarketplaceItem from '../models/MarketplaceItem.js';
import Order from '../models/Order.js';
import Event from '../models/Event.js';
import Resource from '../models/Resource.js';
import FreelanceProject from '../models/FreelanceProject.js';
import Withdrawal from '../models/Withdrawal.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/overview', protect, adminOnly, async (req, res) => {
  try {
    const [users, items, orders, events, resources] = await Promise.all([
      User.countDocuments(),
      MarketplaceItem.countDocuments({ status: 'approved' }),
      Order.countDocuments({ status: 'completed' }),
      Event.countDocuments({ isActive: true }),
      Resource.countDocuments({ isApproved: true }),
    ]);
    const revenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' }, fees: { $sum: '$platformFee' } } },
    ]);
    res.json({
      success: true,
      overview: {
        users, items, orders, events, resources,
        totalRevenue: revenue[0]?.total || 0,
        platformFees: revenue[0]?.fees || 0,
      },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/users/growth', protect, adminOnly, async (req, res) => {
  try {
    const data = await User.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }, { $limit: 12 },
    ]);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Daily time-series for the last 30 days — signups, revenue, new listings across all
// three content types, and paid-out withdrawals. Days with zero activity still show
// up as a 0 point (rather than being skipped) so charts render a continuous line.
router.get('/trends', protect, adminOnly, async (req, res) => {
  try {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const since = new Date(Date.now() - 30 * DAY_MS);

    const lastNDayKeys = (n) => {
      const keys = [];
      for (let i = n - 1; i >= 0; i--) keys.push(new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10));
      return keys;
    };

    const groupByDay = async (Model, match, dateField = 'createdAt', sumField = null) => {
      const rows = await Model.aggregate([
        { $match: { ...match, [dateField]: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` } }, count: { $sum: 1 }, ...(sumField ? { sum: { $sum: `$${sumField}` } } : {}) } },
      ]);
      const map = new Map(rows.map(r => [r._id, r]));
      return lastNDayKeys(30).map(day => ({ day, count: map.get(day)?.count || 0, sum: map.get(day)?.sum || 0 }));
    };

    const [signups, orders, listings, resources, projects, withdrawals] = await Promise.all([
      groupByDay(User, {}),
      groupByDay(Order, { status: 'completed' }, 'createdAt', 'amount'),
      groupByDay(MarketplaceItem, {}),
      groupByDay(Resource, {}),
      groupByDay(FreelanceProject, {}),
      groupByDay(Withdrawal, { status: 'paid' }, 'processedAt', 'amount'),
    ]);

    res.json({
      success: true,
      trends: {
        signups: signups.map(d => ({ day: d.day, value: d.count })),
        revenue: orders.map(d => ({ day: d.day, value: d.sum })),
        newListings: listings.map((d, i) => ({ day: d.day, marketplace: d.count, resources: resources[i]?.count || 0, freelance: projects[i]?.count || 0 })),
        withdrawals: withdrawals.map(d => ({ day: d.day, value: d.sum })),
      },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
