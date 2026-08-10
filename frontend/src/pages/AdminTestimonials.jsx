// frontend/src/pages/AdminTestimonials.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getPendingTestimonials, getApprovedTestimonials, approveTestimonial, deleteTestimonial } from '../services/api';
import Sidebar from '../components/Sidebar';
import NewsTicker from '../components/NewsTicker';
import {
  Menu, Star, Check, Trash2, Loader2,
  MessageSquare, RefreshCw, CheckCircle
} from 'lucide-react';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';
import GlobalSearch from '../components/GlobalSearch';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';

const AdminTestimonials = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingList, setPendingList] = useState([]);
  const [approvedList, setApprovedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionId, setActionId] = useState(null);
  const isMounted = useRef(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.allSettled([
        getPendingTestimonials(),
        getApprovedTestimonials(),
      ]);
      if (!isMounted.current) return;
      if (pRes.status === 'fulfilled') setPendingList(pRes.value.testimonials || []);
      if (aRes.status === 'fulfilled') setApprovedList(aRes.value.testimonials || []);
    } catch { }
    finally { if (isMounted.current) setLoading(false); }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchAll();
    return () => { isMounted.current = false; };
  }, []);

  const handleApprove = async (id) => {
    setActionId(id + 'a');
    try {
      const r = await approveTestimonial(id);
      if (r.success) {
        const item = pendingList.find(t => t._id === id);
        setPendingList(p => p.filter(t => t._id !== id));
        if (item) setApprovedList(p => [{ ...item, isApproved: true }, ...p]);
        toast.success('Testimonial approved!');
      }
    } catch (e) { toast.error(e.message); }
    finally { setActionId(null); }
  };

  const handleDelete = async (id) => {
    setActionId(id + 'd');
    try {
      await deleteTestimonial(id);
      setPendingList(p => p.filter(t => t._id !== id));
      setApprovedList(p => p.filter(t => t._id !== id));
      toast.success('Deleted');
    } catch (e) { toast.error(e.message); }
    finally { setActionId(null); }
  };

  const displayList = activeTab === 'pending' ? pendingList : approvedList;

  const TestimonialCard = ({ t }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/95 border border-emerald-100/30 rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
          {t.userName?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs font-black text-blue-900">{t.userName || 'User'}</p>
            <span className="text-[9px] font-bold text-blue-900/30 capitalize">{t.userRole?.replace('_', ' ')}</span>
            {t.branch && <span className="text-[9px] font-bold text-blue-900/30">{t.branch}</span>}
          </div>
          <div className="flex gap-0.5 mb-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={11} className={i < t.rating ? 'text-amber-400' : 'text-gray-200'} fill={i < t.rating ? 'currentColor' : 'none'} />
            ))}
          </div>
          <p className="text-xs font-medium text-blue-900/70 leading-relaxed line-clamp-3">"{t.text}"</p>
          <p className="text-[9px] text-blue-900/30 font-medium mt-1.5">{formatDate(t.createdAt, 'MMM d, yyyy')}</p>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {activeTab === 'pending' && (
            <button
              onClick={() => handleApprove(t._id)}
              disabled={!!actionId}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500 text-white text-[9px] font-black uppercase hover:bg-emerald-600 disabled:opacity-50 transition-all"
            >
              {actionId === t._id + 'a' ? <Loader2 size={9} className="animate-spin" /> : <Check size={9} />}
              Approve
            </button>
          )}
          {activeTab === 'approved' && (
            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600">
              <CheckCircle size={10} />Live
            </span>
          )}
          <button
            onClick={() => handleDelete(t._id)}
            disabled={!!actionId}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 text-red-500 text-[9px] font-black uppercase hover:bg-red-100 disabled:opacity-50 transition-all"
          >
            {actionId === t._id + 'd' ? <Loader2 size={9} className="animate-spin" /> : <Trash2 size={9} />}
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col">
        <NewsTicker />
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-base font-black text-emerald-600">Testimonials</h1>
              <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Manage user reviews</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
            <RefreshCw size={16} />
          </button>
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .4 }}
          className="flex-1 px-4 md:px-6 py-6 max-w-3xl mx-auto w-full"
        >
          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-white/80 border border-emerald-100/30 rounded-xl p-1 w-fit">
            {[
              { id: 'pending', label: `Pending (${pendingList.length})` },
              { id: 'approved', label: `Approved (${approvedList.length})` },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === t.id ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-sm' : 'text-blue-900/50 hover:text-blue-900'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/80 rounded-2xl animate-pulse" />)}
            </div>
          ) : displayList.length === 0 ? (
            <div className="text-center py-14 bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm">
              <MessageSquare size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-blue-900/40">
                {activeTab === 'pending' ? 'No pending testimonials' : 'No approved testimonials'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayList.map(t => <TestimonialCard key={t._id} t={t} />)}
            </div>
          )}
        </motion.main>
      </div>
    </div>
  );
};

export default AdminTestimonials;
