// frontend/src/pages/AdminWithdrawals.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import NewsTicker from '../components/NewsTicker';
import {
  Menu, IndianRupee, CheckCircle, XCircle, Clock,
  Loader2, RefreshCw, Search, Filter, CreditCard, Eye, X
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';
import GlobalSearch from '../components/GlobalSearch';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const req = async (url, method = 'GET', data = null) => {
  const opts = {
    method, credentials: 'include', // httpOnly auth cookie is sent automatically
    headers: { 'Content-Type': 'application/json' },
    ...(data ? { body: JSON.stringify(data) } : {}),
  };
  const res  = await fetch(`${API}${url}`, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json;
};

const statusColors = {
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  paid:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected:   'bg-red-50 text-red-700 border-red-200',
};

const UpdateModal = ({ withdrawal, onClose, onUpdate }) => {
  const [status, setStatus] = useState(withdrawal.status);
  const [txId, setTxId]     = useState(withdrawal.transactionId || '');
  const [note, setNote]     = useState(withdrawal.rejectionNote || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { await onUpdate(withdrawal._id, { status, transactionId: txId, rejectionNote: note }); onClose(); }
    catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: .92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .92 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-5 flex items-center justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-wide">Update Payout</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="p-3 bg-emerald-50/60 rounded-xl">
            <p className="text-xs font-black text-blue-900">{withdrawal.userName}</p>
            <p className="text-[10px] text-blue-900/50">{withdrawal.userEmail} · {withdrawal.upiId}</p>
            <p className="text-sm font-black text-emerald-600 mt-1">{formatCurrency(withdrawal.amount)}</p>
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all">
              {['pending','processing','paid','rejected'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {status === 'paid' && (
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Transaction ID</label>
              <input value={txId} onChange={e => setTxId(e.target.value)} placeholder="UTR/Transaction reference"
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all" />
            </div>
          )}
          {status === 'rejected' && (
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Rejection Reason</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Reason for rejection..."
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all resize-none" />
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-wider hover:bg-gray-200 transition-all">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] disabled:opacity-50 transition-all shadow-md">
              {saving ? <Loader2 size={13} className="animate-spin mx-auto" /> : 'Update'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AdminWithdrawals = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [withdrawals, setWithdrawals]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState(null);
  const isMounted = useRef(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const q = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const r = await req(`/withdrawals${q}`);
      if (isMounted.current) setWithdrawals(r.withdrawals || []);
    } catch { }
    finally { if (isMounted.current) setLoading(false); }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchAll();
    return () => { isMounted.current = false; };
  }, [statusFilter]);

  const handleUpdate = async (id, data) => {
    const r = await req(`/withdrawals/${id}/status`, 'PUT', data);
    setWithdrawals(p => p.map(w => w._id === id ? r.withdrawal : w));
    toast.success('Status updated');
  };

  const filtered = withdrawals.filter(w =>
    !search || [w.userName, w.userEmail, w.upiId].join(' ').toLowerCase().includes(search.toLowerCase())
  );

  const totals = {
    pending:    withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.amount, 0),
    processing: withdrawals.filter(w => w.status === 'processing').reduce((s, w) => s + w.amount, 0),
    paid:       withdrawals.filter(w => w.status === 'paid').reduce((s, w) => s + w.amount, 0),
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
              <h1 className="text-base font-black text-emerald-600">Withdrawal Requests</h1>
              <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Manage developer payout requests</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><RefreshCw size={16} /></button>
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>

        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
          className="flex-1 px-4 md:px-6 py-6 max-w-5xl mx-auto w-full">

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Pending',    value: formatCurrency(totals.pending, true),    cls: 'from-amber-500 to-orange-500' },
              { label: 'Processing', value: formatCurrency(totals.processing, true), cls: 'from-blue-500 to-indigo-600' },
              { label: 'Paid Out',   value: formatCurrency(totals.paid, true),       cls: 'from-emerald-500 to-emerald-600' },
            ].map(({ label, value, cls }) => (
              <motion.div key={label} whileHover={{ y: -3 }} className="bg-white/95 border border-emerald-100/30 rounded-2xl p-4 shadow-sm">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cls} flex items-center justify-center mb-2`}>
                  <IndianRupee size={14} className="text-white" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-wider text-blue-900/40">{label}</p>
                <p className="text-lg font-black text-emerald-600">{value}</p>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or UPI..."
                className="w-full pl-8 pr-3 py-2 text-xs font-medium border border-emerald-100/40 rounded-xl bg-white/80 focus:outline-none focus:border-emerald-300 transition-all" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="text-xs font-bold border border-emerald-100/40 rounded-xl px-3 py-2 bg-white/80 focus:outline-none focus:border-emerald-300 transition-all">
              <option value="all">All Status</option>
              {['pending','processing','paid','rejected'].map(s => <option key={s} className="capitalize">{s}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center"><p className="text-sm font-bold text-blue-900/40">No withdrawal requests found</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-emerald-50/60 to-blue-50/40">
                      {['User','UPI ID','Amount','Status','Requested','Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-blue-900/40">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {filtered.map((w, i) => (
                      <motion.tr key={w._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * .03 }}
                        className="hover:bg-emerald-50/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-xs font-black text-blue-900">{w.userName || '—'}</p>
                          <p className="text-[9px] text-blue-900/40">{w.userEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-blue-900/60">{w.upiId}</td>
                        <td className="px-4 py-3 text-xs font-black text-emerald-600">{formatCurrency(w.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColors[w.status]}`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[10px] text-blue-900/40">{formatDate(w.requestedAt, 'MMM d, yyyy')}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelected(w)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-[9px] font-black uppercase hover:bg-blue-100 transition-all">
                            <Eye size={9} />Update
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.main>
      </div>
      <AnimatePresence>
        {selected && <UpdateModal withdrawal={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />}
      </AnimatePresence>
    </div>
  );
};

export default AdminWithdrawals;
