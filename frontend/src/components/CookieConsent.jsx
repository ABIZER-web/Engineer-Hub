// frontend/src/components/CookieConsent.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Shield, X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useCookieConsent } from '../contexts/CookieConsentContext';

const Toggle = ({ checked, onChange, label }) => (
    <label className="flex items-center justify-between cursor-pointer group">
        <span className="text-xs font-bold text-blue-900/70 group-hover:text-blue-900 transition-colors">{label}</span>
        <div className="relative ml-3">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`w-10 h-5 rounded-full transition-all duration-200 ${checked ? 'bg-gradient-to-r from-emerald-500 to-blue-600' : 'bg-gray-200'}`} />
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
        </div>
    </label>
);

const CookieConsent = () => {
    const { showBanner, acceptAll, acceptNecessary, acceptCustom } = useCookieConsent();
    const [showDetails, setShowDetails] = useState(false);
    const [preferences, setPreferences] = useState({ analytics: false, marketing: false, preferences: false });

    if (!showBanner) return null;

    return (
        <AnimatePresence>
            {showBanner && (
                <motion.div
                    initial={{ y: 120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 120, opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    className="fixed bottom-4 left-4 right-4 z-[9999] max-w-2xl mx-auto"
                >
                    <div className="bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-emerald-100/40 overflow-hidden">
                        {/* Top gradient bar */}
                        <div className="h-1 bg-gradient-to-r from-emerald-500 to-blue-600" />

                        <div className="p-5">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-9 h-9 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Cookie className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-black text-emerald-600 uppercase tracking-wide mb-0.5">Cookie Preferences</h3>
                                    <p className="text-xs font-medium text-blue-900/70 leading-relaxed">
                                        We use cookies to enhance your experience. Essential cookies are always on.{' '}
                                        <a href="/cookie-policy" className="text-emerald-600 underline hover:text-emerald-700 inline-flex items-center gap-0.5">
                                            Cookie Policy <ExternalLink className="w-3 h-3" />
                                        </a>
                                        {' '}·{' '}
                                        <a href="/privacy-policy" className="text-emerald-600 underline hover:text-emerald-700 inline-flex items-center gap-0.5">
                                            Privacy Policy <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </p>
                                </div>
                            </div>

                            {/* Expand/collapse details */}
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="flex items-center gap-1 text-xs font-bold text-blue-900/50 hover:text-emerald-600 transition-colors mb-3"
                            >
                                {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                {showDetails ? 'Hide' : 'Customize'} preferences
                            </button>

                            <AnimatePresence>
                                {showDetails && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden mb-4"
                                    >
                                        <div className="bg-gradient-to-br from-emerald-50/60 to-blue-50/40 rounded-xl p-3 space-y-2.5 border border-emerald-100/30">
                                            <Toggle checked={true} onChange={() => {}} label="Necessary (always on)" />
                                            <Toggle checked={preferences.analytics} onChange={(v) => setPreferences(p => ({ ...p, analytics: v }))} label="Analytics" />
                                            <Toggle checked={preferences.marketing} onChange={(v) => setPreferences(p => ({ ...p, marketing: v }))} label="Marketing" />
                                            <Toggle checked={preferences.preferences} onChange={(v) => setPreferences(p => ({ ...p, preferences: v }))} label="Preferences" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={acceptAll}
                                    className="flex-1 min-w-[120px] bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
                                >
                                    Accept All
                                </button>
                                {showDetails ? (
                                    <button
                                        onClick={() => acceptCustom(preferences)}
                                        className="flex-1 min-w-[120px] bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-xl hover:bg-emerald-100 transition-all"
                                    >
                                        Save Choices
                                    </button>
                                ) : (
                                    <button
                                        onClick={acceptNecessary}
                                        className="flex-1 min-w-[120px] bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-xl hover:bg-gray-200 transition-all"
                                    >
                                        Necessary Only
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieConsent;
