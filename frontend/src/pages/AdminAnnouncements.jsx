// frontend/src/pages/AdminAnnouncements.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getAdminAnnouncements, createAnnouncement, deleteAnnouncement, toggleAnnouncement } from '../services/api';
import Sidebar from '../components/Sidebar';
import NewsTicker from '../components/NewsTicker';
import { Menu, Megaphone, Plus, Trash2, Loader2, Eye, EyeOff, AlertTriangle, CheckCircle, X, RefreshCw } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';
import GlobalSearch from '../components/GlobalSearch';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';

const AdminAnnouncements = () => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('normal');
  const [creating, setCreating] = useState(false);
  const isMounted = useRef(true);

  const fetch = async () => {
    try { const r = await getAdminAnnouncements(); if (isMounted.current) setAnnouncements(r.announcements || []); }
    catch { } finally { if (isMounted.current) setLoading(false); }
  };

  useEffect(() => { isMounted.current = true; fetch(); return () => { isMounted.current = false; }; }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!text.trim()) return toast.error('Enter announcement text');
    setCreating(true);
    try {
      const r = await createAnnouncement({ text, priority });
      if (r.success) { setAnnouncements(p => [r.announcement, ...p]); setText(''); toast.success('Announcement created!'); }
    } catch (e) { toast.error(e.message); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteAnnouncement(id); setAnnouncements(p => p.filter(a => a._id !== id)); toast.success('Deleted'); }
    catch (e) { toast.error(e.message); }
  };

  const handleToggle = async (id) => {
    try {
      const r = await toggleAnnouncement(id);
      if (r.success) setAnnouncements(p => p.map(a => a._id === id ? r.announcement : a));
    } catch (e) { toast.error(e.message); }
  };

  const priorityColor = { urgent: 'text-red-600 bg-red-50 border-red-200', high: 'text-amber-600 bg-amber-50 border-amber-200', normal: 'text-emerald-600 bg-emerald-50 border-emerald-200' };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col">
        <NewsTicker />
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20} /></button>
            <div><h1 className="text-base font-black text-emerald-600">Announcements</h1></div>
          </div>
          <div className="flex items-center gap-2">
          <button onClick={fetch} className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><RefreshCw size={16} /></button>
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>
        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 px-4 md:px-6 py-6 max-w-3xl mx-auto w-full">
          {/* Create form */}
          <form onSubmit={handleCreate} className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm mb-5">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wide mb-3">New Announcement</h3>
            <div className="flex gap-2 mb-3">
              {['normal', 'high', 'urgent'].map(p => (
                <button key={p} type="button" onClick={() => setPriority(p)}
                  className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all capitalize ${priority === p ? priorityColor[p] : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                  {p}
                </button>
              ))}
            </div>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={2} required placeholder="Enter announcement text..."
              className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-400 transition-all resize-none mb-3" />
            <button type="submit" disabled={creating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] disabled:opacity-50 transition-all shadow-sm">
              {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}Post Announcement
            </button>
          </form>

          {/* List */}
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white/80 rounded-2xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {announcements.map((a, i) => (
                <motion.div key={a._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .04 }}
                  className={`flex items-start gap-3 p-4 rounded-2xl border ${a.active ? 'bg-white/95 border-emerald-100/30' : 'bg-gray-50/80 border-gray-200/60 opacity-60'} shadow-sm`}>
                  <div className={`flex-shrink-0 text-[9px] font-black uppercase px-2 py-1 rounded-full border mt-0.5 capitalize ${priorityColor[a.priority] || priorityColor.normal}`}>{a.priority}</div>
                  <p className="flex-1 text-xs font-medium text-blue-900/80 leading-relaxed">{a.text}</p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[9px] text-blue-900/30">{formatDate(a.createdAt, 'MMM d')}</span>
                    <button onClick={() => handleToggle(a._id)} className={`p-1.5 rounded-lg transition-all ${a.active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`} title={a.active ? 'Hide' : 'Show'}>
                      {a.active ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button onClick={() => handleDelete(a._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"><Trash2 size={13} /></button>
                  </div>
                </motion.div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center py-10 bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm">
                  <Megaphone size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-xs font-medium text-blue-900/40">No announcements yet</p>
                </div>
              )}
            </div>
          )}
        </motion.main>
      </div>
    </div>
  );
};

export default AdminAnnouncements;
