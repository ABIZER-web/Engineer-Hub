// frontend/src/pages/AdminReports.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import NewsTicker from '../components/NewsTicker';
import { getReports, resolveReport, bulkResolveReports } from '../services/api';
import {
  Menu, Flag, RefreshCw, ShoppingBag, BookOpen, Briefcase,
  CheckCircle2, Ban, X, Loader2, User as UserIcon
} from 'lucide-react';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';
import GlobalSearch from '../components/GlobalSearch';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';

const TYPE_META = {
  marketplace: { label: 'Marketplace listing', icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50' },
  resource:    { label: 'Study resource',      icon: BookOpen,    color: 'text-blue-600 bg-blue-50' },
  freelance:   { label: 'Freelance project',   icon: Briefcase,   color: 'text-indigo-600 bg-indigo-50' },
};

const REASON_LABELS = {
  spam: 'Spam', scam_fraud: 'Scam / fraud', inappropriate: 'Inappropriate content',
  misleading: 'Misleading / false info', copyright: 'Copyright issue', other: 'Other',
};

const ResolveModal = ({ report, action, onClose, onResolve }) => {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const isAction = action === 'action';

  const handleSave = async () => {
    setSaving(true);
    try { await onResolve(report._id, { action, note }); onClose(); }
    catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: .92, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .92 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-black text-blue-900">{isAction ? 'Take down this listing?' : 'Dismiss this report?'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <p className="text-xs text-blue-900/50 font-medium mb-4">{report.targetTitle}</p>
        {isAction && (
          <p className="text-[10px] text-red-500 font-bold mb-3 flex items-center gap-1">
            <Ban size={11} /> This deactivates the listing immediately and notifies the owner.
          </p>
        )}
        <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 500))}
          placeholder={isAction ? 'Reason shown to the listing owner...' : 'Optional internal note...'}
          rows={3}
          className="w-full px-3 py-2 text-xs font-medium border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-300 transition-all resize-none" />
        <button onClick={handleSave} disabled={saving}
          className={`w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-black uppercase disabled:opacity-50 transition-colors ${isAction ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : (isAction ? <Ban size={14} /> : <CheckCircle2 size={14} />)}
          {isAction ? 'Take down listing' : 'Dismiss report'}
        </button>
      </motion.div>
    </motion.div>
  );
};

const AdminReports = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { report, action }
  const [selected, setSelected] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const isMounted = useRef(true);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelected(prev => prev.size === reports.length ? new Set() : new Set(reports.map(r => r._id)));
  };

  const fetchAll = async () => {
    setLoading(true);
    try { const res = await getReports(statusFilter); if (isMounted.current) { setReports(res.reports || []); setSelected(new Set()); } }
    catch (e) { toast.error(e.message); }
    finally { if (isMounted.current) setLoading(false); }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchAll();
    return () => { isMounted.current = false; };
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResolve = async (id, data) => {
    await resolveReport(id, data);
    toast.success(data.action === 'action' ? 'Listing removed' : 'Report dismissed');
    setReports(prev => prev.filter(r => r._id !== id));
  };

  const handleBulk = async (action) => {
    if (!selected.size) return;
    let note = '';
    if (action === 'action') note = window.prompt(`Reason for removing ${selected.size} listing(s)? (shown to owners, optional)`) || '';
    setBulkBusy(true);
    try {
      const ids = [...selected];
      await bulkResolveReports(ids, action, note);
      setReports(prev => prev.filter(r => !selected.has(r._id)));
      setSelected(new Set());
      toast.success(action === 'action' ? `${ids.length} listing(s) removed` : `${ids.length} report(s) dismissed`);
    } catch (e) { toast.error(e.message); }
    finally { setBulkBusy(false); }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col">
        <NewsTicker />
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20} /></button>
            <div>
              <h1 className="text-base font-black text-emerald-600 flex items-center gap-1.5"><Flag size={16} />Reported Listings</h1>
              <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Review flagged marketplace, resource & freelance listings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><RefreshCw size={16} /></button>
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>

        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
          className="flex-1 px-4 md:px-6 py-6 max-w-4xl mx-auto w-full">

          <div className="flex gap-2 mb-5 bg-white/80 border border-emerald-100/30 rounded-xl p-1 w-fit">
            {['pending', 'actioned', 'dismissed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all capitalize ${statusFilter === s ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-sm' : 'text-blue-900/40 hover:text-blue-900/70'}`}>
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white/80 rounded-2xl animate-pulse" />)}</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm">
              <Flag size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-blue-900/40">No {statusFilter} reports</p>
            </div>
          ) : (
            <div className="space-y-3">
              {statusFilter === 'pending' && (
                <div className="flex items-center justify-between bg-white/80 border border-emerald-100/30 rounded-xl px-4 py-2.5">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-blue-900/50 cursor-pointer">
                    <input type="checkbox" checked={selected.size > 0 && selected.size === reports.length} onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded accent-emerald-600" />
                    {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
                  </label>
                  {selected.size > 0 && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleBulk('action')} disabled={bulkBusy}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-red-500 px-3 py-1.5 rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors">
                        {bulkBusy ? <Loader2 size={11} className="animate-spin" /> : <Ban size={11} />}Take Down Selected
                      </button>
                      <button onClick={() => handleBulk('dismiss')} disabled={bulkBusy}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-900/60 bg-gray-100 px-3 py-1.5 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors">
                        {bulkBusy ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}Dismiss Selected
                      </button>
                    </div>
                  )}
                </div>
              )}
              {reports.map(r => {
                const meta = TYPE_META[r.targetType] || TYPE_META.marketplace;
                const Icon = meta.icon;
                return (
                  <motion.div key={r._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm flex items-start gap-3">
                    {statusFilter === 'pending' && (
                      <input type="checkbox" checked={selected.has(r._id)} onChange={() => toggleSelect(r._id)}
                        className="w-4 h-4 mt-1 rounded accent-emerald-600 flex-shrink-0 cursor-pointer" />
                    )}
                    <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${meta.color}`}>
                            <Icon size={10} />{meta.label}
                          </span>
                          <span className="text-[9px] font-black uppercase bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{REASON_LABELS[r.reason] || r.reason}</span>
                        </div>
                        <h3 className="text-sm font-black text-blue-900 truncate mb-1">{r.targetTitle}</h3>
                        {r.note && <p className="text-xs text-blue-900/50 font-medium mb-1.5">"{r.note}"</p>}
                        <div className="flex items-center gap-1.5 text-[10px] text-blue-900/40 font-medium">
                          <UserIcon size={10} /> Reported by {r.reporterName || 'a user'} · {formatDate(r.createdAt, 'MMM d, yyyy')}
                        </div>
                        {r.status !== 'pending' && r.resolutionNote && (
                          <p className="text-[10px] text-blue-900/40 font-medium mt-1.5 italic">Resolution note: {r.resolutionNote}</p>
                        )}
                      </div>
                    </div>

                    {r.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setModal({ report: r, action: 'action' })}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-red-500 px-3 py-2 rounded-xl hover:bg-red-600 transition-colors">
                          <Ban size={12} />Take down
                        </button>
                        <button onClick={() => setModal({ report: r, action: 'dismiss' })}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-900/60 bg-gray-100 px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors">
                          <CheckCircle2 size={12} />Dismiss
                        </button>
                      </div>
                    )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.main>
      </div>

      <AnimatePresence>
        {modal && (
          <ResolveModal report={modal.report} action={modal.action} onClose={() => setModal(null)} onResolve={handleResolve} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminReports;
