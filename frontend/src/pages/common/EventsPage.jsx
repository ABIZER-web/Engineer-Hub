// frontend/src/pages/common/EventsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { getAllEvents, registerForEvent, createEvent } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import { Menu, Search, Plus, X, Calendar, MapPin, Users, Clock, Loader2, CheckCircle, ExternalLink, Tag } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';

const eventTypeColor = (t) => {
  const m = { hackathon: 'from-violet-500 to-purple-600', workshop: 'from-blue-500 to-indigo-600', seminar: 'from-emerald-500 to-teal-600', competition: 'from-red-500 to-rose-600', cultural: 'from-pink-500 to-rose-500', sports: 'from-orange-500 to-amber-500', placement: 'from-amber-500 to-yellow-500' };
  return m[t] || 'from-gray-500 to-slate-600';
};

const AddEventModal = ({ onClose, onAdd, loading }) => {
  const [form, setForm] = useState({ title: '', description: '', eventType: 'workshop', date: '', time: '', venue: '', organizer: '', registrationLink: '', prize: '', fee: '0', maxParticipants: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = (e) => { e.preventDefault(); if (!form.title || !form.date) return; onAdd(form); };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: .92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .92 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-5 flex items-center justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-wide">Add Event</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3">
          <div>
            <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Event name"
              className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all" />
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Type</label>
              <select value={form.eventType} onChange={e => set('eventType', e.target.value)}
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all">
                {['hackathon', 'workshop', 'seminar', 'competition', 'cultural', 'sports', 'placement', 'other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Date *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Time</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)}
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all" />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Venue</label>
              <input value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="Location"
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all" />
            </div>
          </div>
          {[{ k: 'organizer', label: 'Organizer', ph: 'Department / Club' }, { k: 'registrationLink', label: 'Registration Link', ph: 'https://...' }, { k: 'prize', label: 'Prize / Benefit', ph: 'e.g. ₹10,000 + Certificate' }].map(({ k, label, ph }) => (
            <div key={k}>
              <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">{label}</label>
              <input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph}
                className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all" />
            </div>
          ))}
        </form>
        <div className="p-5 border-t border-emerald-50 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-wider hover:bg-gray-200 transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] disabled:opacity-50 transition-all shadow-md">
            {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Create Event'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const EventsPage = () => {
  const { user, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [registering, setRegistering] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetch = async () => {
      try { const r = await getAllEvents(); if (isMounted.current) setEvents(r.events || []); }
      catch { } finally { if (isMounted.current) setLoading(false); }
    };
    fetch();
    return () => { isMounted.current = false; };
  }, []);

  const handleRegister = async (eventId) => {
    setRegistering(eventId);
    try {
      const r = await registerForEvent(eventId);
      if (r.success) {
        toast.success(r.message);
        setEvents(p => p.map(e => e._id === eventId ? r.event : e));
      }
    } catch (e) { toast.error(e.message); }
    finally { setRegistering(null); }
  };

  const handleAdd = async (data) => {
    setAddLoading(true);
    try {
      const r = await createEvent(data);
      if (r.success) { toast.success('Event created!'); setEvents(p => [r.event, ...p]); setShowAdd(false); }
    } catch (e) { toast.error(e.message); }
    finally { setAddLoading(false); }
  };

  const isRegistered = (ev) => ev.registeredUsers?.some(id => id === user?._id || id?._id === user?._id);

  const filtered = events.filter(e => {
    const ms = !search || e.title.toLowerCase().includes(search.toLowerCase());
    const mt = typeFilter === 'all' || e.eventType === typeFilter;
    return ms && mt;
  });

  const upcoming = filtered.filter(e => new Date(e.date) >= new Date());
  const past = filtered.filter(e => new Date(e.date) < new Date());

  const EventCard = ({ ev, i }) => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }}
      whileHover={{ y: -4 }}
      className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className={`h-2 bg-gradient-to-r ${eventTypeColor(ev.eventType)}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${eventTypeColor(ev.eventType)}`}>{ev.eventType}</span>
              {isRegistered(ev) && <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Registered ✓</span>}
            </div>
            <h3 className="text-sm font-black text-blue-900 line-clamp-1">{ev.title}</h3>
          </div>
        </div>
        {ev.description && <p className="text-[11px] text-blue-900/50 font-medium line-clamp-2 mb-3">{ev.description}</p>}
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-[10px] text-blue-900/50 font-medium">
            <Calendar size={11} className="text-emerald-500" />
            <span>{formatDate(ev.date, 'EEE, MMM d yyyy')}{ev.time && ` at ${ev.time}`}</span>
          </div>
          {ev.venue && <div className="flex items-center gap-1.5 text-[10px] text-blue-900/50 font-medium"><MapPin size={11} className="text-emerald-500" /><span className="line-clamp-1">{ev.venue}</span></div>}
          {ev.prize && <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-black"><Tag size={11} /><span>{ev.prize}</span></div>}
          {ev.registeredCount !== undefined && <div className="flex items-center gap-1.5 text-[10px] text-blue-900/50 font-medium"><Users size={11} className="text-blue-500" /><span>{ev.registeredCount} registered{ev.maxParticipants ? ` / ${ev.maxParticipants} max` : ''}</span></div>}
        </div>
        <div className="flex gap-2">
          {ev.registrationLink && (
            <a href={ev.registrationLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors">
              <ExternalLink size={9} />Register
            </a>
          )}
          <button onClick={() => handleRegister(ev._id)} disabled={registering === ev._id}
            className={`flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg transition-all ${isRegistered(ev) ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:scale-[1.02] shadow-sm'}`}>
            {registering === ev._id ? <Loader2 size={9} className="animate-spin" /> : isRegistered(ev) ? <><CheckCircle size={9} />Going</> : 'I\'m Interested'}
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col relative z-10">
        <NewsTicker />
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20} /></button>
            <div>
              <h1 className="text-base font-black text-emerald-600">Campus Events</h1>
              <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Hackathons, workshops & campus activities</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          {isAdmin?.() && (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-3 py-2 rounded-xl hover:scale-[1.02] transition-all shadow-sm">
              <Plus size={13} />Add Event
            </button>
          )}
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>
        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
          className="flex-1 px-4 md:px-6 py-6 max-w-5xl mx-auto w-full">
          <div className="flex flex-wrap gap-2 mb-5">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..."
                className="w-full pl-8 pr-3 py-2 text-xs font-medium border border-emerald-100/40 rounded-xl bg-white/80 focus:outline-none focus:border-emerald-300 transition-all" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="text-xs font-bold border border-emerald-100/40 rounded-xl px-3 py-2 bg-white/80 focus:outline-none focus:border-emerald-300 transition-all capitalize">
              <option value="all">All Types</option>
              {['hackathon', 'workshop', 'seminar', 'competition', 'cultural', 'sports', 'placement'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-white/80 rounded-2xl animate-pulse" />)}</div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xs font-black uppercase tracking-wider text-emerald-600 mb-3">Upcoming Events ({upcoming.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcoming.map((ev, i) => <EventCard key={ev._id} ev={ev} i={i} />)}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-blue-900/40 mb-3">Past Events ({past.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
                    {past.slice(0, 6).map((ev, i) => <EventCard key={ev._id} ev={ev} i={i} />)}
                  </div>
                </div>
              )}
              {filtered.length === 0 && (
                <div className="text-center py-16 bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm">
                  <Calendar size={40} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-blue-900/40">No events found</p>
                </div>
              )}
            </>
          )}
        </motion.main>
      </div>
      <AnimatePresence>
        {showAdd && <AddEventModal onClose={() => setShowAdd(false)} onAdd={handleAdd} loading={addLoading} />}
      </AnimatePresence>
    </div>
  );
};

export default EventsPage;
