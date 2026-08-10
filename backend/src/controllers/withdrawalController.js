// backend/src/controllers/withdrawalController.js
import Withdrawal from '../models/Withdrawal.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import { createNotification } from './notificationController.js';
import { logAction } from './auditLogController.js';
import { sendEmail } from '../utils/sendEmail.js';
import { withdrawalStatusEmail } from '../utils/emailTemplates.js';

const getMinWithdrawal = async () => {
  const doc = await Settings.findOne({ key: 'minWithdrawal' });
  return doc ? Number(doc.value) : 100;
};

// @desc  Get all withdrawals (admin)
export const getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const q = status ? { status } : {};
    const list = await Withdrawal.find(q).sort({ createdAt: -1 });
    res.json({ success: true, withdrawals: list });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// @desc  Get withdrawals for current user
export const getMine = async (req, res) => {
  try {
    const list = await Withdrawal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, withdrawals: list });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// @desc  Get summary for a user: totalEarned, paid, pending, available
export const getSummary = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const user = await User.findById(userId).select('email upiId');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const orders = await Order.find({ sellerEmail: user.email, status: 'completed' });
    const totalEarned = orders.reduce((s, o) => s + (o.sellerEarning || 0), 0);

    const withdrawals = await Withdrawal.find({ userId });
    const paidAmount  = withdrawals.filter(w => w.status === 'paid').reduce((s, w) => s + w.amount, 0);
    const pendingAmount = withdrawals.filter(w => ['pending','processing'].includes(w.status)).reduce((s, w) => s + w.amount, 0);
    const available = Math.max(0, totalEarned - paidAmount - pendingAmount);

    res.json({ success: true, summary: { totalEarned, paidAmount, pendingAmount, available, upiId: user.upiId || '' } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// @desc  Request withdrawal
export const create = async (req, res) => {
  try {
    const { amount } = req.body;
    const minAmount = await getMinWithdrawal();

    if (!amount || Number(amount) < minAmount) {
      return res.status(400).json({ success: false, message: `Minimum withdrawal is ₹${minAmount}` });
    }
    if (!req.user.upiId) {
      return res.status(400).json({ success: false, message: 'Please add your UPI ID in profile settings first' });
    }

    // Check available balance
    const orders = await Order.find({ sellerEmail: req.user.email, status: 'completed' });
    const totalEarned = orders.reduce((s, o) => s + (o.sellerEarning || 0), 0);
    const existing = await Withdrawal.find({ userId: req.user._id });
    const alreadyUsed = existing.filter(w => ['pending','processing','paid'].includes(w.status)).reduce((s, w) => s + w.amount, 0);
    const available = Math.max(0, totalEarned - alreadyUsed);

    if (Number(amount) > available) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Available: ₹${available.toFixed(2)}` });
    }

    const withdrawal = await Withdrawal.create({
      userId: req.user._id,
      userName: `${req.user.firstName} ${req.user.lastName}`.trim(),
      userEmail: req.user.email,
      upiId: req.user.upiId,
      amount: Number(amount),
    });
    res.status(201).json({ success: true, message: 'Withdrawal request submitted. Admin will process within 5–7 days.', withdrawal });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// @desc  Update withdrawal status (admin)
export const updateStatus = async (req, res) => {
  try {
    const { status, transactionId, rejectionNote } = req.body;
    const valid = ['pending','processing','paid','rejected'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const withdrawal = await Withdrawal.findByIdAndUpdate(
      req.params.id,
      {
        status,
        transactionId: transactionId || '',
        rejectionNote: rejectionNote || '',
        processedAt: ['paid','rejected'].includes(status) ? new Date() : null,
        processedBy: req.user._id,
      },
      { new: true }
    );
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal not found' });

    const statusCopy = {
      processing: 'is now being processed',
      paid:       'has been paid out',
      rejected:   'was rejected' + (rejectionNote ? `: ${rejectionNote}` : ''),
      pending:    'is pending review',
    };
    createNotification({
      user: withdrawal.userId,
      type: 'withdrawal_update',
      title: 'Withdrawal update',
      message: `Your withdrawal of ₹${withdrawal.amount} ${statusCopy[status] || `is now ${status}`}.`,
      link: '/withdrawal',
    });

    if (withdrawal.userEmail) {
      const mail = withdrawalStatusEmail({ userName: withdrawal.userName, amount: withdrawal.amount, status, note: rejectionNote });
      sendEmail({ to: withdrawal.userEmail, ...mail }); // fire-and-forget
    }

    logAction({ actor: req.user, action: `withdrawal_${status}`, targetType: 'withdrawal', targetId: withdrawal._id, targetLabel: `₹${withdrawal.amount} — ${withdrawal.userName}`, note: rejectionNote || '' });

    res.json({ success: true, withdrawal });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// @desc  Delete withdrawal (admin only)
export const remove = async (req, res) => {
  try {
    await Withdrawal.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
