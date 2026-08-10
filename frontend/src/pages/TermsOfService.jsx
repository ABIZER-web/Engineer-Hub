// frontend/src/pages/TermsOfService.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div className="mb-6">
    <h2 className="text-base font-black text-emerald-600 mb-2">{title}</h2>
    <div className="text-sm font-medium text-blue-900/70 leading-relaxed space-y-2">{children}</div>
  </div>
);

const TermsOfService = () => {
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
              <FileText size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-emerald-600">Terms of Service</h1>
              <p className="text-xs text-blue-900/40 font-medium">Last updated: July 2026</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
            <p className="text-[11px] font-bold text-amber-700">
              This is a template, not a legally reviewed contract. Have a lawyer review it before relying on it — especially
              the marketplace payment and liability sections, given real money changes hands on this platform.
            </p>
          </div>

          <Section title="1. Acceptance of Terms">
            <p>By creating an account on Engineer Hub, you agree to these terms. If you don't agree, please don't use the platform.</p>
          </Section>

          <Section title="2. Who Can Use Engineer Hub">
            <p>Engineer Hub is built for engineering students, developers, and staff affiliated with the platform. You must provide accurate information when registering and are responsible for keeping your account credentials secure. Admin and super-admin roles require a valid passcode and are intended for authorized staff only.</p>
          </Section>

          <Section title="3. Marketplace & Freelance Transactions">
            <ul className="list-disc pl-5 space-y-1">
              <li>Sellers are responsible for the accuracy, originality, and legality of what they list — plagiarized or infringing content is not allowed</li>
              <li>All listings, resources, and freelance projects go through admin review before appearing publicly; approval doesn't guarantee quality or fitness for a particular purpose</li>
              <li>Payments are processed via UPI, arranged directly between buyer and seller / client and freelancer; Engineer Hub is not a party to that payment and doesn't guarantee delivery or refunds</li>
              <li>A platform fee applies to marketplace sales as shown at checkout, with the remainder credited to the seller's earnings for withdrawal</li>
              <li>Withdrawal requests are reviewed and processed by admins; processing times aren't guaranteed</li>
            </ul>
          </Section>

          <Section title="4. Content You Post">
            <p>You retain ownership of content you upload (listings, resources, projects, reviews, testimonials). By posting, you grant Engineer Hub a license to display it on the platform. You're responsible for what you post — don't upload anything that's illegal, infringing, or violates another student's rights.</p>
          </Section>

          <Section title="5. Prohibited Conduct">
            <ul className="list-disc pl-5 space-y-1">
              <li>Posting spam, scams, or fraudulent listings</li>
              <li>Impersonating another person or misrepresenting your affiliation</li>
              <li>Attempting to bypass admin moderation, rate limits, or access controls</li>
              <li>Fabricating academic results, attendance, or reviews</li>
              <li>Harassing, threatening, or posting inappropriate content about other users</li>
            </ul>
            <p>Violations may result in content removal, account suspension, or termination. Use the report feature on any listing to flag content that breaks these rules.</p>
          </Section>

          <Section title="6. Academic Data">
            <p>Attendance and results features are self-reported tools for your own tracking (e.g. an unofficial 75%-attendance calculator, SGPA/CGPA estimation). They are not official university records and shouldn't be relied on as such — always confirm against your institution's official systems.</p>
          </Section>

          <Section title="7. Account Suspension & Termination">
            <p>We may suspend or terminate accounts that violate these terms, engage in fraud, or pose a risk to other users. You can request deletion of your own account at any time by contacting us.</p>
          </Section>

          <Section title="8. Disclaimer & Limitation of Liability">
            <p>Engineer Hub is provided "as is" without warranties of any kind. We don't guarantee the accuracy of user-submitted content, the outcome of marketplace transactions, or uninterrupted availability. To the extent permitted by law, Engineer Hub isn't liable for indirect, incidental, or consequential damages arising from your use of the platform.</p>
          </Section>

          <Section title="9. Changes to These Terms">
            <p>We may update these terms from time to time. Continued use of the platform after changes means you accept the updated terms. Material changes will be flagged with an updated date above.</p>
          </Section>

          <Section title="10. Contact">
            <p>Questions about these terms? Email <a href="mailto:admin@engineerhub.in" className="text-emerald-600 underline">admin@engineerhub.in</a></p>
          </Section>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;
