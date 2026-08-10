// frontend/src/pages/common/TestimonialPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { getApprovedTestimonials, createTestimonial } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import { Menu, Star, Send, Loader2, CheckCircle, MessageSquare } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';

const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} type="button" onClick={() => onChange(n)}
        className={`transition-transform hover:scale-110 ${n <= value ? 'text-amber-400' : 'text-gray-200'}`}>
        <Star size={20} fill={n <= value ? 'currentColor' : 'none'} />
      </button>
    ))}
  </div>
);

const TestimonialPage = () => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 5, text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetch = async () => {
      try { const r = await getApprovedTestimonials(); if (isMounted.current) setTestimonials(r.testimonials || []); }
      catch { } finally { if (isMounted.current) setLoading(false); }
    };
    fetch();
    return () => { isMounted.current = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.text.trim()) return toast.error('Please write your review');
    setSubmitting(true);
    try {
      const r = await createTestimonial(form);
      if (r.success) { toast.success('Thank you! Your review is pending approval.'); setSubmitted(true); setForm({ rating: 5, text: '' }); }
    } catch (e) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col relative z-10">
        <NewsTicker />
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center gap-3 shadow-sm">
          <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20} /></button>
          <div>
            <h1 className="text-base font-black text-emerald-600">Testimonials</h1>
            <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">What students say about Engineer Hub</p>
          </div>
          <div className="flex items-center gap-2">
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>
        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
          className="flex-1 px-4 md:px-6 py-6 max-w-4xl mx-auto w-full">

          {/* Submit form */}
          {!submitted ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm mb-6">
              <h3 className="text-sm font-black text-emerald-600 uppercase tracking-wide mb-4">Share Your Experience</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/40 mb-2">Your Rating</label>
                  <StarRating value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/40 mb-1">Your Review</label>
                  <textarea value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} rows={3} required
                    placeholder="Share your experience with Engineer Hub..."
                    className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all resize-none" />
                </div>
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] disabled:opacity-50 transition-all shadow-md">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 flex items-center gap-3">
              <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-black text-emerald-700">Review Submitted!</p>
                <p className="text-xs text-emerald-600/70">Awaiting admin approval. Thank you for sharing!</p>
              </div>
            </motion.div>
          )}

          {/* Testimonials grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/80 rounded-2xl animate-pulse" />)}
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-10 bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm">
              <MessageSquare size={36} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-900/40">No testimonials yet. Be the first!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonials.map((t, i) => (
                <motion.div key={t._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .06 }}
                  whileHover={{ y: -3 }}
                  className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                      {t.userName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-black text-blue-900">{t.userName || 'Student'}</p>
                      <p className="text-[9px] text-blue-900/40 font-medium capitalize">{t.userRole?.replace('_', ' ')}{t.branch ? ` · ${t.branch}` : ''}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {[...Array(5)].map((_, si) => (
                        <Star key={si} size={11} className={si < t.rating ? 'text-amber-400' : 'text-gray-200'} fill={si < t.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-blue-900/70 leading-relaxed line-clamp-3">"{t.text}"</p>
                  <p className="text-[9px] text-blue-900/30 font-medium mt-2">{formatDate(t.createdAt, 'MMM d, yyyy')}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.main>
      </div>
    </div>
  );
};

export default TestimonialPage;
