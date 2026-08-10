// frontend/src/components/ThemeToggle.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className={`relative w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 border border-emerald-100/40 flex items-center justify-center transition-colors overflow-hidden flex-shrink-0 ${className}`}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.span
                    key={isDark ? 'moon' : 'sun'}
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center"
                >
                    {isDark ? <Moon size={16} className="text-blue-900/70" /> : <Sun size={16} className="text-amber-500" />}
                </motion.span>
            </AnimatePresence>
        </button>
    );
};

export default ThemeToggle;
