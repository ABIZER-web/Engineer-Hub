// frontend/src/pages/common/ResourceLibrary.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { getApprovedResources, createResource, incrementDownload } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import {
  Menu, Search, Plus, X, Download, FileText, Book,
  Upload, Loader2, ChevronDown, ChevronUp, Filter,
  BookOpen, Code2, Video, File, Link
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { BRANCHES, SEMESTERS, RESOURCE_TYPES } from '../../utils/constants';
import ReportButton from '../../components/ReportButton';
import toast from 'react-hot-toast';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';

const typeIcon = (t) => {
  const m = { notes: FileText, book: Book, video: Video, code: Code2, slides: File, assignment: BookOpen, paper: FileText };
  const I = m[t] || File;
  return <I size={16} />;
};

const typeColor = (t) => {
  const m = { notes: 'from-emerald-500 to-emerald-600', book: 'from-blue-500 to-indigo-500', video: 'from-red-500 to-pink-500', code: 'from-violet-500 to-purple-500', slides: 'from-amber-500 to-orange-500', assignment: 'from-teal-500 to-cyan-500', paper: 'from-gray-500 to-slate-500' };
  return m[t] || 'from-gray-400 to-gray-500';
};

const UploadModal = ({ onClose, onUpload, loading }) => {
  const [form, setForm] = useState({ title: '', description: '', subject: '', branch: 'CSE', semester: '1', resourceType: 'notes', fileUrl: '', tags: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.fileUrl) return toast.error('Title and file URL required');
    onUpload({ ...form, semester: parseInt(form.semester), tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) });
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: .92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .92 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-5 flex items-center justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-wide">Upload Resource</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {[{ k: 'title', label: 'Title *', ph: 'e.g. Data Structures Notes' }, { k: 'subject', label: 'Subject', ph: 'e.g. DSA' }, { k: 'fileUrl', label: 'File URL (Drive/Cloud Link) *', ph: 'https://drive.google.com/...' }].map(({ k, label, ph }) => (
            <div key={k}>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">{label}</label>
              <input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph} required={k === 'title' || k === 'fileUrl'}
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all" />
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Branch</label>
              <select value={form.branch} onChange={e => set('branch', e.target.value)}
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-2 py-2 focus:outline-none focus:border-emerald-400 transition-all">
                {BRANCHES.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Semester</label>
              <select value={form.semester} onChange={e => set('semester', e.target.value)}
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-2 py-2 focus:outline-none focus:border-emerald-400 transition-all">
                {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Type</label>
              <select value={form.resourceType} onChange={e => set('resourceType', e.target.value)}
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-2 py-2 focus:outline-none focus:border-emerald-400 transition-all">
                {RESOURCE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Tags (comma separated)</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="e.g. arrays, sorting, algorithms"
              className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-wider hover:bg-gray-200 transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] disabled:opacity-50 transition-all shadow-md">
              {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Upload'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const ResourceLibrary = () => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [semFilter, setSemFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [expandedSem, setExpandedSem] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetch = async () => {
      try {
        const res = await getApprovedResources({ page: 1 });
        if (isMounted.current) { setResources(res.resources || []); setHasMore(!!res.hasMore); setPage(1); }
      } catch { }
      finally { if (isMounted.current) setLoading(false); }
    };
    fetch();
    return () => { isMounted.current = false; };
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getApprovedResources({ page: nextPage });
      setResources(prev => [...prev, ...(res.resources || [])]);
      setHasMore(!!res.hasMore);
      setPage(nextPage);
    } catch (e) { toast.error(e.message); }
    finally { setLoadingMore(false); }
  };

  const handleUpload = async (data) => {
    setUploadLoading(true);
    try {
      const res = await createResource(data);
      if (res.success) {
        toast.success('Resource submitted for approval!');
        setShowUpload(false);
      }
    } catch (e) { toast.error(e.message); }
    finally { setUploadLoading(false); }
  };

  const handleDownload = async (resource) => {
    try {
      await incrementDownload(resource._id);
      window.open(resource.fileUrl, '_blank');
    } catch { window.open(resource.fileUrl, '_blank'); }
  };

  const filtered = resources.filter(r => {
    const ms = !search || [r.title, r.subject, r.description, ...(r.tags || [])].join(' ').toLowerCase().includes(search.toLowerCase());
    const mb = branchFilter === 'All' || r.branch === branchFilter;
    const msm = semFilter === 'All' || String(r.semester) === String(semFilter);
    const mt = typeFilter === 'All' || r.resourceType === typeFilter;
    return ms && mb && msm && mt;
  });

  // Group by semester
  const bySemester = {};
  filtered.forEach(r => {
    const key = r.semester ? `Semester ${r.semester}` : 'General';
    if (!bySemester[key]) bySemester[key] = [];
    bySemester[key].push(r);
  });
  const semKeys = Object.keys(bySemester).sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, '')) || 99;
    const nb = parseInt(b.replace(/\D/g, '')) || 99;
    return na - nb;
  });

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col relative z-10">
        <NewsTicker />
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20} /></button>
            <div>
              <h1 className="text-base font-black text-emerald-600">Resource Library</h1>
              <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Notes, books & study materials</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-3 py-2 rounded-xl hover:scale-[1.02] transition-all shadow-sm">
            <Upload size={13} />Upload
          </button>
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>

        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
          className="flex-1 px-4 md:px-6 py-6 max-w-5xl mx-auto w-full">

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-5">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..."
                className="w-full pl-8 pr-3 py-2 text-xs font-medium border border-emerald-100/40 rounded-xl bg-white/80 focus:outline-none focus:border-emerald-300 transition-all" />
            </div>
            {[
              { val: branchFilter, set: setBranchFilter, opts: ['All', ...BRANCHES], label: 'Branch' },
              { val: semFilter, set: setSemFilter, opts: ['All', ...SEMESTERS.map(s => String(s))], label: 'Sem', disp: v => v === 'All' ? 'All Sems' : `Sem ${v}` },
              { val: typeFilter, set: setTypeFilter, opts: ['All', ...RESOURCE_TYPES], label: 'Type' },
            ].map(({ val, set: setVal, opts, label, disp }) => (
              <select key={label} value={val} onChange={e => setVal(e.target.value)}
                className="text-xs font-bold border border-emerald-100/40 rounded-xl px-3 py-2 bg-white/80 focus:outline-none focus:border-emerald-300 transition-all capitalize">
                {opts.map(o => <option key={o} value={o}>{disp ? disp(o) : (o === 'All' ? `All ${label}s` : o)}</option>)}
              </select>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-white/80 rounded-2xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm">
              <BookOpen size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-blue-900/40 mb-2">No resources found</p>
              <button onClick={() => setShowUpload(true)} className="text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2 rounded-xl shadow-md hover:scale-[1.02] transition-all">
                Upload First Resource
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {semKeys.map(semKey => (
                <motion.div key={semKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm overflow-hidden">
                  <button onClick={() => setExpandedSem(expandedSem === semKey ? null : semKey)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-emerald-50/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-black">{semKey.replace('Semester ', 'S')}</div>
                      <span className="text-sm font-black text-blue-900">{semKey}</span>
                      <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">{bySemester[semKey].length} files</span>
                    </div>
                    {expandedSem === semKey ? <ChevronUp size={15} className="text-blue-900/40" /> : <ChevronDown size={15} className="text-blue-900/40" />}
                  </button>
                  <AnimatePresence>
                    {expandedSem === semKey && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-emerald-50">
                        <div className="divide-y divide-emerald-50/80">
                          {bySemester[semKey].map((r, i) => (
                            <motion.div key={r._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .04 }}
                              className="flex items-center gap-3 px-5 py-3 hover:bg-emerald-50/20 transition-colors">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeColor(r.resourceType)} flex items-center justify-center text-white flex-shrink-0`}>
                                {typeIcon(r.resourceType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-blue-900 truncate">{r.title}</p>
                                <div className="flex items-center gap-2 text-[9px] text-blue-900/40 font-medium">
                                  {r.subject && <span>{r.subject}</span>}
                                  <span className="capitalize">{r.resourceType}</span>
                                  <span>{r.downloadCount || 0} downloads</span>
                                  <span>{formatDate(r.createdAt, 'MMM d')}</span>
                                </div>
                              </div>
                              <ReportButton targetType="resource" targetId={r._id} className="flex-shrink-0" />
                              <button onClick={() => handleDownload(r)}
                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-2.5 py-1.5 rounded-lg hover:scale-[1.02] transition-all shadow-sm">
                                <Download size={10} />Get
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
          {hasMore && !loading && (
            <div className="flex justify-center mt-6">
              <button onClick={loadMore} disabled={loadingMore}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 bg-white border border-emerald-200 px-5 py-2.5 rounded-xl hover:bg-emerald-50 disabled:opacity-50 transition-colors shadow-sm">
                {loadingMore ? <Loader2 size={14} className="animate-spin"/> : null}
                Load More
              </button>
            </div>
          )}
        </motion.main>
      </div>
      <AnimatePresence>
        {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUpload={handleUpload} loading={uploadLoading} />}
      </AnimatePresence>
    </div>
  );
};

export default ResourceLibrary;
