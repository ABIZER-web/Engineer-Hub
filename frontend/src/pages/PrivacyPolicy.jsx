// frontend/src/pages/PrivacyPolicy.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div className="mb-6">
    <h2 className="text-base font-black text-emerald-600 mb-2">{title}</h2>
    <div className="text-sm font-medium text-blue-900/70 leading-relaxed space-y-2">{children}</div>
  </div>
);

const PrivacyPolicy = () => {
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
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-emerald-600">Privacy Policy</h1>
              <p className="text-xs text-blue-900/40 font-medium">Last updated: July 2026</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
            <p className="text-[11px] font-bold text-amber-700">
              This is a template covering what Engineer Hub actually collects and does. It hasn't been reviewed by a lawyer —
              have one look it over before relying on it for a real, live platform, especially given it handles payment details and academic records.
            </p>
          </div>

          <Section title="What We Collect">
            <p><strong>Account info:</strong> name, email, password (hashed, never stored in plain text), branch, semester, roll number, profile photo, bio, phone number.</p>
            <p><strong>Academic data:</strong> attendance records you log, exam results and grades you submit for admin review.</p>
            <p><strong>Financial info:</strong> your UPI ID (for receiving marketplace/freelance earnings), transaction and withdrawal history. We never see or store your bank password, card numbers, or UPI PIN.</p>
            <p><strong>Content you create:</strong> marketplace listings, study resources, freelance projects and bids, reviews, testimonials, reports you file.</p>
            <p><strong>Technical data:</strong> IP address and browser type (for security and rate-limiting), cookies (see our Cookie Policy), and — if you enable them — push notification credentials.</p>
          </Section>

          <Section title="How We Use It">
            <ul className="list-disc pl-5 space-y-1">
              <li>To run your account: authentication, showing your dashboard, processing purchases and payouts</li>
              <li>To notify you: order updates, bid activity, withdrawal status, placement drives — via in-app alerts, email, and (if enabled) push notifications</li>
              <li>To keep the platform safe: reviewing reported listings, moderating submissions, rate-limiting abuse</li>
              <li>To improve the product: understanding which features get used (only with your cookie consent for analytics)</li>
            </ul>
            <p>We do not sell your personal data to advertisers or third parties.</p>
          </Section>

          <Section title="Who We Share It With">
            <p>Only where necessary to run the platform:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Other students</strong> see your name, branch, and marketplace/freelance activity when relevant (e.g. a seller's name on their listing)</li>
              <li><strong>Admins</strong> can view submitted content for moderation purposes (approvals, reports, withdrawals)</li>
              <li><strong>Service providers</strong> we rely on to run the app: our database host, email delivery provider, and hosting infrastructure — each only gets what they need to do their job</li>
            </ul>
            <p>We don't share your data with anyone else without telling you, except where required by law.</p>
          </Section>

          <Section title="How Long We Keep It">
            <p>Your account data stays as long as your account is active. In-app notifications are automatically deleted 60 days after they're read. If you delete your account, we remove your personal data within a reasonable period, except where we're required to retain records (e.g. transaction history for financial/legal reasons).</p>
          </Section>

          <Section title="Your Rights">
            <ul className="list-disc pl-5 space-y-1">
              <li>Access or update your profile information any time from your account settings</li>
              <li>Request a copy of your data or ask us to delete your account by contacting us</li>
              <li>Opt out of non-essential cookies via the cookie banner</li>
              <li>Disable push notifications any time from the notification bell</li>
            </ul>
          </Section>

          <Section title="Security">
            <p>Passwords are hashed with bcrypt and never stored or transmitted in plain text. Sessions use httpOnly cookies, which JavaScript can't read — this protects you even if a malicious script ever ran on the site. We use rate-limiting, input validation, and role-based access controls throughout the platform.</p>
          </Section>

          <Section title="Children's Privacy">
            <p>Engineer Hub is built for engineering college students and isn't intended for children under 13. If you believe a child has provided us data, contact us and we'll remove it.</p>
          </Section>

          <Section title="Changes to This Policy">
            <p>If we make material changes, we'll update the date at the top of this page and, for significant changes, notify you in-app.</p>
          </Section>

          <Section title="Contact">
            <p>Questions about your data? Email <a href="mailto:admin@engineerhub.in" className="text-emerald-600 underline">admin@engineerhub.in</a></p>
          </Section>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
