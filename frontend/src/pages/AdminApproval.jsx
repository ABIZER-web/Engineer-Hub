// frontend/src/pages/AdminApproval.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getPendingItems, getPendingResources, getPendingResults, getPendingProjects, approveItem, approveResource, rejectResource, approveResult, approveProject, rejectProjectListing, deleteItem, deleteResult, bulkModerateItems, bulkModerateResources, bulkModerateProjects } from '../services/api';
import Sidebar from '../components/Sidebar';
import NewsTicker from '../components/NewsTicker';
import { Menu, Check, X, Loader2, ShoppingBag, BookOpen, FileText, Briefcase, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';
import GlobalSearch from '../components/GlobalSearch';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';

const tabs = [
  { id: 'projects', label: 'Projects', icon: ShoppingBag },
  { id: 'resources', label: 'Resources', icon: BookOpen },
  { id: 'results', label: 'Results', icon: FileText },
  { id: 'freelance', label: 'Freelance', icon: Briefcase },
];

const AdminApproval = () => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
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
    setSelected(prev => prev.size === data.length ? new Set() : new Set(data.map(d => d._id)));
  };
  const clearSelection = () => setSelected(new Set());

  const bulkSupported = ['projects', 'resources', 'freelance'].includes(activeTab);

  const handleBulk = async (action) => {
    if (!selected.size) return;
    let note = '';
    if (action !== 'approved') {
      note = window.prompt(`Reason for rejecting ${selected.size} item(s)? (shown to students, optional)`) || '';
    }
    setBulkBusy(true);
    try {
      const ids = [...selected];
      if (activeTab === 'projects')  await bulkModerateItems(ids, action);
      if (activeTab === 'resources') await bulkModerateResources(ids, action, note);
      if (activeTab === 'freelance') await bulkModerateProjects(ids, action, note);
      setData(prev => prev.filter(d => !selected.has(d._id)));
      clearSelection();
      toast.success(`${ids.length} item(s) ${action}`);
    } catch (e) { toast.error(e.message); }
    finally { setBulkBusy(false); }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'projects')  res = await getPendingItems();
      if (activeTab === 'resources') res = await getPendingResources();
      if (activeTab === 'results')   res = await getPendingResults();
      if (activeTab === 'freelance') res = await getPendingProjects();
      if (isMounted.current) setData(res?.items || res?.resources || res?.results || res?.projects || []);
    } catch { }
    finally { if (isMounted.current) setLoading(false); }
  }, [activeTab]);

  useEffect(() => { isMounted.current = true; fetchData(); setSelected(new Set()); return () => { isMounted.current = false; }; }, [fetchData]);

  const handleApprove = async (id) => {
    setActionId(id + 'approve');
    try {
      if (activeTab === 'projects')  await approveItem(id, { status: 'approved' });
      if (activeTab === 'resources') await approveResource(id);
      if (activeTab === 'results')   await approveResult(id);
      if (activeTab === 'freelance') await approveProject(id);
      setData(p => p.filter(i => i._id !== id));
      toast.success('Approved ✓');
    } catch (e) { toast.error(e.message); }
    finally { setActionId(null); }
  };

  const handleReject = async (id) => {
    let note;
    if (activeTab === 'resources' || activeTab === 'freelance') {
      note = window.prompt('Reason for rejecting this? (shown to the student, optional)') || '';
    }
    setActionId(id + 'reject');
    try {
      if (activeTab === 'projects')  await deleteItem(id);
      if (activeTab === 'resources') await rejectResource(id, note);
      if (activeTab === 'results')   await deleteResult(id);
      if (activeTab === 'freelance') await rejectProjectListing(id, note);
      setData(p => p.filter(i => i._id !== id));
      toast.success('Rejected');
    } catch (e) { toast.error(e.message); }
    finally { setActionId(null); }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col relative z-10">
        <NewsTicker />
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20} /></button>
            <div>
              <h1 className="text-base font-black text-emerald-600">Approval Hub</h1>
              <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Review & approve submitted content</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><RefreshCw size={16} /></button>
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>
        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
          className="flex-1 px-4 md:px-6 py-6 max-w-4xl mx-auto w-full">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-white/80 border border-emerald-100/30 rounded-xl p-1 w-fit">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === t.id ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-sm' : 'text-blue-900/50 hover:text-blue-900 hover:bg-emerald-50/60'}`}>
                <t.icon size={13} />{t.label}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/80 rounded-2xl animate-pulse" />)}</div>
          ) : data.length === 0 ? (
            <div className="text-center py-16 bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm">
              <AlertCircle size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-emerald-600">All caught up! ✓</p>
              <p className="text-xs text-blue-900/40 mt-1">No pending {activeTab} to review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bulkSupported && (
                <div className="flex items-center justify-between bg-white/80 border border-emerald-100/30 rounded-xl px-4 py-2.5">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-blue-900/50 cursor-pointer">
                    <input type="checkbox" checked={selected.size > 0 && selected.size === data.length} onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded accent-emerald-600" />
                    {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
                  </label>
                  {selected.size > 0 && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleBulk('approved')} disabled={bulkBusy}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-[9px] font-black uppercase hover:bg-emerald-600 disabled:opacity-50 transition-all">
                        {bulkBusy ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}Approve Selected
                      </button>
                      <button onClick={() => handleBulk('rejected')} disabled={bulkBusy}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-100 text-red-600 text-[9px] font-black uppercase hover:bg-red-200 disabled:opacity-50 transition-all">
                        {bulkBusy ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}Reject Selected
                      </button>
                    </div>
                  )}
                </div>
              )}
              {data.map((item, i) => (
                <motion.div key={item._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .04 }}
                  className="bg-white/95 border border-emerald-100/30 rounded-2xl p-4 shadow-sm flex items-start gap-3">
                  {bulkSupported && (
                    <input type="checkbox" checked={selected.has(item._id)} onChange={() => toggleSelect(item._id)}
                      className="w-4 h-4 mt-1 rounded accent-emerald-600 flex-shrink-0 cursor-pointer" />
                  )}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                    {(item.title || item.subjectName || `S${item.semester}`)?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-blue-900 truncate">{item.title || `Semester ${item.semester} Result` || 'Resource'}</p>
                    <div className="flex flex-wrap gap-2 text-[9px] text-blue-900/40 font-medium mt-0.5">
                      {item.price !== undefined && <span className="text-emerald-600 font-black">{formatCurrency(item.price)}</span>}
                      {item.budget !== undefined && <span className="text-emerald-600 font-black">{formatCurrency(item.budget)}{item.budgetType === 'hourly' ? '/hr' : ''}</span>}
                      {item.sellerEmail && <span>{item.sellerEmail}</span>}
                      {item.clientEmail && <span>{item.clientEmail}</span>}
                      {item.uploadedByName && <span>{item.uploadedByName}</span>}
                      {item.branch && <span>{item.branch}</span>}
                      <span>{formatDate(item.createdAt, 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleApprove(item._id)} disabled={!!actionId}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-[9px] font-black uppercase hover:bg-emerald-600 disabled:opacity-50 transition-all">
                      {actionId === item._id + 'approve' ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}Approve
                    </button>
                    <button onClick={() => handleReject(item._id)} disabled={!!actionId}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-100 text-red-600 text-[9px] font-black uppercase hover:bg-red-200 disabled:opacity-50 transition-all">
                      {actionId === item._id + 'reject' ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.main>
      </div>
    </div>
  );
};

export default AdminApproval;
