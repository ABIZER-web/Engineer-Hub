// frontend/src/components/GlobalSearch.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, ShoppingBag, BookOpen, Briefcase, GraduationCap, Loader2 } from 'lucide-react';
import { globalSearch } from '../services/api';

const CATEGORY_META = {
    marketplace: { label: 'Marketplace', icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50' },
    resources:   { label: 'Resources',   icon: BookOpen,    color: 'text-blue-600 bg-blue-50' },
    freelance:   { label: 'Freelance',   icon: Briefcase,   color: 'text-indigo-600 bg-indigo-50' },
    placements:  { label: 'Placements',  icon: GraduationCap, color: 'text-amber-600 bg-amber-50' },
};

const DEBOUNCE_MS = 350;

const GlobalSearch = ({ className = '' }) => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const boxRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50);
        else { setQuery(''); setResults(null); }
    }, [open]);

    useEffect(() => {
        const onClickOutside = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    const runSearch = useCallback((q) => {
        clearTimeout(debounceRef.current);
        if (q.trim().length < 2) { setResults(null); return; }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await globalSearch(q.trim());
                setResults(res.results);
            } catch { setResults(null); }
            finally { setLoading(false); }
        }, DEBOUNCE_MS);
    }, []);

    const onChange = (e) => {
        const v = e.target.value;
        setQuery(v);
        runSearch(v);
    };

    const goTo = (link) => { setOpen(false); navigate(link); };

    const hasResults = results && Object.values(results).some(arr => arr.length > 0);

    return (
        <div ref={boxRef} className={`relative flex-shrink-0 ${className}`}>
            <button
                onClick={() => setOpen(v => !v)}
                aria-label="Search"
                className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 border border-emerald-100/40 flex items-center justify-center transition-colors"
            >
                <Search size={16} className="text-blue-900/70" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-[360px] max-w-[88vw] bg-white rounded-2xl shadow-2xl border border-emerald-100/50 overflow-hidden z-50"
                    >
                        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-emerald-50">
                            <Search size={14} className="text-blue-900/30 flex-shrink-0" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={onChange}
                                placeholder="Search marketplace, resources, freelance, placements..."
                                className="flex-1 text-xs font-medium outline-none bg-transparent placeholder:text-blue-900/30"
                            />
                            {loading && <Loader2 size={13} className="animate-spin text-emerald-500 flex-shrink-0" />}
                            <button onClick={() => setOpen(false)} className="p-0.5 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0"><X size={14} /></button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {query.trim().length > 0 && query.trim().length < 2 && (
                                <p className="text-[11px] text-blue-900/30 font-medium text-center py-6">Keep typing…</p>
                            )}
                            {query.trim().length >= 2 && !loading && !hasResults && (
                                <p className="text-[11px] text-blue-900/30 font-medium text-center py-8">No results for "{query}"</p>
                            )}
                            {results && Object.entries(results).map(([key, items]) => {
                                if (!items.length) return null;
                                const meta = CATEGORY_META[key];
                                const Icon = meta.icon;
                                return (
                                    <div key={key} className="px-2 py-2">
                                        <div className="flex items-center gap-1.5 px-2 py-1">
                                            <span className={`flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${meta.color}`}>
                                                <Icon size={9} />{meta.label}
                                            </span>
                                        </div>
                                        {items.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => goTo(item.link)}
                                                className="w-full text-left px-2 py-2 rounded-xl hover:bg-emerald-50/50 transition-colors"
                                            >
                                                <p className="text-xs font-bold text-blue-900 truncate">{item.title}</p>
                                                <p className="text-[10px] text-blue-900/40 font-medium truncate">{item.subtitle}</p>
                                            </button>
                                        ))}
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

export default GlobalSearch;
