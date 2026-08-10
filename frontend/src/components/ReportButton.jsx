// frontend/src/components/ReportButton.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X, Loader2 } from 'lucide-react';
import { createReport } from '../services/api';
import toast from 'react-hot-toast';

const REASONS = [
    { id: 'spam',         label: 'Spam' },
    { id: 'scam_fraud',   label: 'Scam / fraud' },
    { id: 'inappropriate',label: 'Inappropriate content' },
    { id: 'misleading',   label: 'Misleading / false info' },
    { id: 'copyright',    label: 'Copyright issue' },
    { id: 'other',        label: 'Other' },
];

// Drop this next to any listing card. targetType must be 'marketplace' | 'resource' | 'freelance'.
const ReportButton = ({ targetType, targetId, className = '' }) => {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const submit = async (e) => {
        e.stopPropagation();
        if (!reason) return toast.error('Pick a reason first');
        setSubmitting(true);
        try {
            const res = await createReport({ targetType, targetId, reason, note });
            toast.success(res.message || 'Report submitted');
            setDone(true);
            setTimeout(() => { setOpen(false); setDone(false); setReason(''); setNote(''); }, 900);
        } catch (err) {
            toast.error(err.message || 'Could not submit report');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(true); }}
                aria-label="Report this listing"
                title="Report"
                className={`flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors ${className}`}
            >
                <Flag size={13} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5"
                        >
                            {done ? (
                                <div className="py-6 text-center">
                                    <Flag size={26} className="mx-auto mb-2 text-emerald-500" />
                                    <p className="text-xs font-black text-blue-900">Thanks — our team will review it</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-black text-blue-900 flex items-center gap-1.5">
                                            <Flag size={14} className="text-red-500" /> Report this listing
                                        </h3>
                                        <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-1.5 mb-3">
                                        {REASONS.map(r => (
                                            <button
                                                key={r.id}
                                                onClick={() => setReason(r.id)}
                                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${reason === r.id ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-50 text-blue-900/60 border border-transparent hover:bg-gray-100'}`}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value.slice(0, 500))}
                                        placeholder="Optional — any extra detail for our team"
                                        rows={2}
                                        className="w-full px-3 py-2 text-xs font-medium border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-300 transition-all resize-none"
                                    />

                                    <button
                                        onClick={submit}
                                        disabled={submitting || !reason}
                                        className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white text-xs font-black uppercase hover:bg-red-600 disabled:opacity-40 transition-colors"
                                    >
                                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
                                        Submit report
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ReportButton;
