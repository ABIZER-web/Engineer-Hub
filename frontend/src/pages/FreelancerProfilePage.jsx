// frontend/src/pages/FreelancerProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getUserById, getProjectsByClient, getOrCreateConversation } from '../services/api';
import Sidebar from '../components/Sidebar';
import NewsTicker from '../components/NewsTicker';
import {
  ArrowLeft, Menu, Briefcase, Code2, MapPin, Mail,
  Star, Clock, IndianRupee, AlertCircle, Loader2, Tag, MessageCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';
import GlobalSearch from '../components/GlobalSearch';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';

const FreelancerProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [freelancer, setFreelancer] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMessage = async () => {
    if (!currentUser) return toast.error('Please login to send a message');
    try {
      const res = await getOrCreateConversation({
        otherUserId: freelancer._id, contextType: 'freelance', contextId: null, contextLabel: `${freelancer.firstName}'s profile`,
      });
      navigate(`/messages/${res.conversation._id}`);
    } catch (e) { toast.error(e.message || 'Could not start conversation'); }
  };

  useEffect(() => {
    const load = async () => {
      if (!id) { setError('Invalid profile ID'); setLoading(false); return; }
      try {
        const [userRes, projRes] = await Promise.allSettled([
          getUserById(id),
          getProjectsByClient(id),
        ]);
        if (userRes.status === 'fulfilled' && userRes.value.success) {
          setFreelancer(userRes.value.user);
        } else {
          setError('Freelancer not found');
        }
        if (projRes.status === 'fulfilled') {
          setProjects(projRes.value.projects || []);
        }
      } catch (e) {
        setError(e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const roleGradient = {
    developer: 'from-emerald-500 to-teal-600',
    student: 'from-blue-500 to-indigo-600',
    admin: 'from-violet-500 to-purple-600',
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/10">
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 relative">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-600 animate-spin" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600 animate-pulse">Loading Profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !freelancer) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/10">
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white/95 border border-red-100 rounded-2xl p-8 max-w-sm text-center shadow-lg">
            <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
            <h2 className="text-base font-black text-blue-900 mb-2">Profile Not Found</h2>
            <p className="text-xs text-blue-900/50 mb-5">{error || 'This profile does not exist.'}</p>
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-2 mx-auto text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2.5 rounded-xl hover:scale-[1.02] transition-all shadow-md">
              <ArrowLeft size={13} />Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col">
        <NewsTicker />

        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center gap-3 shadow-sm">
          <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50">
            <Menu size={20} />
          </button>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-bold text-blue-900/50 hover:text-emerald-600 transition-colors">
            <ArrowLeft size={15} />Back
          </button>
          <h1 className="text-base font-black text-emerald-600">Freelancer Profile</h1>
          <div className="flex items-center gap-2 ml-auto">
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .4 }}
          className="flex-1 px-4 md:px-6 py-6 max-w-3xl mx-auto w-full"
        >
          {/* Profile card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm overflow-hidden mb-5"
          >
            {/* Banner */}
            <div className={`h-24 bg-gradient-to-r ${roleGradient[freelancer.role] || 'from-emerald-500 to-blue-600'} relative`}>
              <div className="absolute bottom-0 left-6 translate-y-1/2">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${roleGradient[freelancer.role] || 'from-emerald-500 to-blue-600'} border-4 border-white flex items-center justify-center text-white text-2xl font-black shadow-lg`}>
                  {freelancer.firstName?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            <div className="pt-12 px-6 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-blue-900">
                    {freelancer.firstName} {freelancer.middleName} {freelancer.lastName}
                  </h2>
                  <p className="text-xs font-bold text-emerald-600 capitalize mt-0.5">
                    {freelancer.role?.replace('_', ' ')}
                    {freelancer.branch ? ` · ${freelancer.branch}` : ''}
                    {freelancer.semester ? ` · Sem ${freelancer.semester}` : ''}
                  </p>
                  {freelancer.freelancerReviewCount > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-black text-blue-900">{freelancer.freelancerRating?.toFixed(1)}</span>
                      <span className="text-[10px] text-blue-900/40 font-medium">({freelancer.freelancerReviewCount} review{freelancer.freelancerReviewCount === 1 ? '' : 's'})</span>
                    </div>
                  )}
                </div>
                {currentUser?._id !== freelancer._id && (
                  <div className="flex items-center gap-2">
                    <button onClick={handleMessage}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-3 py-2 rounded-xl hover:scale-[1.02] transition-all shadow-sm">
                      <MessageCircle size={11} />Message
                    </button>
                    <a href={`mailto:${freelancer.email}`}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-900/60 bg-gray-100 px-3 py-2 rounded-xl hover:bg-gray-200 transition-all">
                      <Mail size={11} />Email
                    </a>
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-3 mt-4 text-xs font-medium text-blue-900/50">
                {freelancer.location && (
                  <span className="flex items-center gap-1"><MapPin size={11} />{freelancer.location}</span>
                )}
                <span className="flex items-center gap-1"><Mail size={11} />{freelancer.email}</span>
                <span className="flex items-center gap-1"><Clock size={11} />
                  Joined {formatDate(freelancer.createdAt, 'MMM yyyy')}
                </span>
              </div>

              {/* Bio */}
              {freelancer.bio && (
                <p className="text-sm font-medium text-blue-900/70 leading-relaxed mt-4 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/30">
                  {freelancer.bio}
                </p>
              )}

              {/* Skills */}
              {freelancer.skills?.length > 0 && (
                <div className="mt-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-blue-900/40 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {freelancer.skills.map(s => (
                      <span key={s} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Projects posted */}
          {projects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: .2 }}
              className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="p-4 border-b border-emerald-50">
                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wide">
                  Posted Projects ({projects.length})
                </h3>
              </div>
              <div className="divide-y divide-emerald-50">
                {projects.map((p, i) => (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: .25 + i * .04 }}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-emerald-50/20 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                      <Briefcase size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-blue-900 truncate">{p.title}</p>
                      <div className="flex items-center gap-2 text-[9px] text-blue-900/40 font-medium mt-0.5">
                        <span className="flex items-center gap-0.5"><IndianRupee size={9} />{formatCurrency(p.budget).replace('₹', '')}</span>
                        <span>{p.status}</span>
                        <span>{p.bids?.length || 0} bids</span>
                      </div>
                      {p.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.skills.slice(0, 4).map(s => (
                            <span key={s} className="text-[8px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${p.status === 'open' ? 'bg-emerald-50 text-emerald-700' : p.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'}`}>
                      {p.status?.replace('_', ' ')}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.main>
      </div>
    </div>
  );
};

export default FreelancerProfilePage;
