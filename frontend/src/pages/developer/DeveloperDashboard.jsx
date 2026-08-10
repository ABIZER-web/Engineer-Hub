// frontend/src/pages/developer/DeveloperDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserById, getItemsByUser, getAllFreelancers, getOrdersByUser, getSellersEarnings } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import {
    ShoppingBag, Briefcase, TrendingUp, DollarSign, Menu, Package,
    ChevronRight, Star, Clock, CheckCircle, XCircle, AlertCircle,
    IndianRupee, LogOut, BarChart2, Users, Award
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';

const MetricCard = ({ icon: Icon, label, value, sub, gradient, delay, onClick }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
        whileHover={{ y: -4 }} onClick={onClick}
        className={`bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-sm`}>
            <Icon size={20} className="text-white" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-wider text-blue-900/50 mb-0.5">{label}</p>
        <p className="text-2xl font-black text-emerald-600 tracking-tight">{value}</p>
        {sub && <p className="text-[11px] font-bold text-blue-900/40 mt-0.5">{sub}</p>}
    </motion.div>
);

const StatusBadge = ({ status }) => {
    const map = {
        pending: { cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Pending', icon: Clock },
        approved: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Approved', icon: CheckCircle },
        rejected: { cls: 'bg-red-50 text-red-700 border-red-200', label: 'Rejected', icon: XCircle },
        sold: { cls: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Sold', icon: CheckCircle },
    };
    const s = map[status] || map.pending;
    const Icon = s.icon;
    return (
        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.cls}`}>
            <Icon size={9} />{s.label}
        </span>
    );
};

const DeveloperDashboard = () => {
    const { user: authUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [listings, setListings] = useState([]);
    const [earnings, setEarnings] = useState({ total: 0, pending: 0, paid: 0 });
    const [freelanceProfile, setFreelanceProfile] = useState(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        const fetchData = async () => {
            if (!authUser?._id) { setLoading(false); return; }
            try {
                const [listingsRes, freelanceRes] = await Promise.allSettled([
                    getItemsByUser(authUser._id),
                    getAllFreelancers(),
                ]);
                if (!isMounted.current) return;
                const items = listingsRes.status === 'fulfilled' ? (listingsRes.value.items || []) : [];
                setListings(items);
                const totalEarnings = items.reduce((sum, it) => sum + (it.purchaseCount * it.sellerEarning || 0), 0);
                setEarnings({ total: totalEarnings, pending: 0, paid: totalEarnings });
                if (freelanceRes.status === 'fulfilled') {
                    const prof = (freelanceRes.value.projects || freelanceRes.value.freelancers || [])
                        .find(p => p.clientId?._id === authUser._id || p.clientId === authUser._id);
                    setFreelanceProfile(prof || null);
                }
            } catch { /* ignore */ }
            finally { if (isMounted.current) setLoading(false); }
        };
        fetchData();
        return () => { isMounted.current = false; };
    }, [authUser]);

    const firstName = authUser?.firstName || 'Developer';
    const approvedListings = listings.filter(l => l.status === 'approved');
    const pendingListings = listings.filter(l => l.status === 'pending');
    const totalSales = listings.reduce((s, l) => s + (l.purchaseCount || 0), 0);

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-emerald-50/10">
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-100/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

            <div className="flex-1 flex flex-col min-h-screen relative z-10">
                <NewsTicker />

                {/* Header */}
                <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50 transition-colors">
                            <Menu size={20} />
                        </button>
                        <div>
                            <h1 className="text-base font-black text-emerald-600">Developer Dashboard</h1>
                            <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Manage your listings & freelance portfolio</p>
                        </div>
                    </div>
          <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/profile')} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-emerald-50 transition-colors">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center text-white text-[10px] font-black">
                                {firstName.charAt(0)}
                            </div>
                            <span className="hidden sm:inline text-xs font-bold text-blue-900">{firstName}</span>
                        </button>
                        <button onClick={async () => { await logout(); navigate('/auth', { replace: true }); }}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Logout">
                            <LogOut size={16} />
                        </button>
                    </div>
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>

                <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                    className="flex-1 px-4 md:px-6 py-6 max-w-5xl mx-auto w-full">

                    {/* Hero banner */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 rounded-2xl p-6 md:p-8 mb-6 text-white relative overflow-hidden shadow-lg">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
                        <div className="relative z-10">
                            <p className="text-blue-100/80 text-xs font-black uppercase tracking-widest mb-1">Developer Mode 🚀</p>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1">Hey, {firstName}!</h2>
                            <p className="text-white/60 text-sm font-medium">
                                {approvedListings.length} active listings · {totalSales} total sales · {formatCurrency(earnings.total)} earned
                            </p>
                        </div>
                    </motion.div>

                    {/* Metric cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <MetricCard icon={Package} label="Total Listings" value={listings.length} sub={`${approvedListings.length} approved`} gradient="from-emerald-500 to-emerald-600" delay={0.1} onClick={() => navigate('/marketplace')} />
                        <MetricCard icon={BarChart2} label="Total Sales" value={totalSales} sub="Purchases" gradient="from-blue-500 to-indigo-600" delay={0.15} />
                        <MetricCard icon={IndianRupee} label="Total Earned" value={formatCurrency(earnings.total, true)} sub="After platform fee" gradient="from-violet-500 to-purple-600" delay={0.2} onClick={() => navigate('/earnings')} />
                        <MetricCard icon={Clock} label="Pending Review" value={pendingListings.length} sub="Awaiting approval" gradient="from-amber-500 to-orange-500" delay={0.25} />
                    </div>

                    {/* Listings & quick actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Recent listings */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black text-emerald-600 uppercase tracking-wide">My Listings</h3>
                                <button onClick={() => navigate('/marketplace')} className="text-[10px] font-black uppercase tracking-wider text-blue-600 hover:text-emerald-600 transition-colors">
                                    Manage →
                                </button>
                            </div>
                            {loading ? (
                                <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}</div>
                            ) : listings.length === 0 ? (
                                <div className="text-center py-6">
                                    <ShoppingBag size={32} className="text-gray-200 mx-auto mb-2" />
                                    <p className="text-xs font-medium text-blue-900/40 mb-3">No listings yet</p>
                                    <button onClick={() => navigate('/marketplace')}
                                        className="text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-3 py-1.5 rounded-lg">
                                        Create Listing
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {listings.slice(0, 4).map((item, i) => (
                                        <motion.div key={item._id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.32 + i * 0.04 }}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50/50 to-blue-50/30 border border-emerald-100/20">
                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                                                {item.title?.charAt(0) || 'P'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-blue-900 truncate">{item.title}</p>
                                                <p className="text-[10px] font-bold text-emerald-600">{formatCurrency(item.price)} · {item.purchaseCount || 0} sales</p>
                                            </div>
                                            <StatusBadge status={item.status} />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Quick actions */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                            className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-sm font-black text-emerald-600 uppercase tracking-wide mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                {[
                                    { icon: ShoppingBag, label: 'List New Project', sub: 'Sell code on marketplace', path: '/marketplace', gradient: 'from-emerald-500 to-emerald-600' },
                                    { icon: Briefcase, label: 'Freelance Hub', sub: 'Browse & bid on projects', path: '/freelancing', gradient: 'from-blue-500 to-indigo-500' },
                                    { icon: TrendingUp, label: 'My Earnings', sub: 'View revenue & payouts', path: '/earnings', gradient: 'from-violet-500 to-purple-500' },
                                    { icon: Award, label: 'My Purchases', sub: 'Download history', path: '/purchases', gradient: 'from-amber-500 to-orange-500' },
                                ].map((action, i) => (
                                    <motion.button key={action.path} whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => navigate(action.path)}
                                        className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-emerald-50/60 hover:to-blue-50/40 border border-transparent hover:border-emerald-100/30 transition-all">
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center flex-shrink-0`}>
                                            <action.icon size={15} className="text-white" />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-xs font-black text-blue-900">{action.label}</p>
                                            <p className="text-[10px] text-blue-900/40">{action.sub}</p>
                                        </div>
                                        <ChevronRight size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </motion.main>
            </div>
        </div>
    );
};

export default DeveloperDashboard;
