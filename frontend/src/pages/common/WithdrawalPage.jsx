// frontend/src/pages/common/WithdrawalPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import {
  Menu, IndianRupee, Clock, CheckCircle, XCircle,
  Plus, Loader2, AlertCircle, CreditCard, X, Edit2, Save
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const req = async (url, method = 'GET', data = null) => {
  const opts = {
    method,
    credentials: 'include', // httpOnly auth cookie is sent automatically
    headers: { 'Content-Type': 'application/json' },
    ...(data ? { body: JSON.stringify(data) } : {}),
  };
  const res  = await fetch(`${API}${url}`, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json;
};

const statusConfig = {
  pending:    { label: 'Pending',    cls: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Clock },
  processing: { label: 'Processing', cls: 'bg-blue-50 text-blue-700 border-blue-200',      icon: Loader2 },
  paid:       { label: 'Paid',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  rejected:   { label: 'Rejected',   cls: 'bg-red-50 text-red-700 border-red-200',         icon: XCircle },
};

const StatusBadge = ({ status }) => {
  const c = statusConfig[status] || statusConfig.pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${c.cls}`}>
      <Icon size={9} />{c.label}
    </span>
  );
};

const WithdrawalPage = () => {
  const { user, updateProfile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingUpi, setEditingUpi] = useState(false);
  const [upiInput, setUpiInput] = useState('');
  const [upiSaving, setUpiSaving] = useState(false);
  const isMounted = useRef(true);

  const fetchData = async () => {
    if (!user?._id) return;
    try {
      const [sumRes, wdRes] = await Promise.allSettled([
        req(`/withdrawals/summary`),
        req(`/withdrawals/mine`),
      ]);
      if (!isMounted.current) return;
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.summary);
      if (wdRes.status === 'fulfilled')  setWithdrawals(wdRes.value.withdrawals || []);
    } catch { }
    finally { if (isMounted.current) setLoading(false); }
  };

  useEffect(() => {
    isMounted.current = true;
    setUpiInput(user?.upiId || '');
    fetchData();
    return () => { isMounted.current = false; };
  }, [user]);

  const handleSaveUpi = async () => {
    if (!upiInput.trim()) return toast.error('Enter a valid UPI ID');
    setUpiSaving(true);
    try {
      const res = await fetch(`${API}/users/${user._id}/upi`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upiId: upiInput }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('UPI ID saved!');
        setEditingUpi(false);
        await updateProfile?.(user._id, { upiId: upiInput });
        fetchData();
      } else throw new Error(data.message);
    } catch (e) { toast.error(e.message); }
    finally { setUpiSaving(false); }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) return toast.error('Enter valid amount');
    if (!user?.upiId) return toast.error('Add your UPI ID first');
    setSubmitting(true);
    try {
      const r = await req('/withdrawals', 'POST', { amount: Number(amount) });
      if (r.success) {
        toast.success(r.message);
        setAmount('');
        fetchData();
      }
    } catch (e) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col">
        <NewsTicker />
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center gap-3 shadow-sm">
          <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20} /></button>
          <div>
            <h1 className="text-base font-black text-emerald-600">Withdrawal Center</h1>
            <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Request your earnings payout via UPI</p>
          </div>
          <div className="flex items-center gap-2">
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>

        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
          className="flex-1 px-4 md:px-6 py-6 max-w-3xl mx-auto w-full space-y-5">

          {/* Stats */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Earned',  value: formatCurrency(summary.totalEarned, true),   g: 'from-emerald-500 to-emerald-600' },
                { label: 'Available',     value: formatCurrency(summary.available, true),      g: 'from-blue-500 to-indigo-600' },
                { label: 'Pending',       value: formatCurrency(summary.pendingAmount, true),  g: 'from-amber-500 to-orange-500' },
                { label: 'Paid Out',      value: formatCurrency(summary.paidAmount, true),     g: 'from-violet-500 to-purple-600' },
              ].map(({ label, value, g }) => (
                <motion.div key={label} whileHover={{ y: -3 }} className="bg-white/95 border border-emerald-100/30 rounded-2xl p-4 shadow-sm">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${g} flex items-center justify-center mb-2`}>
                    <IndianRupee size={14} className="text-white" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-blue-900/40">{label}</p>
                  <p className="text-lg font-black text-emerald-600 mt-0.5">{value}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* UPI ID */}
          <div className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={15} className="text-emerald-600" />
                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wide">UPI Payment ID</h3>
              </div>
              {!editingUpi ? (
                <button onClick={() => { setEditingUpi(true); setUpiInput(user?.upiId || ''); }}
                  className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-600 hover:text-emerald-600 transition-colors">
                  <Edit2 size={10} />Edit
                </button>
              ) : (
                <button onClick={() => setEditingUpi(false)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
              )}
            </div>
            {editingUpi ? (
              <div className="flex gap-2">
                <input value={upiInput} onChange={e => setUpiInput(e.target.value)}
                  placeholder="e.g. yourname@paytm" className="flex-1 text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all" />
                <button onClick={handleSaveUpi} disabled={upiSaving}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-[10px] font-black disabled:opacity-50 hover:scale-[1.02] transition-all shadow-sm">
                  {upiSaving ? <Loader2 size={11} className="animate-spin" /> : <><Save size={11} />Save</>}
                </button>
              </div>
            ) : (
              <div className={`flex items-center gap-2 p-3 rounded-xl border ${user?.upiId ? 'bg-emerald-50/60 border-emerald-100/40' : 'bg-amber-50/60 border-amber-200/60'}`}>
                {user?.upiId ? (
                  <><CheckCircle size={14} className="text-emerald-500" /><p className="text-xs font-bold text-blue-900">{user.upiId}</p></>
                ) : (
                  <><AlertCircle size={14} className="text-amber-500" /><p className="text-xs font-medium text-amber-700">No UPI ID set. Add one to request payouts.</p></>
                )}
              </div>
            )}
            <p className="text-[9px] font-medium text-blue-900/30 mt-2">Supported: @paytm · @ybl · @ibl · @oksbi · @okicici · @upi</p>
          </div>

          {/* Request withdrawal */}
          <form onSubmit={handleWithdraw} className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wide mb-4">Request Withdrawal</h3>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">₹</span>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  min="100" max={summary?.available || 99999} placeholder="Enter amount (min ₹100)"
                  className="w-full pl-8 pr-3 py-3 text-sm font-bold border border-emerald-100/40 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
              </div>
              <button type="submit" disabled={submitting || !user?.upiId}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] disabled:opacity-50 transition-all shadow-md">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Request
              </button>
            </div>
            <p className="text-[9px] font-medium text-blue-900/30 mt-2">⏱ Payouts processed within 5–7 business days. Platform fee: 5%</p>
          </form>

          {/* History */}
          <div className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-emerald-50">
              <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wide">Withdrawal History</h3>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : withdrawals.length === 0 ? (
              <div className="py-10 text-center"><p className="text-xs font-medium text-blue-900/40">No withdrawal requests yet</p></div>
            ) : (
              <div className="divide-y divide-emerald-50">
                {withdrawals.map((w, i) => (
                  <motion.div key={w._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * .04 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50/20 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusConfig[w.status]?.cls || ''}`}>
                      {React.createElement(statusConfig[w.status]?.icon || Clock, { size: 14 })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-blue-900">{w.upiId}</p>
                      <p className="text-[9px] text-blue-900/40 font-medium">{formatDate(w.requestedAt, 'MMM d, yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-600">{formatCurrency(w.amount)}</p>
                      <StatusBadge status={w.status} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default WithdrawalPage;
