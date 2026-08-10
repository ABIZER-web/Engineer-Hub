// frontend/src/pages/common/PlacementsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { getPlacements, createPlacement, deletePlacement, uploadPoster } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import {
  Menu, Plus, X, Building2, MapPin, Calendar, IndianRupee, ExternalLink,
  Loader2, ImagePlus, Trash2, Briefcase, GraduationCap
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { BRANCHES, SEMESTERS } from '../../utils/constants';
import toast from 'react-hot-toast';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ORIGIN = API_URL.replace(/\/api\/?$/, '');
const posterSrc = (url) => (url?.startsWith('/uploads') ? `${ORIGIN}${url}` : url);

const PostModal = ({ onClose, onPost, loading }) => {
  const [form, setForm] = useState({
    title: '', company: '', description: '', type: 'placement',
    branch: 'All', minSemester: '', package: '', location: '', deadline: '', applyLink: '',
  });
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const submit = async () => {
    if (!form.title.trim() || !form.company.trim()) return toast.error('Title and company are required');
    let posterUrl = '';
    if (posterFile) {
      setUploading(true);
      try {
        const res = await uploadPoster(posterFile);
        posterUrl = res.url;
      } catch (e) { toast.error(e.message); setUploading(false); return; }
      setUploading(false);
    }
    onPost({ ...form, minSemester: form.minSemester || null, posterUrl });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: .95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-blue-900">Post a Placement / Internship Drive</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        {/* Poster upload */}
        <button onClick={() => fileRef.current?.click()}
          className="w-full h-32 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 flex flex-col items-center justify-center gap-1.5 mb-3 overflow-hidden relative hover:bg-emerald-50 transition-colors">
          {posterPreview ? (
            <img src={posterPreview} alt="Poster preview" className="w-full h-full object-cover" />
          ) : (
            <><ImagePlus size={22} className="text-emerald-400" /><span className="text-[10px] font-black uppercase text-emerald-500">Upload poster (optional)</span></>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={onFileChange} />

        <div className="grid grid-cols-2 gap-2 mb-2">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Role / drive title *"
            className="col-span-2 px-3 py-2 text-xs font-medium border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-300" />
          <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Company *"
            className="px-3 py-2 text-xs font-medium border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-300" />
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="px-3 py-2 text-xs font-bold border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-300">
            <option value="placement">Placement</option>
            <option value="internship">Internship</option>
          </select>
        </div>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description, eligibility, role details..." rows={3}
          className="w-full px-3 py-2 text-xs font-medium border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-300 resize-none mb-2" />
        <div className="grid grid-cols-2 gap-2 mb-2">
          <select value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
            className="px-3 py-2 text-xs font-bold border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-300">
            <option value="All">All Branches</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={form.minSemester} onChange={e => setForm(f => ({ ...f, minSemester: e.target.value }))}
            className="px-3 py-2 text-xs font-bold border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-300">
            <option value="">Min. Semester (any)</option>
            {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}+</option>)}
          </select>
          <input value={form.package} onChange={e => setForm(f => ({ ...f, package: e.target.value }))} placeholder="Package / stipend"
            className="px-3 py-2 text-xs font-medium border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-300" />
          <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Location"
            className="px-3 py-2 text-xs font-medium border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-300" />
          <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
            className="px-3 py-2 text-xs font-medium border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-300" />
          <input value={form.applyLink} onChange={e => setForm(f => ({ ...f, applyLink: e.target.value }))} placeholder="Apply link (https://...)"
            className="px-3 py-2 text-xs font-medium border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-300" />
        </div>

        <button onClick={submit} disabled={loading || uploading}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase hover:scale-[1.01] disabled:opacity-50 transition-all">
          {(loading || uploading) ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {uploading ? 'Uploading poster...' : 'Post Drive'}
        </button>
      </motion.div>
    </motion.div>
  );
};

const PlacementCard = ({ p, canManage, onDelete }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden group">
    {p.posterUrl ? (
      <div className="h-40 bg-gray-50 overflow-hidden">
        <img src={posterSrc(p.posterUrl)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      </div>
    ) : (
      <div className="h-16 bg-gradient-to-br from-emerald-500 to-blue-600" />
    )}
    <div className="p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${p.type === 'internship' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {p.type}
        </span>
        {p.branch !== 'All' && <span className="text-[8px] font-black uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{p.branch}</span>}
        {canManage && (
          <button onClick={() => onDelete(p._id)} className="ml-auto p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={12} />
          </button>
        )}
      </div>
      <h3 className="text-sm font-black text-blue-900 line-clamp-1">{p.title}</h3>
      <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mb-1.5"><Building2 size={11} />{p.company}</p>
      {p.description && <p className="text-[11px] text-blue-900/50 font-medium line-clamp-2 mb-2">{p.description}</p>}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-blue-900/40 font-medium mb-3">
        {p.package && <span className="flex items-center gap-0.5"><IndianRupee size={10} />{p.package}</span>}
        {p.location && <span className="flex items-center gap-0.5"><MapPin size={10} />{p.location}</span>}
        {p.deadline && <span className="flex items-center gap-0.5"><Calendar size={10} />Apply by {formatDate(p.deadline, 'MMM d')}</span>}
        {p.minSemester && <span className="flex items-center gap-0.5"><GraduationCap size={10} />Sem {p.minSemester}+</span>}
      </div>
      {p.applyLink && (
        <a href={p.applyLink} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 py-2 rounded-xl hover:scale-[1.01] transition-all shadow-sm">
          Apply Now <ExternalLink size={11} />
        </a>
      )}
    </div>
  </motion.div>
);

const PlacementsPage = () => {
  const { user } = useAuth();
  const canManage = ['admin', 'super_admin'].includes(user?.role);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [showPost, setShowPost] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const isMounted = useRef(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await getPlacements({ ...(typeFilter !== 'all' ? { type: typeFilter } : {}), page: 1 });
      if (isMounted.current) { setPlacements(res.placements || []); setHasMore(!!res.hasMore); setPage(1); }
    }
    catch (e) { toast.error(e.message); }
    finally { if (isMounted.current) setLoading(false); }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getPlacements({ ...(typeFilter !== 'all' ? { type: typeFilter } : {}), page: nextPage });
      setPlacements(prev => [...prev, ...(res.placements || [])]);
      setHasMore(!!res.hasMore);
      setPage(nextPage);
    } catch (e) { toast.error(e.message); }
    finally { setLoadingMore(false); }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchAll();
    return () => { isMounted.current = false; };
  }, [typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePost = async (data) => {
    setPostLoading(true);
    try {
      const res = await createPlacement(data);
      toast.success('Drive posted!');
      setShowPost(false);
      setPlacements(p => [res.placement, ...p]);
    } catch (e) { toast.error(e.message); }
    finally { setPostLoading(false); }
  };

  const handleDelete = async (id) => {
    try { await deletePlacement(id); setPlacements(p => p.filter(x => x._id !== id)); toast.success('Removed'); }
    catch (e) { toast.error(e.message); }
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
              <h1 className="text-base font-black text-emerald-600 flex items-center gap-1.5"><Briefcase size={16} />Placements & Internships</h1>
              <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Campus drives and internship opportunities</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          {canManage && (
            <button onClick={() => setShowPost(true)}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-3 py-2 rounded-xl shadow-md hover:scale-[1.02] transition-all">
              <Plus size={13} />Post Drive
            </button>
          )}
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>

        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
          className="flex-1 px-4 md:px-6 py-6 max-w-6xl mx-auto w-full">

          <div className="flex gap-2 mb-5 bg-white/80 border border-emerald-100/30 rounded-xl p-1 w-fit">
            {[{ id: 'all', label: 'All' }, { id: 'placement', label: 'Placements' }, { id: 'internship', label: 'Internships' }].map(t => (
              <button key={t.id} onClick={() => setTypeFilter(t.id)}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${typeFilter === t.id ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-sm' : 'text-blue-900/40 hover:text-blue-900/70'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-white/80 rounded-2xl animate-pulse" />)}
            </div>
          ) : placements.length === 0 ? (
            <div className="text-center py-16 bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm">
              <Briefcase size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-blue-900/40">No drives posted yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {placements.map(p => <PlacementCard key={p._id} p={p} canManage={canManage} onDelete={handleDelete} />)}
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
        {showPost && <PostModal onClose={() => setShowPost(false)} onPost={handlePost} loading={postLoading} />}
      </AnimatePresence>
    </div>
  );
};

export default PlacementsPage;
