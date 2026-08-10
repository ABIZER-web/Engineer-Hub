// frontend/src/pages/common/PurchasesPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { getOrdersByUser, addReview } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import { Menu, ShoppingBag, Download, Search, ExternalLink, CheckCircle, Clock, Star, X, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';

const PurchasesPage = () => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [reviewTarget, setReviewTarget] = useState(null); // order being reviewed
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetch = async () => {
      if (!user?._id) { setLoading(false); return; }
      try { const r = await getOrdersByUser(user._id); if (isMounted.current) setOrders(r.orders || []); }
      catch { } finally { if (isMounted.current) setLoading(false); }
    };
    fetch();
    return () => { isMounted.current = false; };
  }, [user]);

  const filtered = orders.filter(o => !search || o.itemTitle?.toLowerCase().includes(search.toLowerCase()));
  const totalSpent = orders.reduce((s, o) => s + (o.amount || 0), 0);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col relative z-10">
        <NewsTicker />
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20} /></button>
            <div>
              <h1 className="text-base font-black text-emerald-600">My Purchases</h1>
              <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Download history & transaction ledger</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>
        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
          className="flex-1 px-4 md:px-6 py-6 max-w-4xl mx-auto w-full">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: 'Total Purchases', value: orders.length, g: 'from-emerald-500 to-emerald-600' },
              { label: 'Total Spent', value: formatCurrency(totalSpent), g: 'from-blue-500 to-indigo-600' },
            ].map(({ label, value, g }) => (
              <motion.div key={label} whileHover={{ y: -3 }} className="bg-white/95 border border-emerald-100/30 rounded-2xl p-4 shadow-sm">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${g} flex items-center justify-center mb-2`}>
                  <ShoppingBag size={16} className="text-white" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-wider text-blue-900/40">{label}</p>
                <p className="text-xl font-black text-emerald-600 mt-0.5">{value}</p>
              </motion.div>
            ))}
          </div>
          <div className="relative mb-4">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search purchases..."
              className="w-full pl-8 pr-3 py-2 text-xs font-medium border border-emerald-100/40 rounded-xl bg-white/80 focus:outline-none focus:border-emerald-300 transition-all" />
          </div>
          <div className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-emerald-50">
              <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wide">Purchase History</h3>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingBag size={36} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-900/40">No purchases yet</p>
              </div>
            ) : (
              <div className="divide-y divide-emerald-50">
                {filtered.map((o, i) => (
                  <motion.div key={o._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .04 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50/20 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                      {o.itemTitle?.charAt(0) || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-blue-900 truncate">{o.itemTitle || 'Unknown Item'}</p>
                      <p className="text-[10px] text-blue-900/40 font-medium">{o.sellerName} · {formatDate(o.createdAt, 'MMM d, yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-600">{formatCurrency(o.amount)}</p>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${o.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {o.status}
                      </span>
                    </div>
                    {o.status === 'completed' && (
                      <button
                        onClick={() => setReviewTarget(o)}
                        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-600 text-[9px] font-black uppercase hover:bg-amber-100 transition-colors"
                      >
                        <Star size={11} /> Rate
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.main>
      </div>
      {reviewTarget && (
        <RateModal order={reviewTarget} onClose={() => setReviewTarget(null)} />
      )}
    </div>
  );
};

const RateModal = ({ order, onClose }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await addReview(order.itemId, { rating, comment });
      toast.success('Thanks for your review!');
      onClose();
    } catch (e) {
      toast.error(e.message || 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-black text-blue-900">Rate this purchase</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <p className="text-xs text-blue-900/50 font-medium mb-4 truncate">{order.itemTitle}</p>

        <div className="flex items-center justify-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
              <Star
                size={28}
                className={(hoverRating || rating) >= n ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          placeholder="Optional — what did you think? (visible to other students)"
          rows={3}
          className="w-full px-3 py-2 text-xs font-medium border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-300 transition-all resize-none"
        />

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-black uppercase hover:bg-emerald-600 disabled:opacity-50 transition-colors"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
          Submit review
        </button>
      </motion.div>
    </div>
  );
};

export default PurchasesPage;
