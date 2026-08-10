// frontend/src/components/Logo.jsx
import React from 'react';
import { motion } from 'framer-motion';

const Logo = ({ size = 'md', showText = true, className = '' }) => {
    const sizeMap = {
        sm: { icon: 28, text: 'text-lg', sub: 'text-[8px]' },
        md: { icon: 36, text: 'text-xl', sub: 'text-[9px]' },
        lg: { icon: 48, text: 'text-3xl', sub: 'text-[11px]' },
        xl: { icon: 64, text: 'text-4xl', sub: 'text-xs' },
    };
    const s = sizeMap[size] || sizeMap.md;

    return (
        <motion.div
            className={`flex items-center gap-2.5 select-none ${className}`}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400 }}
        >
            {/* Icon mark */}
            <div
                className="relative flex items-center justify-center flex-shrink-0"
                style={{ width: s.icon, height: s.icon }}
            >
                <img
                    src="/logo.png"
                    alt="Engineer Hub"
                    width={s.icon}
                    height={s.icon}
                    className="w-full h-full object-contain drop-shadow-sm"
                    draggable={false}
                />
            </div>

            {/* Text block */}
            {showText && (
                <div className="flex flex-col leading-none">
                    <span className={`${s.text} font-black tracking-tight bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent`}>
                        Engineer
                        <span className="text-blue-900"> Hub</span>
                    </span>
                    <span className={`${s.sub} font-black uppercase tracking-[0.15em] text-blue-900/50 mt-0.5`}>
                        Mumbai University
                    </span>
                </div>
            )}
        </motion.div>
    );
};

export default Logo;
