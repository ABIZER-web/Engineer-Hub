// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldOff, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Gorgeous 403 Forbidden glassmorphism block
const ForbiddenBlock = ({ requiredRoles }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 p-4"
    >
        {/* Ambient background dots */}
        {[...Array(12)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                    width: Math.random() * 8 + 4,
                    height: Math.random() * 8 + 4,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    background: i % 2 === 0 ? '#059669' : '#1e3a8a',
                    opacity: 0.12,
                }}
                animate={{ y: [0, -18, 0], opacity: [0.08, 0.2, 0.08] }}
                transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
            />
        ))}

        <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative bg-white/95 backdrop-blur-sm border border-emerald-100/30 rounded-3xl shadow-2xl p-10 max-w-md w-full text-center overflow-hidden"
        >
            {/* Gradient top accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-t-3xl" />

            {/* Icon */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                className="w-20 h-20 bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6"
            >
                <ShieldOff className="w-10 h-10 text-red-500" />
            </motion.div>

            {/* 403 badge */}
            <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                <span>403 Access Forbidden</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight mb-2" style={{ color: '#059669' }}>
                Restricted Zone
            </h1>
            <p className="text-sm font-medium leading-relaxed mb-6" style={{ color: '#1e3a8a', opacity: 0.7 }}>
                You don't have the required permissions to view this page.
                {requiredRoles?.length > 0 && (
                    <span className="block mt-1 font-black">
                        Required: {requiredRoles.join(', ')}
                    </span>
                )}
            </p>

            <div className="flex gap-3 justify-center">
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                </button>
                <a
                    href="/dashboard"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-black text-sm uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
                >
                    <Home className="w-4 h-4" />
                    Dashboard
                </a>
            </div>
        </motion.div>
    </motion.div>
);

// Loading spinner
const AuthLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-600 border-r-blue-600 animate-spin" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
                Verifying access...
            </p>
        </div>
    </div>
);

/**
 * ProtectedRoute
 * Props:
 *   children         - content to render
 *   allowedRoles     - array of roles that are allowed. If empty/undefined, any authenticated user is allowed
 *   adminOnly        - shorthand for ['admin', 'super_admin']
 */
const ProtectedRoute = ({ children, allowedRoles, adminOnly = false }) => {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    if (loading) return <AuthLoader />;

    if (!isAuthenticated) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // Determine roles required
    const rolesRequired = adminOnly
        ? ['admin', 'super_admin']
        : (allowedRoles && allowedRoles.length > 0 ? allowedRoles : null);

    if (rolesRequired && !rolesRequired.includes(user?.role)) {
        return <ForbiddenBlock requiredRoles={rolesRequired} />;
    }

    return children;
};

export default ProtectedRoute;
