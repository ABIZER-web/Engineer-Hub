// frontend/src/pages/CookiePolicy.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Cookie, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div className="mb-6">
    <h2 className="text-base font-black text-emerald-600 mb-2">{title}</h2>
    <div className="text-sm font-medium text-blue-900/70 leading-relaxed space-y-2">{children}</div>
  </div>
);

const CookiePolicy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/20 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-blue-900/50 hover:text-emerald-600 transition-colors mb-6">
          <ArrowLeft size={16} />Back
        </button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 border border-emerald-100/30 rounded-3xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Cookie size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-emerald-600">Cookie Policy</h1>
              <p className="text-xs text-blue-900/40 font-medium">Last updated: January 2025</p>
            </div>
          </div>
          <Section title="What Are Cookies?">
            <p>Cookies are small text files stored on your device when you visit Engineer Hub. They help us remember your preferences and keep you logged in.</p>
          </Section>
          <Section title="Cookies We Use">
            <p><strong>Necessary Cookies</strong> — Required for authentication (JWT token) and core functionality. Cannot be disabled.</p>
            <p><strong>Analytics Cookies</strong> — Help us understand how you use the platform so we can improve it. Anonymized data only.</p>
            <p><strong>Preference Cookies</strong> — Remember your settings like theme and sidebar state.</p>
          </Section>
          <Section title="Your Choices">
            <p>You can accept or decline non-essential cookies via our cookie banner. Declining analytics cookies won't affect your ability to use the platform.</p>
          </Section>
          <Section title="Contact">
            <p>Questions? Email us at <a href="mailto:admin@engineerhub.in" className="text-emerald-600 underline">admin@engineerhub.in</a></p>
          </Section>
        </motion.div>
      </div>
    </div>
  );
};

export default CookiePolicy;
