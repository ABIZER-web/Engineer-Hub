// frontend/src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    getAllUsers, updateUserRole, deleteUser, toggleUserStatus,
    getPendingResources, getPendingResults, getPendingTestimonials
} from '../../services/api';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import {
    Users, Shield, Menu, Search, Trash2, Edit2, CheckCircle, XCircle,
    RefreshCw, LogOut, Filter, ChevronDown, AlertCircle, Eye, EyeOff,
    Activity, BookOpen, FileText, Star, X, UserPlus, Lock, Unlock
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';
import AdminTrendCharts from '../../components/AdminTrendCharts';

const RoleBadge = ({ role }) => {
    const map = {
        student: 'bg-blue-50 text-blue-700 border-blue-200',
        developer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        admin: 'bg-violet-50 text-violet-700 border-violet-200',
        super_admin: 'bg-red-50 text-red-700 border-red-200',
    };
    return <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[role] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>{role?.replace('_', ' ')}</span>;
};

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
    <motion.div whileHover={{ y: -3 }} onClick={onClick}
        className={`bg-white/95 border border-emerald-100/30 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2.5`}>
            <Icon size={17} className="text-white" />
        </div>
        <p className="text-[9px] font-black uppercase tracking-wider text-blue-900/40 mb-0.5">{label}</p>
        <p className="text-xl font-black text-emerald-600">{value}</p>
    </motion.div>
);

const AdminDashboard = () => {
    const { user: authUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [pendingCounts, setPendingCounts] = useState({ resources: 0, results: 0, testimonials: 0 });
    const [editingUser, setEditingUser] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const isMounted = useRef(true);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await getAllUsers();
            if (isMounted.current) setUsers(res.users || []);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        const init = async () => {
            try {
                const [usersRes, resourcesRes, resultsRes, testimonialsRes] = await Promise.allSettled([
                    getAllUsers(),
                    getPendingResources(),
                    getPendingResults(),
                    getPendingTestimonials(),
                ]);
                if (!isMounted.current) return;
                if (usersRes.status === 'fulfilled') setUsers(usersRes.value.users || []);
                setPendingCounts({
                    resources: resourcesRes.status === 'fulfilled' ? (resourcesRes.value.resources?.length || 0) : 0,
                    results: resultsRes.status === 'fulfilled' ? (resultsRes.value.results?.length || 0) : 0,
                    testimonials: testimonialsRes.status === 'fulfilled' ? (testimonialsRes.value.testimonials?.length || 0) : 0,
                });
            } catch { /* ignore */ }
            finally { if (isMounted.current) setLoading(false); }
        };
        init();
        return () => { isMounted.current = false; };
    }, []);

    const handleRoleChange = async (userId, role) => {
        setActionLoading(true);
        try {
            await updateUserRole(userId, { role });
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u));
            setEditingUser(null);
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

    const handleDeleteUser = async (userId) => {
        setActionLoading(true);
        try {
            await deleteUser(userId);
            setUsers(prev => prev.filter(u => u._id !== userId));
            setDeleteConfirm(null);
        } catch { /* ignore */ }
        finally { setActionLoading(false); }
    };

    const filtered = users.filter(u => {
        const matchSearch = !search || `${u.firstName} ${u.lastName} ${u.email} ${u.rollNumber}`.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    const stats = {
        total: users.length,
        students: users.filter(u => u.role === 'student').length,
        developers: users.filter(u => u.role === 'developer').length,
        admins: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-100/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

            <div className="flex-1 flex flex-col min-h-screen relative z-10">
                <NewsTicker />
                <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50 transition-colors">
                            <Menu size={20} />
                        </button>
                        <div>
                            <h1 className="text-base font-black text-emerald-600">Admin Dashboard</h1>
                            <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">User management & system control</p>
                        </div>
                    </div>
          <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <button onClick={fetchUsers} className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Refresh">
                            <RefreshCw size={16} />
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
                    className="flex-1 px-4 md:px-6 py-6 max-w-6xl mx-auto w-full">

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <StatCard icon={Users} label="Total Users" value={stats.total} color="from-emerald-500 to-emerald-600" />
                        <StatCard icon={Activity} label="Students" value={stats.students} color="from-blue-500 to-indigo-600" />
                        <StatCard icon={Shield} label="Developers" value={stats.developers} color="from-violet-500 to-purple-600" />
                        <StatCard icon={Star} label="Admins" value={stats.admins} color="from-amber-500 to-orange-500" />
                    </div>

                    <AdminTrendCharts />

                    {/* Pending approvals */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        {[
                            { label: 'Pending Resources', count: pendingCounts.resources, path: '/admin/approval', color: 'from-teal-500 to-emerald-500', icon: BookOpen },
                            { label: 'Pending Results', count: pendingCounts.results, path: '/admin/approval', color: 'from-blue-500 to-indigo-500', icon: FileText },
                            { label: 'Pending Testimonials', count: pendingCounts.testimonials, path: '/admin/testimonials', color: 'from-amber-500 to-orange-500', icon: Star },
                        ].map(item => (
                            <motion.button key={item.label} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                                onClick={() => navigate(item.path)}
                                className="flex items-center gap-3 p-4 bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm hover:shadow-md transition-all text-left">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                                    <item.icon size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-blue-900">{item.label}</p>
                                    <p className={`text-xl font-black ${item.count > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{item.count}</p>
                                </div>
                                {item.count > 0 && (
                                    <span className="ml-auto flex h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                                )}
                            </motion.button>
                        ))}
                    </motion.div>

                    {/* Users table */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-emerald-100/20 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <h3 className="text-sm font-black text-emerald-600 uppercase tracking-wide flex-1">User Database</h3>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-56">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
                                        className="w-full pl-8 pr-3 py-2 text-xs font-medium border border-emerald-100/40 rounded-xl bg-emerald-50/30 focus:outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-200 transition-all" />
                                </div>
                                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                                    className="text-xs font-bold border border-emerald-100/40 rounded-xl px-2.5 py-2 bg-emerald-50/30 focus:outline-none focus:border-emerald-300 transition-all cursor-pointer">
                                    <option value="all">All Roles</option>
                                    <option value="student">Students</option>
                                    <option value="developer">Developers</option>
                                    <option value="admin">Admins</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-6 space-y-2.5">
                                {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-12 text-center">
                                <Users size={36} className="text-gray-200 mx-auto mb-2" />
                                <p className="text-sm font-medium text-blue-900/40">No users found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-emerald-50/60 to-blue-50/40">
                                            {['User', 'Email', 'Role', 'Branch/Sem', 'Status', 'Joined', 'Actions'].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-blue-900/40">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-emerald-50">
                                        {filtered.map((u, i) => (
                                            <motion.tr key={u._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.02 }}
                                                className="hover:bg-emerald-50/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-[9px] font-black flex-shrink-0">
                                                            {u.firstName?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-blue-900">{u.firstName} {u.lastName}</p>
                                                            {u.rollNumber && <p className="text-[9px] text-blue-900/40">{u.rollNumber}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-blue-900/60 font-medium">{u.email}</td>
                                                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                                                <td className="px-4 py-3 text-xs text-blue-900/50 font-medium">{u.branch || '—'} {u.semester ? `/ Sem ${u.semester}` : ''}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${u.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                        {u.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-[10px] text-blue-900/40 font-medium">{formatDate(u.createdAt, 'MMM dd, yyyy')}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        {/* Toggle status */}
                                                        <button onClick={() => handleToggleStatus(u._id)}
                                                            className={`p-1.5 rounded-lg transition-all ${u.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-500 hover:bg-red-50'}`}
                                                            title={u.isActive ? 'Deactivate' : 'Activate'}>
                                                            {u.isActive ? <Lock size={13} /> : <Unlock size={13} />}
                                                        </button>
                                                        {/* Edit role */}
                                                        <div className="relative">
                                                            <button onClick={() => setEditingUser(editingUser === u._id ? null : u._id)}
                                                                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-all" title="Change role">
                                                                <Edit2 size={13} />
                                                            </button>
                                                            <AnimatePresence>
                                                                {editingUser === u._id && (
                                                                    <motion.div initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.95 }}
                                                                        className="absolute right-0 top-8 z-50 bg-white border border-emerald-100/40 rounded-xl shadow-xl p-2 min-w-[130px]">
                                                                        {['student', 'developer', 'admin'].map(r => (
                                                                            <button key={r} onClick={() => handleRoleChange(u._id, r)}
                                                                                className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors ${u.role === r ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-50 text-gray-600'}`}>
                                                                                {r.charAt(0).toUpperCase() + r.slice(1)}
                                                                            </button>
                                                                        ))}
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                        {/* Delete */}
                                                        {u._id !== authUser?._id && (
                                                            <button onClick={() => setDeleteConfirm(u._id)}
                                                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all" title="Delete user">
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="px-5 py-3 border-t border-emerald-50 bg-gradient-to-r from-emerald-50/30 to-blue-50/20">
                            <p className="text-[10px] font-bold text-blue-900/40">Showing {filtered.length} of {users.length} users</p>
                        </div>
                    </motion.div>
                </motion.main>
            </div>

            {/* Delete confirm modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={22} className="text-red-500" />
                            </div>
                            <h3 className="text-base font-black text-blue-900 text-center mb-2">Delete User?</h3>
                            <p className="text-xs text-blue-900/50 text-center mb-5">This action is permanent and cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-wider hover:bg-gray-200 transition-all">
                                    Cancel
                                </button>
                                <button onClick={() => handleDeleteUser(deleteConfirm)} disabled={actionLoading}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-black uppercase tracking-wider hover:bg-red-600 transition-all disabled:opacity-50">
                                    {actionLoading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
