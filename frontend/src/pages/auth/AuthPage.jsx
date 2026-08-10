// frontend/src/pages/auth/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import Logo from '../../components/Logo';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import { useAuth } from '../../contexts/AuthContext';
import { BRANCHES, SEMESTERS } from '../../utils/constants';

const InputField = ({ label, type = 'text', value, onChange, placeholder, icon: Icon, error, showToggle, onToggle, showPassword }) => (
  <div>
    <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1.5">{label}</label>
    <div className="relative">
      {Icon && <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />}
      <input
        type={showToggle ? (showPassword ? 'text' : 'password') : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-10' : 'pl-3.5'} ${showToggle ? 'pr-10' : 'pr-3.5'} py-3 text-sm font-medium border rounded-xl focus:outline-none focus:ring-2 transition-all bg-white/80 ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-emerald-100/60 focus:border-emerald-400 focus:ring-emerald-100'}`}
      />
      {showToggle && (
        <button type="button" onClick={onToggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
    </div>
    {error && <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1"><AlertTriangle size={9} />{error}</p>}
  </div>
);

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [regEmail, setRegEmail]   = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [role, setRole]           = useState('student');
  const [passcode, setPasscode]   = useState('');
  const [branch, setBranch]       = useState('');
  const [semester, setSemester]   = useState('');
  const [rollNumber, setRollNumber] = useState('');

  const { login, register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated && user) navigate(from, { replace: true });
  }, [isAuthenticated, user, navigate, from]);

  const validateLogin = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password required';
    else if (password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateRegister = () => {
    const e = {};
    if (!firstName.trim()) e.firstName = 'First name required';
    if (!regEmail.trim()) e.regEmail = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) e.regEmail = 'Invalid email';
    if (!regPassword) e.regPassword = 'Password required';
    else if (regPassword.length < 6) e.regPassword = 'Min 6 characters';
    if ((role === 'admin' || role === 'super_admin') && !passcode) e.passcode = 'Passcode required for admin';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setLoading(true);
    try {
      const res = await login(email.trim().toLowerCase(), password);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setErrors({ general: res.message || 'Login failed. Check your credentials.' });
      }
    } catch (err) {
      setErrors({ general: err.message || 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;
    setLoading(true);
    try {
      const res = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        role,
        passcode: passcode || undefined,
        branch: branch || undefined,
        semester: semester ? parseInt(semester) : undefined,
        rollNumber: rollNumber || undefined,
      });
      if (res.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setErrors({ general: res.message || 'Registration failed.' });
      }
    } catch (err) {
      setErrors({ general: err.message || 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => { setIsLogin(!isLogin); setErrors({}); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-blue-50/20 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient blobs */}
      <div className="absolute top-1/4 -left-24 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" showText={true} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-100/30 overflow-hidden"
        >
          {/* Top gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-blue-600" />

          {/* Tab switcher */}
          <div className="flex border-b border-emerald-50">
            {['Login', 'Register'].map((tab, i) => (
              <button key={tab} onClick={() => { setIsLogin(i === 0); setErrors({}); }}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${(isLogin ? i === 0 : i === 1) ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/40' : 'text-blue-900/40 hover:text-blue-900/70'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="p-7">
            {/* Error banner */}
            <AnimatePresence>
              {errors.general && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 bg-red-50 border border-red-200/60 rounded-xl p-3 mb-5">
                  <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-red-600">{errors.general}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.form key="login" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.25 }} onSubmit={handleLogin} className="space-y-4">
                  <InputField label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com" icon={Mail} error={errors.email} />
                  <InputField label="Password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password" icon={Lock} error={errors.password}
                    showToggle onToggle={() => setShowPassword(!showPassword)} showPassword={showPassword} />

                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-sm font-black uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all shadow-lg shadow-emerald-200/50 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 size={16} className="animate-spin" />Signing in...</> : <>Sign In <ChevronRight size={16} /></>}
                  </button>

                  <p className="text-center text-xs text-blue-900/40 font-medium">
                    Don't have an account?{' '}
                    <button type="button" onClick={switchMode} className="text-emerald-600 font-black hover:underline">Register here</button>
                  </p>
                </motion.form>
              ) : (
                <motion.form key="register" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }} onSubmit={handleRegister} className="space-y-4">

                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="First Name *" value={firstName} onChange={e => setFirstName(e.target.value)}
                      placeholder="Abizer" icon={User} error={errors.firstName} />
                    <InputField label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)}
                      placeholder="Saifee" icon={User} />
                  </div>

                  <InputField label="Email Address *" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                    placeholder="your@email.com" icon={Mail} error={errors.regEmail} />
                  <InputField label="Password *" value={regPassword} onChange={e => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters" icon={Lock} error={errors.regPassword}
                    showToggle onToggle={() => setShowPassword(!showPassword)} showPassword={showPassword} />
                  <PasswordStrengthMeter password={regPassword} />

                  {/* Role selector */}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1.5">I am a</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { val: 'student', label: '🎓 Student' },
                        { val: 'developer', label: '💻 Developer' },
                        { val: 'admin', label: '🛡 Admin' },
                        { val: 'super_admin', label: '👑 Super Admin' },
                      ].map(({ val, label }) => (
                        <button key={val} type="button" onClick={() => setRole(val)}
                          className={`py-2.5 rounded-xl text-xs font-black border transition-all ${role === val ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white border-transparent shadow-md' : 'bg-white border-emerald-100/60 text-blue-900/60 hover:border-emerald-300'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Admin passcode */}
                  {(role === 'admin' || role === 'super_admin') && (
                    <InputField label={`${role === 'super_admin' ? 'Super Admin' : 'Admin'} Passcode *`} type="password"
                      value={passcode} onChange={e => setPasscode(e.target.value)}
                      placeholder="Enter secret passcode" icon={Lock} error={errors.passcode} />
                  )}

                  {/* Student/developer extras */}
                  {(role === 'student' || role === 'developer') && (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Branch</label>
                        <select value={branch} onChange={e => setBranch(e.target.value)}
                          className="w-full text-xs font-medium border border-emerald-100/60 rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-emerald-400 transition-all bg-white/80">
                          <option value="">Select</option>
                          {BRANCHES.map(b => <option key={b}>{b}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Semester</label>
                        <select value={semester} onChange={e => setSemester(e.target.value)}
                          className="w-full text-xs font-medium border border-emerald-100/60 rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-emerald-400 transition-all bg-white/80">
                          <option value="">Sem</option>
                          {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-blue-900/50 mb-1">Roll No.</label>
                        <input value={rollNumber} onChange={e => setRollNumber(e.target.value)} placeholder="Roll"
                          className="w-full text-xs font-medium border border-emerald-100/60 rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-emerald-400 transition-all bg-white/80" />
                      </div>
                    </div>
                  )}

                  <p className="text-center text-[10px] text-blue-900/40 font-medium leading-relaxed">
                    By creating an account, you agree to our{' '}
                    <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold hover:underline">Privacy Policy</a>.
                  </p>

                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-sm font-black uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all shadow-lg shadow-emerald-200/50 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 size={16} className="animate-spin" />Creating Account...</> : <>Create Account <ChevronRight size={16} /></>}
                  </button>

                  <p className="text-center text-xs text-blue-900/40 font-medium">
                    Already have an account?{' '}
                    <button type="button" onClick={switchMode} className="text-emerald-600 font-black hover:underline">Login here</button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <p className="text-center text-[10px] font-medium text-blue-900/30 mt-6">
          Mumbai University Engineering Community Platform
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
