// frontend/src/pages/common/Profile.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { updateUser, changePassword, deleteMyAccount } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import NewsTicker from '../../components/NewsTicker';
import { Menu, User, Mail, Phone, MapPin, Save, Edit2, X, Loader2, Lock, Plus, Tag, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { BRANCHES, SEMESTERS } from '../../utils/constants';
import toast from 'react-hot-toast';
import GlobalSearch from '../../components/GlobalSearch';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationBell from '../../components/NotificationBell';

const SKILL_SUGGESTIONS = ['React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'MongoDB', 'Express', 'Vue.js', 'Next.js', 'Flutter', 'Machine Learning', 'Docker', 'AWS', 'Figma', 'Git'];

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({ firstName: '', middleName: '', lastName: '', phone: '', bio: '', location: '', branch: '', semester: '', rollNumber: '', skills: [] });
  const [pwd, setPwd] = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ firstName: user.firstName || '', middleName: user.middleName || '', lastName: user.lastName || '', phone: user.phone || '', bio: user.bio || '', location: user.location || '', branch: user.branch || '', semester: user.semester || '', rollNumber: user.rollNumber || '', skills: user.skills || [] });
    }
  }, [user]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await updateUser(user._id, form);
      if (r.success) { await refreshUser?.(); toast.success('Profile updated!'); setEditing(false); }
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const addSkill = (s) => { if (s && !form.skills.includes(s)) set('skills', [...form.skills, s]); setSkillInput(''); };
  const removeSkill = (s) => set('skills', form.skills.filter(x => x !== s));

  const handlePwdChange = async (e) => {
    e.preventDefault();
    if (pwd.newPwd !== pwd.confirm) return toast.error('Passwords do not match');
    if (pwd.newPwd.length < 6) return toast.error('Password must be at least 6 characters');
    setPwdLoading(true);
    try {
      const r = await changePassword(user._id, { currentPassword: pwd.current, newPassword: pwd.newPwd });
      if (r.success) { toast.success('Password changed!'); setPwd({ current: '', newPwd: '', confirm: '' }); }
    } catch (e) { toast.error(e.message); }
    finally { setPwdLoading(false); }
  };

  const roleColor = { student: 'from-blue-500 to-indigo-600', developer: 'from-emerald-500 to-teal-600', admin: 'from-violet-500 to-purple-600', super_admin: 'from-red-500 to-rose-600' };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col relative z-10">
        <NewsTicker />
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20} /></button>
            <div>
              <h1 className="text-base font-black text-emerald-600">My Profile</h1>
              <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">Manage your account details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-3 py-2 rounded-xl hover:scale-[1.02] transition-all shadow-sm">
              <Edit2 size={13} />Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); }} className="text-xs font-black uppercase text-gray-500 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-3 py-2 rounded-xl hover:scale-[1.02] disabled:opacity-50 transition-all shadow-sm">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <><Save size={13} />Save</>}
              </button>
            </div>
          )}
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>

        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
          className="flex-1 px-4 md:px-6 py-6 max-w-3xl mx-auto w-full space-y-5">

          {/* Avatar & role */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 border border-emerald-100/30 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${roleColor[user?.role] || 'from-emerald-500 to-blue-600'} flex items-center justify-center text-white text-2xl font-black shadow-md`}>
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-black text-blue-900">{user?.firstName} {user?.middleName} {user?.lastName}</h2>
              <p className="text-xs text-blue-900/50 font-medium">{user?.email}</p>
              <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${roleColor[user?.role] || 'from-emerald-500 to-blue-600'} mt-1`}>
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </motion.div>

          {/* Personal details */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}
            className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wide mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { k: 'firstName', label: 'First Name', icon: User },
                { k: 'middleName', label: 'Middle Name', icon: User },
                { k: 'lastName', label: 'Last Name', icon: User },
                { k: 'phone', label: 'Phone', icon: Phone },
                { k: 'location', label: 'Location', icon: MapPin },
                { k: 'rollNumber', label: 'Roll Number', icon: Tag },
              ].map(({ k, label, icon: Icon }) => (
                <div key={k}>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/40 mb-1">{label}</label>
                  {editing ? (
                    <div className="relative">
                      <Icon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={label}
                        className="w-full pl-8 pr-3 py-2 text-xs font-medium border border-emerald-100/40 rounded-xl focus:outline-none focus:border-emerald-400 transition-all" />
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-blue-900 px-3 py-2 bg-emerald-50/40 rounded-xl">{form[k] || '—'}</p>
                  )}
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/40 mb-1">Bio</label>
                {editing ? (
                  <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={2} placeholder="Write about yourself..."
                    className="w-full px-3 py-2 text-xs font-medium border border-emerald-100/40 rounded-xl focus:outline-none focus:border-emerald-400 transition-all resize-none" />
                ) : (
                  <p className="text-xs font-medium text-blue-900/70 px-3 py-2 bg-emerald-50/40 rounded-xl">{form.bio || '—'}</p>
                )}
              </div>
            </div>
            {(user?.role === 'student' || user?.role === 'developer') && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {[{ k: 'branch', label: 'Branch', opts: BRANCHES }, { k: 'semester', label: 'Semester', opts: SEMESTERS.map(String) }].map(({ k, label, opts }) => (
                  <div key={k}>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/40 mb-1">{label}</label>
                    {editing ? (
                      <select value={form[k]} onChange={e => set(k, e.target.value)}
                        className="w-full text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all">
                        <option value="">Select {label}</option>
                        {opts.map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <p className="text-xs font-bold text-blue-900 px-3 py-2 bg-emerald-50/40 rounded-xl">{form[k] || '—'}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Skills */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}
            className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wide mb-3">Skills</h3>
            {editing && (
              <div className="flex gap-2 mb-3">
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                  placeholder="Add skill (press Enter)"
                  className="flex-1 text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all" />
                <button onClick={() => addSkill(skillInput)} className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(form.skills || []).map(s => (
                <span key={s} className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  {s}
                  {editing && <button onClick={() => removeSkill(s)} className="hover:text-red-500 transition-colors ml-0.5"><X size={9} /></button>}
                </span>
              ))}
              {form.skills?.length === 0 && <p className="text-xs text-blue-900/30 font-medium">No skills added yet</p>}
            </div>
            {editing && (
              <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-emerald-50">
                {SKILL_SUGGESTIONS.filter(s => !form.skills.includes(s)).slice(0, 10).map(s => (
                  <button key={s} onClick={() => addSkill(s)} className="text-[8px] font-bold bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full hover:border-emerald-300 hover:text-emerald-600 transition-all">
                    +{s}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Change Password */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}
            className="bg-white/95 border border-emerald-100/30 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wide mb-4">Change Password</h3>
            <form onSubmit={handlePwdChange} className="space-y-3">
              {[
                { k: 'current', label: 'Current Password', value: pwd.current },
                { k: 'newPwd', label: 'New Password', value: pwd.newPwd },
                { k: 'confirm', label: 'Confirm New Password', value: pwd.confirm },
              ].map(({ k, label, value }) => (
                <div key={k}>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/40 mb-1">{label}</label>
                  <div className="relative">
                    <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" value={value} onChange={e => setPwd(p => ({ ...p, [k]: e.target.value }))} required
                      className="w-full pl-8 pr-3 py-2 text-xs font-medium border border-emerald-100/40 rounded-xl focus:outline-none focus:border-emerald-400 transition-all" />
                  </div>
                </div>
              ))}
              <button type="submit" disabled={pwdLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] disabled:opacity-50 transition-all shadow-md">
                {pwdLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Update Password'}
              </button>
            </form>
          </motion.div>

          {/* Danger Zone */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25 }}
            className="bg-red-50/50 border border-red-200/60 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-black text-red-600 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <AlertTriangle size={13} />Danger Zone
            </h3>
            <p className="text-[11px] text-red-500/70 font-medium mb-4">
              Deleting your account is permanent and cannot be undone. Your listings, resources, and history will be removed.
            </p>
            <button onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-red-500 hover:bg-red-600 px-4 py-2.5 rounded-xl transition-colors">
              <Trash2 size={12} />Delete My Account
            </button>
          </motion.div>
        </motion.main>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

const DeleteAccountModal = ({ onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const canDelete = password.length > 0 && confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!canDelete) return;
    setLoading(true);
    try {
      await deleteMyAccount(password);
      toast.success('Your account has been deleted');
      await logout();
      navigate('/');
    } catch (e) {
      toast.error(e.message || 'Could not delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: .95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-black text-red-600 flex items-center gap-1.5"><AlertTriangle size={15} />Delete Account</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <p className="text-xs text-blue-900/50 font-medium mb-4">This is permanent. Enter your password and type DELETE to confirm.</p>

        <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/40 mb-1">Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 text-xs font-medium border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-red-300 transition-all mb-3" />

        <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/40 mb-1">Type DELETE to confirm</label>
        <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="DELETE"
          className="w-full px-3 py-2 text-xs font-medium border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-red-300 transition-all mb-4" />

        <button onClick={handleDelete} disabled={!canDelete || loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white text-xs font-black uppercase hover:bg-red-600 disabled:opacity-40 transition-colors">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Permanently Delete My Account
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Profile;
