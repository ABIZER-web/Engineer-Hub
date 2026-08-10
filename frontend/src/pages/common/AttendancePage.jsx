// frontend/src/pages/common/AttendancePage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    getUserLectures, createLecture, deleteLecture, markAttendance, getAttendanceStats
} from '../../services/api';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import {
    CheckCircle2, XCircle, Menu, Plus, Trash2, Loader2,
    AlertCircle, Target, BarChart, RefreshCw, X,
    TrendingUp, BookOpen, Clock, Percent
} from 'lucide-react';
import { calcAttendancePercent, classesNeededFor, classesCanBunk, getAttendanceColor } from '../../utils/formatters';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';

// Circular progress ring
const CircularProgress = ({ percent, size = 100, strokeWidth = 8 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
    const color = percent >= 85 ? '#059669' : percent >= 75 ? '#2563eb' : percent >= 60 ? '#d97706' : '#ef4444';
    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
                    strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black" style={{ color }}>{percent}%</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-blue-900/40">Overall</span>
            </div>
        </div>
    );
};

// Add lecture modal
const AddLectureModal = ({ onClose, onAdd, loading }) => {
    const [form, setForm] = useState({ subject: '', subjectCode: '', professor: '', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', room: '' });
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const handleSubmit = (e) => { e.preventDefault(); if (!form.subject || !form.dayOfWeek) return; onAdd(form); };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-5 flex items-center justify-between">
                    <h2 className="text-sm font-black text-white uppercase tracking-wide">Add New Subject</h2>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Subject Name *</label>
                            <input value={form.subject} onChange={e => set('subject', e.target.value)} required placeholder="e.g. Data Structures"
                                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 transition-all" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Subject Code</label>
                            <input value={form.subjectCode} onChange={e => set('subjectCode', e.target.value)} placeholder="e.g. CS301"
                                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Professor</label>
                        <input value={form.professor} onChange={e => set('professor', e.target.value)} placeholder="Professor name"
                            className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Day *</label>
                            <select value={form.dayOfWeek} onChange={e => set('dayOfWeek', e.target.value)}
                                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all">
                                {days.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Start</label>
                            <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)}
                                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all" />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">End</label>
                            <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)}
                                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Room</label>
                        <input value={form.room} onChange={e => set('room', e.target.value)} placeholder="e.g. A-201"
                            className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-wider hover:bg-gray-200 transition-all">Cancel</button>
                        <button type="submit" disabled={loading || !form.subject}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] disabled:opacity-50 transition-all shadow-md">
                            {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Add Subject'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

const AttendancePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lectures, setLectures] = useState([]);
    const [stats, setStats] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addLoading, setAddLoading] = useState(false);
    const [markingId, setMarkingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const isMounted = useRef(true);

    const fetchData = useCallback(async () => {
        if (!user?._id) return;
        setLoading(true);
        try {
            const [lectRes, statsRes] = await Promise.allSettled([
                getUserLectures(user._id),
                getAttendanceStats(user._id),
            ]);
            if (!isMounted.current) return;
            if (lectRes.status === 'fulfilled') setLectures(lectRes.value.lectures || []);
            if (statsRes.status === 'fulfilled') setStats(statsRes.value.stats || null);
        } catch { /* ignore */ }
        finally { if (isMounted.current) setLoading(false); }
    }, [user?._id]);

    useEffect(() => {
        isMounted.current = true;
        fetchData();
        return () => { isMounted.current = false; };
    }, [fetchData]);

    const handleAddLecture = async (formData) => {
        setAddLoading(true);
        try {
            const res = await createLecture(formData);
            if (res.success) {
                setLectures(prev => [...prev, res.lecture]);
                setShowAddModal(false);
                fetchData();
            }
        } catch { /* ignore */ }
        finally { setAddLoading(false); }
    };

    const handleMark = async (lectureId, status) => {
        setMarkingId(lectureId + status);
        try {
            const res = await markAttendance(lectureId, { date: selectedDate, status });
            if (res.success) {
                setLectures(prev => prev.map(l => l._id === lectureId ? res.lecture : l));
                fetchData(); // refresh stats
            }
        } catch { /* ignore */ }
        finally { setMarkingId(null); }
    };

    const handleDelete = async (lectureId) => {
        setDeleteId(lectureId);
        try {
            await deleteLecture(lectureId);
            setLectures(prev => prev.filter(l => l._id !== lectureId));
            fetchData();
        } catch { /* ignore */ }
        finally { setDeleteId(null); }
    };

    const getRecordForDate = (lecture, date) => {
        return lecture.records?.find(r => new Date(r.date).toDateString() === new Date(date).toDateString());
    };

    const overallPercent = stats?.overallPercentage || 0;
    const colors = getAttendanceColor(overallPercent);

    // Days of week bar chart data (count present per day)
    const dayTotals = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 };
    lectures.forEach(l => {
        l.records?.forEach(r => {
            const day = new Date(r.date).toLocaleString('en-US', { weekday: 'long' });
            if (r.status === 'present' && dayTotals[day] !== undefined) dayTotals[day]++;
        });
    });
    const maxDayCount = Math.max(...Object.values(dayTotals), 1);

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
            <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

            <div className="flex-1 flex flex-col min-h-screen relative z-10">
                <NewsTicker />
                <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20} /></button>
                        <div>
                            <h1 className="text-base font-black text-emerald-600">Attendance Tracker</h1>
                            <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Track, mark, and analyse your attendance</p>
                        </div>
                    </div>
          <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                            className="text-xs font-bold border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-300 bg-emerald-50/30 transition-all" />
                        <button onClick={fetchData} className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><RefreshCw size={16} /></button>
                    </div>
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>

                <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                    className="flex-1 px-4 md:px-6 py-6 max-w-5xl mx-auto w-full">

                    {/* 75% warning alert */}
                    {!loading && overallPercent > 0 && overallPercent < 75 && (
                        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/60 rounded-2xl p-4 mb-5 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                                <AlertCircle size={18} className="text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-red-600">⚠ Below 75% Attendance Target</p>
                                <p className="text-xs font-medium text-red-500/80 mt-0.5">
                                    You need <strong>{classesNeededFor(stats?.totalPresent || 0, stats?.totalClasses || 0)}</strong> more consecutive present classes to reach 75%.
                                    Current: <strong>{overallPercent}%</strong>
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { icon: BookOpen, label: 'Subjects', value: stats?.totalSubjects || 0, gradient: 'from-emerald-500 to-emerald-600' },
                            { icon: CheckCircle2, label: 'Present', value: stats?.totalPresent || 0, gradient: 'from-blue-500 to-indigo-600' },
                            { icon: XCircle, label: 'Absent', value: stats?.totalAbsent || 0, gradient: 'from-red-500 to-red-600' },
                            { icon: Percent, label: 'Overall %', value: `${overallPercent}%`, gradient: overallPercent >= 75 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-orange-500' },
                        ].map(({ icon: Icon, label, value, gradient }, i) => (
                            <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                whileHover={{ y: -3 }}
                                className="bg-white/95 border border-emerald-100/30 rounded-2xl p-4 shadow-sm">
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-2.5`}>
                                    <Icon size={17} className="text-white" />
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-wider text-blue-900/40">{label}</p>
                                <p className="text-xl font-black text-emerald-600 mt-0.5">{value}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Main content: circular gauge + weekly bar chart */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                        {/* Circular attendance ring */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center">
                            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wide mb-4">Attendance Ring</h3>
                            <CircularProgress percent={overallPercent} size={120} strokeWidth={10} />
                            <div className="mt-4 grid grid-cols-2 gap-3 w-full">
                                <div className="text-center p-2.5 bg-emerald-50/60 rounded-xl">
                                    <p className="text-xs font-black text-emerald-600">{classesCanBunk(stats?.totalPresent || 0, stats?.totalClasses || 0)}</p>
                                    <p className="text-[9px] font-bold text-blue-900/40 uppercase tracking-wider">Can Bunk</p>
                                </div>
                                <div className="text-center p-2.5 bg-red-50/60 rounded-xl">
                                    <p className="text-xs font-black text-red-500">{classesNeededFor(stats?.totalPresent || 0, stats?.totalClasses || 0)}</p>
                                    <p className="text-[9px] font-bold text-blue-900/40 uppercase tracking-wider">Need More</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Weekly bar chart */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                            className="md:col-span-2 bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wide mb-4">Weekly Presence (All-time)</h3>
                            <div className="flex items-end gap-3 h-32 px-2">
                                {Object.entries(dayTotals).map(([day, count]) => {
                                    const pct = (count / maxDayCount) * 100;
                                    return (
                                        <div key={day} className="flex-1 flex flex-col items-center gap-1">
                                            <span className="text-[9px] font-black text-emerald-600">{count}</span>
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${Math.max(pct, 4)}%` }}
                                                transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
                                                className="w-full bg-gradient-to-t from-emerald-600 to-blue-500 rounded-t-lg min-h-[4px]"
                                            />
                                            <span className="text-[8px] font-black uppercase text-blue-900/40">{day.slice(0, 3)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>

                    {/* Lectures list */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-emerald-50 flex items-center justify-between">
                            <h3 className="text-sm font-black text-emerald-600 uppercase tracking-wide">
                                Subjects — Mark for {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </h3>
                            <button onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-3 py-2 rounded-xl hover:scale-[1.02] transition-all shadow-sm">
                                <Plus size={13} /> Add Subject
                            </button>
                        </div>

                        {loading ? (
                            <div className="p-5 space-y-2.5">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}</div>
                        ) : lectures.length === 0 ? (
                            <div className="py-12 text-center">
                                <BookOpen size={36} className="text-gray-200 mx-auto mb-3" />
                                <p className="text-sm font-bold text-blue-900/40 mb-2">No subjects added yet</p>
                                <button onClick={() => setShowAddModal(true)}
                                    className="text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2 rounded-xl shadow-md hover:scale-[1.02] transition-all">
                                    Add Your First Subject
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-emerald-50">
                                {lectures.map((lec, i) => {
                                    const pct = calcAttendancePercent(lec.presentCount, lec.totalClasses);
                                    const col = getAttendanceColor(pct);
                                    const todayRecord = getRecordForDate(lec, selectedDate);
                                    const isMarkingPresent = markingId === lec._id + 'present';
                                    const isMarkingAbsent = markingId === lec._id + 'absent';
                                    return (
                                        <motion.div key={lec._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.41 + i * 0.04 }}
                                            className="p-4 hover:bg-emerald-50/20 transition-colors">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                {/* Subject info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <p className="text-sm font-black text-blue-900 truncate">{lec.subject}</p>
                                                        {lec.subjectCode && <span className="text-[9px] font-black text-blue-900/40 bg-blue-50 px-1.5 py-0.5 rounded-md">{lec.subjectCode}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-blue-900/40 font-medium">
                                                        <span>{lec.dayOfWeek} · {lec.startTime} – {lec.endTime}</span>
                                                        {lec.professor && <span>· {lec.professor}</span>}
                                                    </div>
                                                </div>

                                                {/* Stats */}
                                                <div className="flex items-center gap-3">
                                                    <div className="text-center">
                                                        <p className={`text-sm font-black ${col.text}`}>{pct}%</p>
                                                        <p className="text-[9px] text-blue-900/30">{lec.presentCount}/{lec.totalClasses}</p>
                                                    </div>
                                                    {/* Mark buttons */}
                                                    <div className="flex items-center gap-1.5">
                                                        <button onClick={() => handleMark(lec._id, 'present')} disabled={!!markingId}
                                                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${todayRecord?.status === 'present' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'} disabled:opacity-60`}>
                                                            {isMarkingPresent ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                                                            P
                                                        </button>
                                                        <button onClick={() => handleMark(lec._id, 'absent')} disabled={!!markingId}
                                                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${todayRecord?.status === 'absent' ? 'bg-red-500 text-white shadow-sm' : 'bg-red-50 text-red-500 hover:bg-red-100'} disabled:opacity-60`}>
                                                            {isMarkingAbsent ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                                                            A
                                                        </button>
                                                        <button onClick={() => handleDelete(lec._id)} disabled={deleteId === lec._id}
                                                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50">
                                                            {deleteId === lec._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="mt-2.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ delay: 0.5 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                                                    className={`h-full rounded-full ${pct >= 75 ? 'bg-gradient-to-r from-emerald-500 to-blue-500' : 'bg-gradient-to-r from-red-400 to-orange-400'}`}
                                                />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                </motion.main>
            </div>

            <AnimatePresence>
                {showAddModal && (
                    <AddLectureModal onClose={() => setShowAddModal(false)} onAdd={handleAddLecture} loading={addLoading} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AttendancePage;
