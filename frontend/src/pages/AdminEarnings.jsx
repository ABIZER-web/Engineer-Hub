// frontend/src/pages/AdminEarnings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getPlatformStats, getAllSellers, processPayout } from '../services/api';
import Sidebar from '../components/Sidebar';
import NewsTicker from '../components/NewsTicker';
import { Menu, IndianRupee, Users, TrendingUp, ShoppingBag, CreditCard, Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';
import GlobalSearch from '../components/GlobalSearch';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';

const AdminEarnings = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payoutId, setPayoutId] = useState(null);
  const isMounted = useRef(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const [statsRes, sellersRes] = await Promise.allSettled([getPlatformStats(), getAllSellers()]);
      if (!isMounted.current) return;
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.stats || null);
      if (sellersRes.status === 'fulfilled') setSellers(sellersRes.value.sellers || []);
    } catch { }
    finally { if (isMounted.current) setLoading(false); }
  };

  useEffect(() => { isMounted.current = true; fetch(); return () => { isMounted.current = false; }; }, []);

  const handlePayout = async (sellerEmail) => {
    setPayoutId(sellerEmail);
    try {
      await processPayout(sellerEmail);
      toast.success('Payout processed!');
      fetch();
    } catch (e) { toast.error(e.message); }
    finally { setPayoutId(null); }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col">
        <NewsTicker />
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20} /></button>
            <div><h1 className="text-base font-black text-emerald-600">Platform Earnings</h1></div>
          </div>
          <div className="flex items-center gap-2">
          <button onClick={fetch} className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><RefreshCw size={16} /></button>
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>
        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 px-4 md:px-6 py-6 max-w-5xl mx-auto w-full">
          {/* Platform stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue, true), g: 'from-emerald-500 to-emerald-600', icon: IndianRupee },
                { label: 'Platform Fees', value: formatCurrency(stats.platformFees, true), g: 'from-blue-500 to-indigo-600', icon: TrendingUp },
                { label: 'Seller Payouts', value: formatCurrency(stats.sellerPayouts, true), g: 'from-violet-500 to-purple-600', icon: CreditCard },
                { label: 'Total Orders', value: stats.totalOrders, g: 'from-amber-500 to-orange-500', icon: ShoppingBag },
              ].map(({ label, value, g, icon: Icon }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .07 }}
                  whileHover={{ y: -3 }} className="bg-white/95 border border-emerald-100/30 rounded-2xl p-4 shadow-sm">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${g} flex items-center justify-center mb-2`}><Icon size={16} className="text-white" /></div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-blue-900/40">{label}</p>
                  <p className="text-xl font-black text-emerald-600 mt-0.5">{value}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Sellers table */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 }}
            className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-emerald-50"><h3 className="text-xs font-black text-emerald-600 uppercase tracking-wide">Seller Payouts</h3></div>
            {loading ? (
              <div className="p-4 space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : sellers.length === 0 ? (
              <div className="py-10 text-center"><p className="text-xs font-medium text-blue-900/40">No sellers yet</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-emerald-50/60 to-blue-50/40">
                      {['Seller', 'Email', 'Total Earned', 'Pending Payout', 'Orders', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-blue-900/40">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {sellers.map((s, i) => (
                      <tr key={s.sellerEmail} className="hover:bg-emerald-50/20 transition-colors">
                        <td className="px-4 py-3 text-xs font-black text-blue-900">{s.sellerName || '—'}</td>
                        <td className="px-4 py-3 text-xs text-blue-900/50">{s.sellerEmail}</td>
                        <td className="px-4 py-3 text-xs font-black text-emerald-600">{formatCurrency(s.totalEarned)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-black ${s.pendingPayout > 0 ? 'text-amber-600' : 'text-blue-900/30'}`}>{formatCurrency(s.pendingPayout)}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-blue-900/50">{s.orders}</td>
                        <td className="px-4 py-3">
                          {s.pendingPayout > 0 ? (
                            <button onClick={() => handlePayout(s.sellerEmail)} disabled={payoutId === s.sellerEmail}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-[9px] font-black uppercase hover:scale-[1.02] disabled:opacity-50 transition-all shadow-sm">
                              {payoutId === s.sellerEmail ? <Loader2 size={9} className="animate-spin" /> : <CreditCard size={9} />}Pay
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600"><CheckCircle size={10} />Paid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
};

export default AdminEarnings;
