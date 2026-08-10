// frontend/src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, CalendarCheck, FileText, ShoppingBag, BookOpen,
    Calendar, Briefcase, ShieldCheck, ChevronRight, DownloadCloud,
    TrendingUp, DollarSign, LogOut, User, Award, Star, X, CheckCircle,
    Banknote, Settings, CreditCard, Flag, GraduationCap, MessageCircle, HelpCircle
} from 'lucide-react';
import { ROUTES } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

// Active pulsing dot indicator
const ActiveDot = () => (
    <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
    </span>
);

// Hover dot for inactive items
const HoverDot = () => (
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
);

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, logout, isAdmin } = useAuth();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setIsInstallable(true); };
        window.addEventListener('beforeinstallprompt', handler);
        if (window.matchMedia('(display-mode: standalone)').matches) setIsInstallable(false);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') setIsInstallable(false);
            setDeferredPrompt(null);
        } catch { /* ignore */ }
    };

    const handleNav = (path) => {
        if (location.pathname === path) { setIsMobileMenuOpen?.(false); return; }
        navigate(path);
        setIsMobileMenuOpen?.(false);
    };

    const handleLogout = async () => {
        try { await logout(); navigate('/auth', { replace: true }); } catch { /* ignore */ }
    };

    const isActive = (path) =>
        path === ROUTES.DASHBOARD ? location.pathname === path : location.pathname.startsWith(path);

    const mainNavItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.DASHBOARD },
        { icon: CalendarCheck, label: 'Attendance', path: ROUTES.ATTENDANCE },
        { icon: FileText, label: 'Results', path: ROUTES.RESULTS },
        { icon: ShoppingBag, label: 'Store', path: ROUTES.MARKETPLACE },
        { icon: TrendingUp, label: 'My Earnings', path: ROUTES.EARNINGS },
        { icon: Briefcase, label: 'Freelancing', path: ROUTES.FREELANCING },
        { icon: GraduationCap, label: 'Placements', path: ROUTES.PLACEMENTS },
        { icon: MessageCircle, label: 'Messages', path: ROUTES.MESSAGES },
        { icon: CheckCircle, label: 'Purchases', path: ROUTES.PURCHASES },
        { icon: Banknote, label: 'Withdrawal', path: '/withdrawal' },
        { icon: BookOpen, label: 'Resources', path: ROUTES.RESOURCES },
        { icon: Calendar, label: 'Events', path: ROUTES.EVENTS },
        { icon: Star, label: 'Testimonials', path: '/testimonial' },
        { icon: User, label: 'Profile', path: ROUTES.PROFILE },
        { icon: HelpCircle, label: 'Help & FAQ', path: '/faq' },
    ];

    const adminNavItems = [
        { icon: ShieldCheck, label: 'Approval Hub', path: ROUTES.ADMIN_APPROVAL },
        { icon: Flag, label: 'Reports', path: '/admin/reports' },
        { icon: DollarSign, label: 'Admin Earnings', path: ROUTES.ADMIN_EARNINGS },
        { icon: Award, label: 'Announcements', path: ROUTES.ADMIN_ANNOUNCEMENTS },
        { icon: Star, label: 'Testimonials', path: '/admin/testimonials' },
        { icon: CreditCard, label: 'Withdrawals', path: '/admin/withdrawals' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ];

    const NavItem = ({ item }) => {
        const active = isActive(item.path);
        const Icon = item.icon;
        return (
            <motion.button
                onClick={() => handleNav(item.path)}
                className={`group relative w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200
                    ${active
                        ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-emerald-600 hover:bg-gradient-to-r hover:from-emerald-50/80 hover:to-blue-50/50'
                    }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
            >
                {/* Active left-edge accent bar */}
                {active && (
                    <motion.div
                        layoutId="sidebar-active-bar"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/60 rounded-r-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                )}

                <div className="flex items-center gap-3">
                    <Icon size={19} className={active ? 'text-white' : 'text-gray-400 group-hover:text-emerald-500 transition-colors'} />
                    <span>{item.label}</span>
                </div>

                {active ? <ActiveDot /> : <HoverDot />}
            </motion.button>
        );
    };

    return (
        <>
            {/* Mobile overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-[82vw] sm:w-72 bg-white/97 backdrop-blur-sm flex flex-col
                transition-transform duration-300 ease-in-out
                lg:translate-x-0 lg:static lg:h-screen lg:w-68 border-r border-emerald-100/40 shadow-xl lg:shadow-sm
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>

                {/* Brand header */}
                <div className="pt-5 px-5 pb-4 flex items-center justify-between border-b border-emerald-100/30">
                    <div className="cursor-pointer" onClick={() => handleNav(ROUTES.DASHBOARD)}>
                        <Logo size="sm" showText={true} />
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

                    {/* Install PWA */}
                    {isInstallable && (
                        <motion.button
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={handleInstallClick}
                            className="w-full mb-4 flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                        >
                            <div className="flex items-center gap-3">
                                <DownloadCloud size={18} />
                                <div className="text-left">
                                    <p className="text-[9px] font-black uppercase tracking-wider opacity-70">Install App</p>
                                    <p className="text-xs font-bold">Add to Home Screen</p>
                                </div>
                            </div>
                            <ChevronRight size={15} className="opacity-50" />
                        </motion.button>
                    )}

                    {/* Main nav items */}
                    <div className="space-y-0.5">
                        {mainNavItems.map(item => <NavItem key={item.path} item={item} />)}
                    </div>

                    {/* Admin section */}
                    {isAdmin?.() && (
                        <div className="pt-4 mt-3 border-t border-emerald-100/30">
                            <p className="px-4 mb-2 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                Admin Controls
                            </p>
                            <div className="space-y-0.5">
                                {adminNavItems.map(item => <NavItem key={item.path} item={item} />)}
                            </div>
                        </div>
                    )}

                    {/* Logout */}
                    {isAuthenticated && user && (
                        <motion.button
                            onClick={handleLogout}
                            className="group w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all duration-200 mt-4"
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <div className="flex items-center gap-3">
                                <LogOut size={19} />
                                <span>Logout</span>
                            </div>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                    )}
                </nav>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-emerald-100/30">
                    {user && (
                        <div className="flex items-center gap-2.5 mb-2.5 p-2.5 rounded-xl bg-gradient-to-r from-emerald-50/60 to-blue-50/40">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                                {user.firstName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black text-blue-900 truncate">{user.firstName} {user.lastName}</p>
                                <p className="text-[9px] font-bold text-emerald-600 capitalize">{user.role?.replace('_', ' ')}</p>
                            </div>
                        </div>
                    )}
                    <p className="text-[9px] text-center font-medium text-blue-900/40">© 2026 Engineer Hub</p>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
