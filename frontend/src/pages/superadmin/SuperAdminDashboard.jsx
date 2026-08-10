// frontend/src/pages/superadmin/SuperAdminDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    getAllUsers, deleteUser, updateUserRole, toggleUserStatus,
    getAllMarketplaceItems, getPendingResources, getPendingResults
} from '../../services/api';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import {
    Users, Shield, Menu, Trash2, Edit2, Activity, TrendingUp, ShoppingBag,
    BookOpen, FileText, Star, RefreshCw, LogOut, AlertTriangle, Settings,
    CheckCircle, XCircle, BarChart2, Crown, Lock, Unlock, X
} from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';
import AdminTrendCharts from '../../components/AdminTrendCharts';

const BigStatCard = ({ icon: Icon, label, value, sub, gradient, delay }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} whileHover={{ y: -4 }}
        className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-md`}>
            <Icon size={22} className="text-white" />
        </div>
        <p className="text-[9px] font-black uppercase tracking-widest text-blue-900/40 mb-0.5">{label}</p>
        <p className="text-3xl font-black text-emerald-600 tracking-tight">{value}</p>
        {sub && <p className="text-[10px] font-bold text-blue-900/30 mt-0.5">{sub}</p>}
    </motion.div>
);

const SuperAdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [marketplaceItems, setMarketplaceItems] = useState([]);
    const [pendingCounts, setPendingCounts] = useState({ resources: 0, results: 0 });
    const [activeTab, setActiveTab] = useState('overview');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        const init = async () => {
            try {
                const [usersRes, itemsRes, resourcesRes, resultsRes] = await Promise.allSettled([
                    getAllUsers(),
                    getAllMarketplaceItems(),
                    getPendingResources(),
                    getPendingResults(),
                ]);
                if (!isMounted.current) return;
                if (usersRes.status === 'fulfilled') setUsers(usersRes.value.users || []);
                if (itemsRes.status === 'fulfilled') setMarketplaceItems(itemsRes.value.items || []);
                setPendingCounts({
                    resources: resourcesRes.status === 'fulfilled' ? (resourcesRes.value.resources?.length || 0) : 0,
                    results: resultsRes.status === 'fulfilled' ? (resultsRes.value.results?.length || 0) : 0,
                });
            } catch { /* ignore */ }
            finally { if (isMounted.current) setLoading(false); }
        };
        init();
        return () => { isMounted.current = false; };
    }, []);

    const handleHardDelete = async (userId) => {
        setActionLoading(true);
        try {
            await deleteUser(userId);
            setUsers(prev => prev.filter(u => u._id !== userId));
            setDeleteConfirm(null);
        } catch { /* ignore */ }
        finally { setActionLoading(false); }
    };

    const handleToggleStatus = async (userId) => {
        setActionLoading(true);
        try {
            const res = await toggleUserStatus(userId);
            if (res.success) setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !u.isActive } : u));
        } catch { /* ignore */ }
        finally { setActionLoading(false); }
    };

    const handleRoleChange = async (userId, role) => {
        setActionLoading(true);
        try {
            await updateUserRole(userId, { role });
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u));
        } catch { /* ignore */ }
        finally { setActionLoading(false); }
    };

    const sysStats = {
        totalUsers: users.length,
        students: users.filter(u => u.role === 'student').length,
        developers: users.filter(u => u.role === 'developer').length,
        admins: users.filter(u => ['admin', 'super_admin'].includes(u.role)).length,
        totalListings: marketplaceItems.length,
        approvedListings: marketplaceItems.filter(i => i.status === 'approved').length,
        totalRevenue: marketplaceItems.reduce((s, i) => s + (i.purchaseCount * i.price || 0), 0),
        activeUsers: users.filter(u => u.isActive).length,
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart2 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'system', label: 'System', icon: Settings },
    ];

    const roleMap = { student: 'bg-blue-50 text-blue-700', developer: 'bg-emerald-50 text-emerald-700', admin: 'bg-violet-50 text-violet-700', super_admin: 'bg-red-50 text-red-700' };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/10 to-emerald-50/10">
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-100/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

            <div className="flex-1 flex flex-col min-h-screen relative z-10">
                <NewsTicker />
                <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50">
                            <Menu size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <Crown size={15} className="text-amber-500" />
                                <h1 className="text-base font-black text-emerald-600">Super Admin Command</h1>
                            </div>
                            <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Full system control & absolute access</p>
                        </div>
                    </div>
          <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <button onClick={async () => { await logout(); navigate('/auth', { replace: true }); }}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Logout">
                            <LogOut size={16} />
                        </button>
                    </div>
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>

                <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                    className="flex-1 px-4 md:px-6 py-6 max-w-6xl mx-auto w-full">

                    {/* Hero banner */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-6 mb-6 text-white relative overflow-hidden shadow-lg">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-violet-100/70 text-xs font-black uppercase tracking-widest mb-1">⚡ Super Admin Access</p>
                                <h2 className="text-2xl font-black tracking-tight">{user?.firstName} — Full Control</h2>
                                <p className="text-white/60 text-sm mt-1 font-medium">{sysStats.totalUsers} users · {sysStats.totalListings} listings · {formatCurrency(sysStats.totalRevenue, true)} revenue</p>
                            </div>
                            <Crown size={40} className="text-amber-300 opacity-80 hidden md:block" />
                        </div>
                    </motion.div>

                    {/* Tab navigation */}
                    <div className="flex items-center gap-1 mb-6 bg-white/80 border border-emerald-100/30 rounded-xl p-1 w-fit">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-sm' : 'text-blue-900/50 hover:text-blue-900 hover:bg-emerald-50/60'}`}>
                                <tab.icon size={13} />{tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Overview tab */}
                    {activeTab === 'overview' && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <BigStatCard icon={Users} label="Total Users" value={sysStats.totalUsers} sub={`${sysStats.activeUsers} active`} gradient="from-emerald-500 to-emerald-600" delay={0.1} />
                                <BigStatCard icon={Activity} label="Students" value={sysStats.students} gradient="from-blue-500 to-indigo-600" delay={0.15} />
                                <BigStatCard icon={Shield} label="Developers" value={sysStats.developers} gradient="from-violet-500 to-purple-600" delay={0.2} />
                                <BigStatCard icon={ShoppingBag} label="Listings" value={sysStats.approvedListings} sub={`${sysStats.totalListings} total`} gradient="from-amber-500 to-orange-500" delay={0.25} />
                            </div>

                            <AdminTrendCharts />

                            {/* Pending items */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                {[
                                    { label: 'Pending Resources', count: pendingCounts.resources, path: '/admin/approval', icon: BookOpen, color: 'from-teal-500 to-emerald-500' },
                                    { label: 'Pending Results', count: pendingCounts.results, path: '/admin/approval', icon: FileText, color: 'from-blue-500 to-indigo-500' },
                                ].map(item => (
                                    <motion.button key={item.label} whileHover={{ y: -3 }} onClick={() => navigate(item.path)}
                                        className="flex items-center gap-3 p-4 bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm hover:shadow-md transition-all text-left w-full">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                                            <item.icon size={18} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-blue-900">{item.label}</p>
                                            <p className={`text-xl font-black ${item.count > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{item.count}</p>
                                        </div>
                                        {item.count > 0 && <span className="ml-auto flex h-2.5 w-2.5 rounded-full bg-red-400 animate-ping" />}
                                    </motion.button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Users tab */}
                    {activeTab === 'users' && (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-emerald-100/20">
                                <h3 className="text-sm font-black text-emerald-600 uppercase tracking-wide">All Users — Hard Delete Available</h3>
                                <p className="text-[10px] text-blue-900/40 font-medium mt-0.5">Super Admin: permanent deletion enabled</p>
                            </div>
                            {loading ? (
                                <div className="p-5 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-emerald-50/60 to-blue-50/40">
                                                {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-blue-900/40">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-emerald-50/80">
                                            {users.map((u, i) => (
                                                <tr key={u._id} className="hover:bg-emerald-50/20 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-[9px] font-black">
                                                                {u.firstName?.charAt(0) || '?'}
                                                            </div>
                                                            <p className="text-xs font-black text-blue-900">{u.firstName} {u.lastName}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-blue-900/50">{u.email}</td>
                                                    <td className="px-4 py-3">
                                                        <select value={u.role}
                                                            onChange={e => handleRoleChange(u._id, e.target.value)}
                                                            disabled={u._id === user?._id}
                                                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${roleMap[u.role] || 'bg-gray-50 text-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                                            {['student', 'developer', 'admin', 'super_admin'].map(r => (
                                                                <option key={r} value={r}>{r.replace('_', ' ')}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${u.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                            {u.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-[10px] text-blue-900/40">{formatDate(u.createdAt, 'MMM d, yyyy')}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => handleToggleStatus(u._id)} disabled={u._id === user?._id}
                                                                className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-all disabled:opacity-30" title="Toggle status">
                                                                {u.isActive ? <Lock size={12} /> : <Unlock size={12} />}
                                                            </button>
                                                            {u._id !== user?._id && (
                                                                <button onClick={() => setDeleteConfirm(u._id)}
                                                                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all" title="Hard delete">
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* System tab */}
                    {activeTab === 'system' && (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm">
                                <h3 className="text-sm font-black text-emerald-600 uppercase tracking-wide mb-4">System Variables</h3>
                                {[
                                    { label: 'Platform Fee', value: '5%', type: 'number' },
                                    { label: 'Min Withdrawal (₹)', value: '100', type: 'number' },
                                    { label: 'Max File Size (MB)', value: '10', type: 'number' },
                                    { label: 'Admin Email', value: 'admin@engineerhub.in', type: 'email' },
                                ].map(({ label, value, type }) => (
                                    <div key={label} className="flex items-center justify-between py-2.5 border-b border-emerald-50 last:border-0">
                                        <p className="text-xs font-bold text-blue-900/60">{label}</p>
                                        <input defaultValue={value} type={type}
                                            className="text-xs font-black text-emerald-600 text-right bg-emerald-50/50 border border-emerald-100/30 rounded-lg px-2 py-1 w-36 focus:outline-none focus:border-emerald-300 transition-all" />
                                    </div>
                                ))}
                                <button className="mt-4 w-full py-2.5 bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:scale-[1.02] transition-all shadow-md">
                                    Save Changes
                                </button>
                            </div>
                            <div className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm">
                                <h3 className="text-sm font-black text-red-500 uppercase tracking-wide mb-4">⚠ Danger Zone</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Clear Pending Queue', desc: 'Remove all pending approval items', color: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
                                        { label: 'Reset Announcements', desc: 'Delete all active announcements', color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
                                        { label: 'Export User Data', desc: 'Download full user CSV export', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
                                    ].map(({ label, desc, color }) => (
                                        <div key={label} className={`flex items-center justify-between p-3 rounded-xl ${color.split(' ')[1]} border border-transparent`}>
                                            <div>
                                                <p className={`text-xs font-black ${color.split(' ')[0]}`}>{label}</p>
                                                <p className="text-[10px] text-blue-900/40">{desc}</p>
                                            </div>
                                            <button className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg ${color} transition-all`}>
                                                Run
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.main>
            </div>

            {/* Hard delete confirm */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={22} className="text-red-500" />
                            </div>
                            <h3 className="text-base font-black text-red-600 text-center mb-2">HARD DELETE</h3>
                            <p className="text-xs text-blue-900/50 text-center mb-2">This is a <strong>permanent, irreversible</strong> deletion. All data for this user will be permanently removed from the database.</p>
                            <div className="flex gap-3 mt-5">
                                <button onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-wider">Cancel</button>
                                <button onClick={() => handleHardDelete(deleteConfirm)} disabled={actionLoading}
                                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 transition-all">
                                    {actionLoading ? 'Deleting...' : '⚠ Delete Forever'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SuperAdminDashboard;
