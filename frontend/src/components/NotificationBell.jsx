// frontend/src/components/NotificationBell.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellRing, Check, Trash2, ShoppingBag, CheckCircle, XCircle, Banknote, Megaphone, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
    getNotifications, getUnreadNotificationCount,
    markNotificationRead, markAllNotificationsRead, deleteNotification,
} from '../services/api';
import { formatRelativeTime } from '../utils/formatters';
import { isPushSupported, getPushSubscription, subscribeToPush, unsubscribeFromPush } from '../utils/push';

const ICONS = {
    order_placed:       ShoppingBag,
    item_approved:      CheckCircle,
    item_rejected:      XCircle,
    withdrawal_update:  Banknote,
    announcement:       Megaphone,
    general:            Info,
};

const POLL_MS = 30000;

const NotificationBell = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushBusy, setPushBusy] = useState(false);
    const boxRef = useRef(null);

    const fetchUnread = useCallback(async () => {
        try {
            const res = await getUnreadNotificationCount();
            if (res.success) setUnread(res.count);
        } catch { /* silent — non-critical */ }
    }, []);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getNotifications();
            if (res.success) setItems(res.notifications);
        } catch { /* silent */ } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchUnread();
        const id = setInterval(fetchUnread, POLL_MS);
        return () => clearInterval(id);
    }, [isAuthenticated, fetchUnread]);

    useEffect(() => {
        if (!isAuthenticated || !isPushSupported()) return;
        getPushSubscription().then(sub => setPushEnabled(!!sub)).catch(() => {});
    }, [isAuthenticated]);

    const togglePush = async (e) => {
        e.stopPropagation();
        setPushBusy(true);
        try {
            if (pushEnabled) {
                await unsubscribeFromPush();
                setPushEnabled(false);
            } else {
                await subscribeToPush();
                setPushEnabled(true);
            }
        } catch (err) {
            // permission denied or unsupported — fail quietly, the toggle just stays off
            console.warn('Push toggle failed:', err.message);
        } finally {
            setPushBusy(false);
        }
    };

    useEffect(() => {
        const onClickOutside = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const toggleOpen = () => {
        const next = !open;
        setOpen(next);
        if (next) fetchList();
    };

    const handleItemClick = async (n) => {
        if (!n.isRead) {
            setItems(prev => prev.map(x => x._id === n._id ? { ...x, isRead: true } : x));
            setUnread(prev => Math.max(0, prev - 1));
            markNotificationRead(n._id).catch(() => {});
        }
        setOpen(false);
        if (n.link) navigate(n.link);
    };

    const handleMarkAllRead = async (e) => {
        e.stopPropagation();
        setItems(prev => prev.map(x => ({ ...x, isRead: true })));
        setUnread(0);
        try { await markAllNotificationsRead(); } catch { /* silent */ }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        const wasUnread = items.find(x => x._id === id)?.isRead === false;
        setItems(prev => prev.filter(x => x._id !== id));
        if (wasUnread) setUnread(prev => Math.max(0, prev - 1));
        try { await deleteNotification(id); } catch { /* silent */ }
    };

    if (!isAuthenticated) return null;

    return (
        <div ref={boxRef} className="relative flex-shrink-0">
            <button
                onClick={toggleOpen}
                aria-label="Notifications"
                className="relative w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 border border-emerald-100/40 flex items-center justify-center transition-colors"
            >
                <Bell size={16} className="text-blue-900/70" />
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-[340px] max-w-[85vw] bg-white rounded-2xl shadow-2xl border border-emerald-100/50 overflow-hidden z-50"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-50">
                            <span className="text-xs font-black uppercase tracking-wider text-blue-900/70">Notifications</span>
                            <div className="flex items-center gap-3">
                                {isPushSupported() && (
                                    <button
                                        onClick={togglePush}
                                        disabled={pushBusy}
                                        title={pushEnabled ? 'Push notifications on — click to turn off' : 'Turn on push notifications'}
                                        className={`flex items-center gap-1 text-[11px] font-bold transition-colors disabled:opacity-50 ${pushEnabled ? 'text-emerald-600 hover:text-emerald-700' : 'text-blue-900/40 hover:text-blue-900/60'}`}
                                    >
                                        {pushEnabled ? <BellRing size={12} /> : <Bell size={12} />}
                                        {pushEnabled ? 'Push on' : 'Enable push'}
                                    </button>
                                )}
                                {unread > 0 && (
                                    <button onClick={handleMarkAllRead} className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                                        <Check size={12} /> Mark all read
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {loading && (
                                <div className="py-8 text-center text-xs text-blue-900/40 font-bold">Loading…</div>
                            )}
                            {!loading && items.length === 0 && (
                                <div className="py-10 text-center">
                                    <Bell size={24} className="mx-auto mb-2 text-blue-900/20" />
                                    <p className="text-xs text-blue-900/40 font-bold">You're all caught up</p>
                                </div>
                            )}
                            {!loading && items.map(n => {
                                const Icon = ICONS[n.type] || Info;
                                return (
                                    <div
                                        key={n._id}
                                        onClick={() => handleItemClick(n)}
                                        className={`group flex gap-3 px-4 py-3 border-b border-emerald-50/70 cursor-pointer hover:bg-emerald-50/50 transition-colors ${!n.isRead ? 'bg-emerald-50/30' : ''}`}
                                    >
                                        <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center ${!n.isRead ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Icon size={14} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-xs leading-snug ${!n.isRead ? 'font-black text-blue-900' : 'font-semibold text-blue-900/60'}`}>{n.title}</p>
                                            <p className="text-[11px] text-blue-900/50 mt-0.5 line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-blue-900/30 mt-1 font-bold">{formatRelativeTime(n.createdAt)}</p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, n._id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity self-start p-1 rounded-lg hover:bg-red-50 text-red-400"
                                            aria-label="Delete notification"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
