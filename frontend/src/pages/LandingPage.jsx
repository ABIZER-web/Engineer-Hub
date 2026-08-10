// frontend/src/pages/LandingPage.jsx — Phase 3: No floating dots, premium design
import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, BarChart2, ShoppingBag, Briefcase, BookOpen,
  Calendar, Users, Zap, Shield, Star, ArrowRight, Menu, X,
  CalendarCheck, TrendingUp, Award, CheckCircle
} from 'lucide-react';
import Logo from '../components/Logo';
import { getApprovedTestimonials } from '../services/api';

const Counter = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(start);
      if (start >= target) clearInterval(timer);
    }, 24);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
};

const FEATURES = [
  { icon: CalendarCheck, title: 'Smart Attendance',    desc: '75% target alerts, per-subject tracking, weekly trends and bunk calculator.',      gradient: 'from-emerald-500 to-teal-600' },
  { icon: ShoppingBag,   title: 'Project Marketplace', desc: 'Buy & sell engineering projects with UPI-based payments and admin verification.',   gradient: 'from-blue-500 to-indigo-600' },
  { icon: Briefcase,     title: 'Freelancing Hub',     desc: 'Post briefs, submit bids, track projects, and build your developer portfolio.',     gradient: 'from-violet-500 to-purple-600' },
  { icon: BookOpen,      title: 'Resource Library',    desc: 'Branch & semester organized notes, papers, books — searchable and free.',          gradient: 'from-amber-500 to-orange-500' },
  { icon: Calendar,      title: 'Campus Events',       desc: 'Hackathons, workshops, placements — register with one click, never miss out.',     gradient: 'from-pink-500 to-rose-500' },
  { icon: TrendingUp,    title: 'Academic Results',    desc: 'Log marks, calculate SGPA/CGPA, visualize your academic progress over semesters.', gradient: 'from-teal-500 to-cyan-600' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [scrolled, setScrolled]       = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    getApprovedTestimonials().then(r => setTestimonials((r.testimonials || []).slice(0, 6))).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-emerald-100/40' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" showText />
          <div className="hidden md:flex items-center gap-6">
            {['Features','Why Us','Testimonials'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`}
                className="text-sm font-bold text-blue-900/60 hover:text-emerald-600 transition-colors">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/auth')} className="hidden md:block text-sm font-bold text-blue-900/60 hover:text-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-50 transition-all">Login</button>
            <button onClick={() => navigate('/auth')} className="flex items-center gap-1.5 text-xs font-black text-white uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2.5 rounded-xl hover:scale-[1.02] transition-all shadow-md">
              Get Started <ChevronRight size={13} />
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-xl hover:bg-emerald-50 transition-colors">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-emerald-100/30 px-4 py-4 space-y-2 shadow-lg">
            <button onClick={() => { navigate('/auth'); setMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-blue-900/60 hover:bg-emerald-50 transition-colors">Login</button>
            <button onClick={() => { navigate('/auth'); setMenuOpen(false); }} className="w-full text-center px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-sm font-black text-white">Get Started</button>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-24 overflow-hidden">
        {/* Soft gradient shapes instead of dots */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-100/50 to-transparent rounded-full blur-3xl pointer-events-none -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-100/40 to-transparent rounded-full blur-3xl pointer-events-none translate-y-1/4 -translate-x-1/4" />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200/60 rounded-full px-4 py-1.5 mb-6 text-xs font-black uppercase tracking-widest text-emerald-600">
              <Zap size={11} />Mumbai University · Engineering Community
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
              <span className="text-blue-900">The Command</span><br />
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Center for Engineers</span>
            </h1>
            <p className="text-lg md:text-xl font-medium text-blue-900/55 max-w-2xl mx-auto mb-10 leading-relaxed">
              Track attendance, sell projects, freelance, access study material, and build your engineering career — all in one platform built for MU students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/auth')}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-sm font-black uppercase tracking-wider hover:scale-[1.02] transition-all shadow-xl shadow-emerald-200/60">
                Start Free <ArrowRight size={15} />
              </button>
              <button onClick={() => navigate('/auth')}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white border-2 border-emerald-200 text-emerald-700 text-sm font-black uppercase tracking-wider hover:bg-emerald-50 transition-all shadow-sm">
                See Dashboard
              </button>
            </div>
          </motion.div>

          {/* Floating dashboard preview */}
          <motion.div initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}
            className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none rounded-3xl" style={{ top: '60%' }} />
            <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl shadow-gray-200/60 p-6 max-w-3xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="flex-1 h-6 bg-gray-100 rounded-lg mx-4" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Attendance', value: '87%', sub: '↑ On track', g: 'from-emerald-500 to-teal-500', sub_c: 'text-emerald-600' },
                  { label: 'SGPA', value: '8.6', sub: 'Semester 5', g: 'from-blue-500 to-indigo-500', sub_c: 'text-blue-600' },
                  { label: 'Projects', value: '12', sub: '3 pending', g: 'from-violet-500 to-purple-500', sub_c: 'text-violet-600' },
                  { label: 'Earned', value: '₹4.2K', sub: 'This month', g: 'from-amber-500 to-orange-500', sub_c: 'text-amber-600' },
                ].map(({ label, value, sub, g, sub_c }) => (
                  <div key={label} className="bg-gradient-to-br from-slate-50 to-white border border-gray-100 rounded-2xl p-4">
                    <div className={`w-8 h-1.5 rounded-full bg-gradient-to-r ${g} mb-3`} />
                    <p className="text-xl font-black text-blue-900">{value}</p>
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-900/40 mt-0.5">{label}</p>
                    <p className={`text-[9px] font-bold mt-1 ${sub_c}`}>{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 py-14">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
          {[{ l: 'Students', t: 1200 }, { l: 'Projects Listed', t: 340 }, { l: 'Resources', t: 800 }, { l: 'Events', t: 45 }].map(({ l, t }) => (
            <div key={l}>
              <p className="text-4xl font-black"><Counter target={t} suffix="+" /></p>
              <p className="text-sm font-medium text-white/70 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-14">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">Everything You Need</p>
          <h2 className="text-4xl font-black text-blue-900 mb-4">Built for Engineering Students</h2>
          <p className="text-base text-blue-900/50 font-medium max-w-xl mx-auto">A complete ecosystem for the Mumbai University engineering community.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .07 }}
              whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:border-emerald-200/60 transition-all duration-300 cursor-default">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-md`}>
                <f.icon size={22} className="text-white" />
              </div>
              <h3 className="text-base font-black text-blue-900 mb-2">{f.title}</h3>
              <p className="text-sm text-blue-900/55 font-medium leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Why Us ── */}
      <section id="why-us" className="bg-gradient-to-br from-slate-50 to-emerald-50/30 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">Why Engineer Hub</p>
          <h2 className="text-3xl font-black text-blue-900 mb-12">Designed for real engineering life</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Secure by Default', desc: 'JWT auth, HTTP-only cookies, rate limiting, input sanitization.', g: 'from-emerald-500 to-teal-600' },
              { icon: Zap,    title: 'Blazing Fast',      desc: 'Vite + React 18 with code splitting, lazy loading, and PWA caching.', g: 'from-blue-500 to-indigo-600' },
              { icon: Users,  title: 'Community First',  desc: 'Peer-to-peer learning, mentorship, freelancing, and knowledge sharing.', g: 'from-violet-500 to-purple-600' },
            ].map(({ icon: Icon, title, desc, g }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .1 }}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${g} flex items-center justify-center mx-auto mb-4 shadow-md`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="text-sm font-black text-blue-900 mb-2">{title}</h3>
                <p className="text-xs text-blue-900/50 font-medium leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      {testimonials.length > 0 && (
        <section id="testimonials" className="max-w-6xl mx-auto px-4 py-24">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">Student Reviews</p>
            <h2 className="text-3xl font-black text-blue-900">What Engineers Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div key={t._id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .06 }}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, si) => (
                    <Star key={si} size={12} className={si < t.rating ? 'text-amber-400' : 'text-gray-200'} fill={si < t.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <p className="text-xs font-medium text-blue-900/70 leading-relaxed mb-4 line-clamp-3">"{t.text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-xs font-black">
                    {t.userName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-black text-blue-900">{t.userName}</p>
                    <p className="text-[9px] text-blue-900/40 font-medium capitalize">{t.userRole?.replace('_',' ')}{t.branch ? ` · ${t.branch}` : ''}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-4 py-24 text-center">
        <motion.div initial={{ opacity: 0, scale: .97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 rounded-3xl p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
            <p className="text-xs font-black uppercase tracking-widest text-white/60 mb-3">Join 1200+ Engineers</p>
            <h2 className="text-3xl font-black mb-4 relative">Ready to Get Started?</h2>
            <p className="text-white/70 mb-8 relative font-medium">Create your free account and take control of your engineering journey.</p>
            <button onClick={() => navigate('/auth')}
              className="inline-flex items-center gap-2 bg-white text-emerald-700 font-black text-sm uppercase tracking-wider px-8 py-4 rounded-2xl hover:scale-[1.02] transition-all shadow-lg relative">
              Create Free Account <ArrowRight size={15} />
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" showText />
          <div className="flex gap-6">
            {[
              { label: 'FAQ', href: '/faq' },
              { label: 'Privacy', href: '/privacy-policy' },
              { label: 'Terms', href: '/terms-of-service' },
              { label: 'Cookie Policy', href: '/cookie-policy' },
              { label: 'Contact', href: 'mailto:admin@engineerhub.in' },
            ].map(l => (
              <a key={l.label} href={l.href}
                className="text-xs font-bold text-blue-900/40 hover:text-emerald-600 transition-colors">{l.label}</a>
            ))}
          </div>
          <p className="text-xs font-medium text-blue-900/30">© {new Date().getFullYear()} Engineer Hub. Mumbai University.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
