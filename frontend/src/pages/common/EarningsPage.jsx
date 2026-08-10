// frontend/src/pages/common/EarningsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { getItemsByUser, getSellersEarnings, updateUpiId } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import { Menu, IndianRupee, TrendingUp, ShoppingBag, CreditCard, Copy, Edit2, Save, X, CheckCircle, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';

const EarningsPage = () => {
  const { user, updateProfile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [earningsData, setEarningsData] = useState({ totalEarned: 0, pendingPayout: 0, orders: [] });
  const [editingUpi, setEditingUpi] = useState(false);
  const [upiValue, setUpiValue] = useState('');
  const [upiLoading, setUpiLoading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    setUpiValue(user?.upiId || '');
    const fetch = async () => {
      if (!user?._id) { setLoading(false); return; }
      try {
        const [itemsRes, earningsRes] = await Promise.allSettled([
          getItemsByUser(user._id),
          getSellersEarnings(user.email),
        ]);
        if (!isMounted.current) return;
        if (itemsRes.status === 'fulfilled') setItems(itemsRes.value.items || []);
        if (earningsRes.status === 'fulfilled') setEarningsData(earningsRes.value.seller || { totalEarned: 0, pendingPayout: 0, orders: [] });
      } catch { }
      finally { if (isMounted.current) setLoading(false); }
    };
    fetch();
    return () => { isMounted.current = false; };
  }, [user]);

  const handleSaveUpi = async () => {
    if (!upiValue.trim()) return toast.error('Enter valid UPI ID');
    setUpiLoading(true);
    try {
      const r = await updateUpiId(user._id, { upiId: upiValue });
      if (r.success) { toast.success('UPI ID updated!'); setEditingUpi(false); }
    } catch (e) { toast.error(e.message); }
    finally { setUpiLoading(false); }
  };

  const totalRevenue = items.reduce((s, i) => s + ((i.purchaseCount || 0) * (i.sellerEarning || 0)), 0);
  const totalSales = items.reduce((s, i) => s + (i.purchaseCount || 0), 0);
  const activeListings = items.filter(i => i.status === 'approved').length;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col relative z-10">
        <NewsTicker />
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20} /></button>
            <div>
              <h1 className="text-base font-black text-emerald-600">My Earnings</h1>
              <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Revenue from project sales</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>
        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
          className="flex-1 px-4 md:px-6 py-6 max-w-4xl mx-auto w-full">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Earned', value: formatCurrency(totalRevenue, true), g: 'from-emerald-500 to-emerald-600' },
              { label: 'Pending Payout', value: formatCurrency(earningsData.pendingPayout, true), g: 'from-amber-500 to-orange-500' },
              { label: 'Total Sales', value: totalSales, g: 'from-blue-500 to-indigo-600' },
              { label: 'Active Listings', value: activeListings, g: 'from-violet-500 to-purple-600' },
            ].map(({ label, value, g }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .07 }}
                whileHover={{ y: -3 }} className="bg-white/95 border border-emerald-100/30 rounded-2xl p-4 shadow-sm">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${g} flex items-center justify-center mb-2`}>
                  <IndianRupee size={16} className="text-white" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-wider text-blue-900/40">{label}</p>
                <p className="text-xl font-black text-emerald-600 mt-0.5">{value}</p>
              </motion.div>
            ))}
          </div>

          {/* UPI Setup */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 }}
            className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-emerald-600" />
                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wide">Payment Setup (UPI)</h3>
              </div>
              {!editingUpi ? (
                <button onClick={() => setEditingUpi(true)} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-blue-600 hover:text-emerald-600 transition-colors">
                  <Edit2 size={11} />Edit
                </button>
              ) : (
                <button onClick={() => { setEditingUpi(false); setUpiValue(user?.upiId || ''); }} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
            {editingUpi ? (
              <div className="flex gap-2">
                <input value={upiValue} onChange={e => setUpiValue(e.target.value)} placeholder="yourname@upi"
                  className="flex-1 text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all" />
                <button onClick={handleSaveUpi} disabled={upiLoading}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black disabled:opacity-50 hover:scale-[1.02] transition-all shadow-sm">
                  {upiLoading ? <Loader2 size={12} className="animate-spin" /> : <><Save size={12} />Save</>}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/40">
                {user?.upiId ? (
                  <>
                    <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                    <p className="text-xs font-bold text-blue-900">{user.upiId}</p>
                    <button onClick={() => { navigator.clipboard.writeText(user.upiId); toast.success('Copied!'); }} className="ml-auto text-blue-500 hover:text-emerald-600 transition-colors">
                      <Copy size={12} />
                    </button>
                  </>
                ) : (
                  <p className="text-xs font-medium text-blue-900/40">No UPI ID set. Add one to receive payouts.</p>
                )}
              </div>
            )}
            <p className="text-[9px] font-medium text-blue-900/30 mt-2">Admins use your UPI ID to transfer earnings. Platform fee: 5%</p>
          </motion.div>

          {/* Listings */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35 }}
            className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-emerald-50">
              <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wide">Earnings by Listing</h3>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center">
                <ShoppingBag size={32} className="text-gray-200 mx-auto mb-2" />
                <p className="text-xs font-medium text-blue-900/40">No listings yet</p>
              </div>
            ) : (
              <div className="divide-y divide-emerald-50">
                {items.map((item, i) => (
                  <motion.div key={item._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .4 + i * .04 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50/20 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-[9px] font-black flex-shrink-0">
                      {item.title?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-blue-900 truncate">{item.title}</p>
                      <p className="text-[9px] text-blue-900/40">{item.purchaseCount || 0} sales · {formatCurrency(item.price)} each</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-600">{formatCurrency((item.purchaseCount || 0) * (item.sellerEarning || 0))}</p>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${item.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {item.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
};

export default EarningsPage;
