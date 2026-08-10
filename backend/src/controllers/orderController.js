// backend/src/controllers/orderController.js
import Order from '../models/Order.js';
import MarketplaceItem from '../models/MarketplaceItem.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';
import { sendEmail } from '../utils/sendEmail.js';
import { orderConfirmationEmail, newSaleEmail } from '../utils/emailTemplates.js';

export const getAll = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getByUser = async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.params.userId })
      .populate('itemId', 'title images category')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getBySeller = async (req, res) => {
  try {
    const orders = await Order.find({ sellerEmail: req.params.sellerEmail })
      .populate('itemId', 'title images')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const create = async (req, res) => {
  try {
    const { itemId, paymentMethod, paymentRef } = req.body;
    const item = await MarketplaceItem.findById(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    if (item.status !== 'approved') return res.status(400).json({ success: false, message: 'Item not available' });

    const order = await Order.create({
      buyerId: req.user._id,
      buyerEmail: req.user.email,
      buyerName: `${req.user.firstName} ${req.user.lastName}`.trim(),
      itemId: item._id,
      itemTitle: item.title,
      sellerId: item.sellerId,
      sellerEmail: item.sellerEmail,
      sellerName: item.sellerName,
      amount: item.price,
      platformFee: item.platformFee,
      sellerEarning: item.sellerEarning,
      paymentMethod: paymentMethod || 'upi',
      paymentRef: paymentRef || '',
    });

    item.purchaseCount = (item.purchaseCount || 0) + 1;
    await item.save({ validateBeforeSave: false });

    if (item.sellerId) {
      createNotification({
        user: item.sellerId,
        type: 'order_placed',
        title: 'New order received',
        message: `${order.buyerName || 'A buyer'} just purchased "${item.title}".`,
        link: '/earnings',
      });
    }

    // fire-and-forget — don't delay the response on SMTP round-trips
    if (order.buyerEmail) {
      const buyerMail = orderConfirmationEmail({ buyerName: order.buyerName, itemTitle: item.title, amount: item.price, orderId: order._id });
      sendEmail({ to: order.buyerEmail, ...buyerMail });
    }
    if (order.sellerEmail) {
      const sellerMail = newSaleEmail({ sellerName: order.sellerName, itemTitle: item.title, amount: item.price, buyerName: order.buyerName });
      sendEmail({ to: order.sellerEmail, ...sellerMail });
    }

    res.status(201).json({ success: true, order });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const updateStatus = async (req, res) => {
  try {
    const ALLOWED = ['pending', 'completed', 'refunded', 'cancelled'];
    if (!ALLOWED.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const isParty = [order.buyerId.toString(), order.sellerId.toString()].includes(req.user._id.toString());
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    if (!isParty && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    order.status = req.body.status;
    await order.save();
    res.json({ success: true, order });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const markPayout = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { payoutStatus: 'paid', payoutAt: new Date() },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
