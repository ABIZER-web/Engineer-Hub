// frontend/src/components/NewsTicker.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getAllAnnouncements } from '../services/api';
import { Megaphone, X, AlertTriangle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const priorityOrder = { urgent: 0, high: 1, normal: 2 };

const getPriorityStyle = (priority) => {
    switch (priority) {
        case 'urgent':
            return { bg: 'bg-red-500', icon: AlertTriangle, badgeText: 'URGENT', textColor: 'text-red-400' };
        case 'high':
            return { bg: 'bg-amber-500', icon: AlertCircle, badgeText: 'HIGH', textColor: 'text-amber-400' };
        default:
            return { bg: 'bg-emerald-500', icon: Megaphone, badgeText: 'NOTICE', textColor: 'text-emerald-400' };
    }
};

const NewsTicker = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [loading, setLoading] = useState(true);
    const scrollContainerRef = useRef(null);
    const scrollContentRef = useRef(null);
    const animationRef = useRef(null);
    const intervalRef = useRef(null);
    const isMounted = useRef(true);

    const fetchAnnouncements = async () => {
        try {
            const response = await getAllAnnouncements();
            if (!isMounted.current) return;
            const items = (response.announcements || [])
                .filter(item => item.active === true && item.text?.trim())
                .sort((a, b) => {
                    const diff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
                    return diff !== 0 ? diff : new Date(b.createdAt) - new Date(a.createdAt);
                });
            setAnnouncements(items);
            setCurrentIndex(0);
        } catch {
            if (isMounted.current) setAnnouncements([]);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        fetchAnnouncements();
        intervalRef.current = setInterval(() => {
            if (isMounted.current) fetchAnnouncements();
        }, 30000);
        return () => {
            isMounted.current = false;
            clearInterval(intervalRef.current);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    // Continuous horizontal scroll animation
    useEffect(() => {
        if (!scrollContentRef.current || announcements.length === 0) return;
        const content = scrollContentRef.current;
        let startTime = null;
        const speed = 55; // px/sec

        const animate = (timestamp) => {
            if (!isMounted.current) return;
            if (!startTime) startTime = timestamp;
            const elapsed = (timestamp - startTime) / 1000;
            const contentWidth = content.scrollWidth / 2; // duplicated content
            const pos = (elapsed * speed) % contentWidth;
            content.style.transform = `translateX(-${pos}px)`;
            animationRef.current = requestAnimationFrame(animate);
        };
        const tid = setTimeout(() => {
            animationRef.current = requestAnimationFrame(animate);
        }, 80);
        return () => {
            clearTimeout(tid);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [announcements, currentIndex]);

    // Auto-rotate every 5s
    useEffect(() => {
        if (announcements.length <= 1) return;
        const id = setInterval(() => {
            if (isMounted.current) setCurrentIndex(p => (p + 1) % announcements.length);
        }, 5000);
        return () => clearInterval(id);
    }, [announcements.length]);

    if (loading || !isVisible || announcements.length === 0) return null;

    const current = announcements[currentIndex];
    const style = getPriorityStyle(current?.priority || 'normal');
    const Icon = style.icon;
    const messageText = current?.text || '';

    // Duplicate text for seamless loop
    const copies = Array.from({ length: Math.max(6, Math.ceil(800 / (messageText.length || 50))) }).map((_, i) => (
        <span key={i} className="inline-block mr-10 text-white/85 text-[11px] md:text-sm font-medium whitespace-nowrap">
            {messageText}
            <span className="mx-4 text-white/30">◆</span>
        </span>
    ));

    return (
        <motion.div
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-[#0a0f1e] via-[#0f1a2e] to-[#0a0f1e] text-white py-2 md:py-2.5 px-2 md:px-4 flex items-center gap-2 overflow-hidden border-b border-white/10 z-40 shadow-lg select-none"
        >
            {/* Left nav */}
            <button
                onClick={() => setCurrentIndex(p => (p - 1 + announcements.length) % announcements.length)}
                className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/10 transition-all active:scale-90"
            >
                <ChevronLeft size={16} className="text-white/70" />
            </button>

            {/* Priority badge */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className={`w-7 h-7 ${style.bg} rounded-lg flex items-center justify-center shadow-lg`}>
                    <Icon size={14} className="text-white" />
                </div>
                <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest text-white/60">
                    {style.badgeText}
                </span>
                <span className="text-white/20 text-xs">|</span>
            </div>

            {/* Scrolling text */}
            <div ref={scrollContainerRef} className="flex-1 overflow-hidden relative h-6">
                <div
                    ref={scrollContentRef}
                    className="absolute inset-0 flex items-center"
                    style={{ willChange: 'transform', whiteSpace: 'nowrap' }}
                >
                    {copies}
                    {copies}
                </div>
            </div>

            {/* Count badge */}
            {announcements.length > 1 && (
                <div className="flex-shrink-0 px-2 py-0.5 bg-white/10 rounded-full text-[9px] font-black text-white/80">
                    {currentIndex + 1}/{announcements.length}
                </div>
            )}

            {/* Right nav */}
            <button
                onClick={() => setCurrentIndex(p => (p + 1) % announcements.length)}
                className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/10 transition-all active:scale-90"
            >
                <ChevronRight size={16} className="text-white/70" />
            </button>

            {/* Close */}
            <button onClick={() => setIsVisible(false)} className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-full transition-colors">
                <X size={13} className="text-white/40 hover:text-white transition-colors" />
            </button>
        </motion.div>
    );
};

export default NewsTicker;
