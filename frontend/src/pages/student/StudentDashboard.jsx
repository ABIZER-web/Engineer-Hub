// frontend/src/pages/student/StudentDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    getUserById, getApprovedResources, getUpcomingEvents,
    getResultsByUser, getAttendanceStats
} from '../../services/api';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import {
    CalendarCheck, FileText, ShoppingBag, BookOpen, Calendar,
    Briefcase, TrendingUp, ChevronRight, Menu, Bell, User,
    Award, Activity, Target, Flame, Star, Clock, LogOut
} from 'lucide-react';
import { formatDate, calcAttendancePercent } from '../../utils/formatters';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';

// Floating background dots
const StatCard = ({ icon: Icon, label, value, sub, color, delay = 0, onClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        whileHover={{ y: -4, scale: 1.01 }}
        onClick={onClick}
        className={`bg-white/95 backdrop-blur-sm border border-emerald-100/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-sm`}>
            <Icon size={20} className="text-white" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-wider text-blue-900/50 mb-0.5">{label}</p>
        <p className="text-2xl font-black text-emerald-600 tracking-tight">{value}</p>
        {sub && <p className="text-[11px] font-bold text-blue-900/40 mt-0.5">{sub}</p>}
    </motion.div>
);

const QuickLink = ({ icon: Icon, label, path, color, delay }) => {
    const navigate = useNavigate();
    return (
        <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.3 }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(path)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/95 border border-emerald-100/20 hover:border-emerald-200/50 hover:shadow-sm transition-all duration-200 group"
        >
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <Icon size={15} className="text-white" />
                </div>
                <span className="text-sm font-bold text-blue-900/70 group-hover:text-blue-900 transition-colors">{label}</span>
            </div>
            <ChevronRight size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.button>
    );
};

const StudentDashboard = () => {
    const { user: authUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [stats, setStats] = useState({
        attendancePercent: 0,
        totalSubjects: 0,
        upcomingEvents: 0,
        resourcesCount: 0,
        latestSgpa: null,
        eventsData: [],
    });
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        const fetchData = async () => {
            if (!authUser?._id) { setLoading(false); return; }
            try {
                const [userRes, attendRes, eventsRes, resourcesRes, resultsRes] = await Promise.allSettled([
                    getUserById(authUser._id),
                    getAttendanceStats(authUser._id),
                    getUpcomingEvents(),
                    getApprovedResources(),
                    getResultsByUser(authUser._id),
                ]);

                if (!isMounted.current) return;

                if (userRes.status === 'fulfilled' && userRes.value.success) setUserData(userRes.value.user);

                const attendData = attendRes.status === 'fulfilled' ? attendRes.value.stats : null;
                const eventsData = eventsRes.status === 'fulfilled' ? (eventsRes.value.events || []).slice(0, 4) : [];
                const resources = resourcesRes.status === 'fulfilled' ? (resourcesRes.value.resources || []) : [];
                const results = resultsRes.status === 'fulfilled' ? (resultsRes.value.results || []) : [];
                const latestResult = results.sort((a, b) => b.semester - a.semester)[0];

                setStats({
                    attendancePercent: attendData?.overallPercentage || 0,
                    totalSubjects: attendData?.totalSubjects || 0,
                    upcomingEvents: eventsData.length,
                    resourcesCount: resources.length,
                    latestSgpa: latestResult?.sgpa || null,
                    eventsData,
                });
            } catch { /* ignore */ }
            finally { if (isMounted.current) setLoading(false); }
        };
        fetchData();
        return () => { isMounted.current = false; };
    }, [authUser]);

    const firstName = userData?.firstName || authUser?.firstName || 'Student';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    const attendColor = stats.attendancePercent >= 75 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-orange-500';

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-blue-50/20">
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-100/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

            <div className="flex-1 flex flex-col min-h-screen relative z-10">
                <NewsTicker />

                {/* Top bar */}
                <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50 transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                        <div>
                            <h1 className="text-base font-black text-emerald-600">Student Dashboard</h1>
                            <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">
                                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
          <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/profile')} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-emerald-50 transition-colors">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-black">
                                {firstName.charAt(0).toUpperCase()}
                            </div>
                            <span className="hidden sm:inline text-xs font-bold text-blue-900">{firstName}</span>
                        </button>
                        <button
                            onClick={async () => { await logout(); navigate('/auth', { replace: true }); }}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>

                {/* Main content */}
                <motion.main
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 px-4 md:px-6 py-6 max-w-5xl mx-auto w-full"
                >
                    {/* Welcome hero */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-6 md:p-8 mb-6 text-white relative overflow-hidden shadow-lg"
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
                        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
                        <div className="relative z-10">
                            <p className="text-emerald-100/80 text-xs font-black uppercase tracking-widest mb-1">{greeting} 👋</p>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">{firstName}!</h2>
                            <p className="text-white/70 text-sm font-medium">
                                {authUser?.branch ? `${authUser.branch} • Sem ${authUser.semester || '?'}` : 'Engineer Hub Student'}
                                {authUser?.rollNumber ? ` • ${authUser.rollNumber}` : ''}
                            </p>
                        </div>
                    </motion.div>

                    {/* Stats grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white/80 rounded-2xl p-5 animate-pulse h-28" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <StatCard
                                icon={Activity}
                                label="Attendance"
                                value={`${stats.attendancePercent}%`}
                                sub={stats.attendancePercent < 75 ? '⚠ Below 75%' : '✓ On track'}
                                color={attendColor}
                                delay={0.1}
                                onClick={() => navigate('/attendance')}
                            />
                            <StatCard
                                icon={FileText}
                                label="Latest SGPA"
                                value={stats.latestSgpa ? stats.latestSgpa.toFixed(2) : 'N/A'}
                                sub="Current semester"
                                color="from-blue-500 to-indigo-600"
                                delay={0.15}
                                onClick={() => navigate('/results')}
                            />
                            <StatCard
                                icon={Calendar}
                                label="Events"
                                value={stats.upcomingEvents}
                                sub="Upcoming"
                                color="from-violet-500 to-purple-600"
                                delay={0.2}
                                onClick={() => navigate('/events')}
                            />
                            <StatCard
                                icon={BookOpen}
                                label="Resources"
                                value={stats.resourcesCount}
                                sub="Available"
                                color="from-amber-500 to-orange-500"
                                delay={0.25}
                                onClick={() => navigate('/resources')}
                            />
                        </div>
                    )}

                    {/* Content grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Quick navigation */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/95 backdrop-blur-sm border border-emerald-100/30 rounded-2xl p-5 shadow-sm"
                        >
                            <h3 className="text-sm font-black text-emerald-600 uppercase tracking-wide mb-4">Quick Access</h3>
                            <div className="space-y-1.5">
                                <QuickLink icon={CalendarCheck} label="Track Attendance" path="/attendance" color="from-emerald-500 to-emerald-600" delay={0.31} />
                                <QuickLink icon={FileText} label="View Results" path="/results" color="from-blue-500 to-indigo-500" delay={0.33} />
                                <QuickLink icon={ShoppingBag} label="Marketplace" path="/marketplace" color="from-violet-500 to-purple-500" delay={0.35} />
                                <QuickLink icon={Briefcase} label="Freelancing Hub" path="/freelancing" color="from-amber-500 to-orange-500" delay={0.37} />
                                <QuickLink icon={BookOpen} label="Resource Library" path="/resources" color="from-teal-500 to-emerald-500" delay={0.39} />
                            </div>
                        </motion.div>

                        {/* Upcoming events */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="bg-white/95 backdrop-blur-sm border border-emerald-100/30 rounded-2xl p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black text-emerald-600 uppercase tracking-wide">Upcoming Events</h3>
                                <button onClick={() => navigate('/events')} className="text-[10px] font-black uppercase tracking-wider text-blue-600 hover:text-emerald-600 transition-colors">
                                    View All →
                                </button>
                            </div>
                            {stats.eventsData.length === 0 ? (
                                <div className="text-center py-6">
                                    <Calendar size={32} className="text-gray-200 mx-auto mb-2" />
                                    <p className="text-xs font-medium text-blue-900/40">No upcoming events</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {stats.eventsData.map((ev, i) => (
                                        <motion.div
                                            key={ev._id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + i * 0.05 }}
                                            className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50/60 to-blue-50/40 border border-emerald-100/20"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                                <Calendar size={14} className="text-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-blue-900 truncate">{ev.title}</p>
                                                <p className="text-[10px] font-medium text-emerald-600">{formatDate(ev.date, 'MMM dd, yyyy')}</p>
                                                {ev.venue && <p className="text-[10px] text-blue-900/40 truncate">{ev.venue}</p>}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Attendance alert */}
                        {!loading && stats.attendancePercent > 0 && stats.attendancePercent < 75 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.45 }}
                                className="md:col-span-2 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/50 rounded-2xl p-5"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                                        <Target size={18} className="text-red-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-red-600 mb-1">⚠ Attendance Warning</h4>
                                        <p className="text-xs font-medium text-red-500/80">
                                            Your overall attendance is <strong>{stats.attendancePercent}%</strong> — below the required 75%.
                                            Visit the Attendance page to track and improve your standing.
                                        </p>
                                        <button
                                            onClick={() => navigate('/attendance')}
                                            className="mt-2 text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            View Attendance →
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.main>
            </div>
        </div>
    );
};

export default StudentDashboard;
