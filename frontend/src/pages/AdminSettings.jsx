// frontend/src/pages/AdminSettings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getAllSettings, bulkUpdateSettings } from '../services/api';
import Sidebar from '../components/Sidebar';
import NewsTicker from '../components/NewsTicker';
import {
  Menu, Settings, Save, Loader2, RefreshCw,
  AlertTriangle, Shield, Globe, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import GlobalSearch from '../components/GlobalSearch';
import ThemeToggle from '../components/ThemeToggle';
import NotificationBell from '../components/NotificationBell';

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${checked ? 'bg-gradient-to-r from-emerald-500 to-blue-600' : 'bg-gray-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
  </button>
);

const SettingRow = ({ label, desc, children }) => (
  <div className="flex items-center justify-between py-3.5 border-b border-emerald-50 last:border-0">
    <div className="flex-1 min-w-0 mr-4">
      <p className="text-xs font-black text-blue-900">{label}</p>
      {desc && <p className="text-[10px] text-blue-900/40 font-medium mt-0.5">{desc}</p>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

const AdminSettings = () => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState({});
  const isMounted = useRef(true);

  const fetchSettings = async () => {
    try {
      const r = await getAllSettings();
      if (!isMounted.current) return;
      setSettings(r.settings || {});
      setLocalSettings(r.settings || {});
    } catch (e) {
      toast.error('Failed to load settings');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchSettings();
    return () => { isMounted.current = false; };
  }, []);

  const set = (key, value) => setLocalSettings(p => ({ ...p, [key]: value }));

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await bulkUpdateSettings({ settings: localSettings });
      setSettings({ ...localSettings });
      toast.success('Settings saved successfully!');
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(localSettings);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-blue-50/10">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col">
        <NewsTicker />
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100/30 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-emerald-50"><Menu size={20} /></button>
            <div>
              <h1 className="text-base font-black text-emerald-600">Platform Settings</h1>
              <p className="text-[10px] font-medium text-blue-900/50 hidden sm:block">System configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <button onClick={fetchSettings} className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><RefreshCw size={16} /></button>
            {hasChanges && (
              <button onClick={handleSaveAll} disabled={saving}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-3 py-2 rounded-xl hover:scale-[1.02] disabled:opacity-50 transition-all shadow-sm">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Save Changes
              </button>
            )}
          </div>
            <GlobalSearch /><ThemeToggle /><NotificationBell />
          </div>
        </div>

        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}
          className="flex-1 px-4 md:px-6 py-6 max-w-3xl mx-auto w-full space-y-5">

          {/* Platform Settings */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}
            className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-emerald-50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Globe size={17} className="text-white" />
              </div>
              <h3 className="text-sm font-black text-blue-900">Platform Configuration</h3>
            </div>
            <div className="px-5 py-2">
              {[
                { key: 'platformName', label: 'Platform Name', desc: 'Shown in header and emails', type: 'text', placeholder: 'Engineer Hub' },
                { key: 'contactEmail', label: 'Contact Email', desc: 'Support contact address', type: 'email', placeholder: 'admin@engineerhub.in' },
              ].map(({ key, label, desc, type, placeholder }) => (
                <SettingRow key={key} label={label} desc={desc}>
                  <input type={type} value={localSettings[key] || ''} onChange={e => set(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-48 text-xs font-medium border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all text-right" />
                </SettingRow>
              ))}
              <SettingRow label="Allow Registration" desc="New users can create accounts">
                <Toggle checked={localSettings.allowRegistration !== false} onChange={v => set('allowRegistration', v)} />
              </SettingRow>
            </div>
          </motion.div>

          {/* Financial Settings */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}
            className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-emerald-50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <DollarSign size={17} className="text-white" />
              </div>
              <h3 className="text-sm font-black text-blue-900">Financial Settings</h3>
            </div>
            <div className="px-5 py-2">
              {[
                { key: 'platformFee', label: 'Platform Fee (%)', desc: 'Deducted from each sale', min: 0, max: 50 },
                { key: 'minWithdrawal', label: 'Min Withdrawal (₹)', desc: 'Minimum payout request amount', min: 50, max: 10000 },
                { key: 'maxUploadMB', label: 'Max Upload Size (MB)', desc: 'Maximum file upload limit', min: 1, max: 100 },
              ].map(({ key, label, desc, min, max }) => (
                <SettingRow key={key} label={label} desc={desc}>
                  <input type="number" value={localSettings[key] ?? ''} onChange={e => set(key, Number(e.target.value))}
                    min={min} max={max}
                    className="w-24 text-xs font-bold border border-emerald-100/40 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400 transition-all text-center" />
                </SettingRow>
              ))}
            </div>
          </motion.div>

          {/* Security Settings */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}
            className="bg-white/95 border border-emerald-100/30 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-emerald-50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Shield size={17} className="text-white" />
              </div>
              <h3 className="text-sm font-black text-blue-900">Security & Access</h3>
            </div>
            <div className="px-5 py-2">
              <SettingRow label="Require Email Verification" desc="Users must verify email before accessing dashboard">
                <Toggle checked={!!localSettings.requireEmailVerification} onChange={v => set('requireEmailVerification', v)} />
              </SettingRow>
              <SettingRow label="Rate Limiting Active" desc="Protects against brute-force attacks">
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Always ON</span>
              </SettingRow>
            </div>
          </motion.div>

          {/* Save button */}
          {hasChanges && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200/60 rounded-2xl">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
              <p className="text-xs font-bold text-blue-900/70 flex-1">You have unsaved changes.</p>
              <button onClick={handleSaveAll} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] disabled:opacity-50 transition-all shadow-md">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Save All Changes
              </button>
            </motion.div>
          )}
        </motion.main>
      </div>
    </div>
  );
};

export default AdminSettings;
