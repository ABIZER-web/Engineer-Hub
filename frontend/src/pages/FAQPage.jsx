// frontend/src/pages/FAQPage.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft, ChevronDown, Search, Mail } from 'lucide-react';

const FAQ_DATA = [
  {
    category: 'Getting Started',
    items: [
      { q: 'What is Engineer Hub?', a: 'A platform built for Mumbai University engineering students covering attendance tracking, a project marketplace, freelancing, study resources, results/CGPA tracking, and placement drives — all in one place.' },
      { q: 'Who can create an account?', a: 'Any engineering student, developer, or authorized staff member can register. Admin and super-admin roles require a valid passcode provided by your institution — regular students never need one.' },
      { q: 'How do I switch between dark and light mode?', a: 'Tap the sun/moon icon in the header on any page. Your choice is remembered for next time.' },
    ],
  },
  {
    category: 'Attendance & Results',
    items: [
      { q: 'Is the attendance tracker official?', a: "No — it's a personal tool to help you estimate your percentage and figure out how many lectures you can safely miss while staying above 75%. Always confirm your real attendance with your institution." },
      { q: 'How is my SGPA/CGPA calculated?', a: "SGPA is credit-weighted: (credits × grade point) summed across subjects, divided by total credits, using India's standard 10-point scale (O=10 down to F=0). CGPA is the same calculation across all your approved semesters combined." },
      { q: 'Why is my result still "pending"?', a: 'All submitted results go through admin review before your SGPA counts toward your CGPA. This prevents fabricated grades — check back after an admin approves it, or edit and resubmit if it was rejected.' },
    ],
  },
  {
    category: 'Marketplace',
    items: [
      { q: 'How much does it cost to sell on the marketplace?', a: 'A 5% platform fee applies to each sale. If you sell a project for ₹500, you receive ₹475 in your earnings balance.' },
      { q: 'Why isn\'t my listing showing up yet?', a: 'Every listing goes through admin review before it appears publicly — this keeps the marketplace free of spam and low-quality submissions. You\'ll get a notification the moment it\'s approved or rejected (with a reason, if rejected).' },
      { q: 'Can I message a seller before buying?', a: 'Yes — open any listing and tap "Message" to start a real conversation with the seller.' },
      { q: 'How do I leave a review?', a: 'Once your purchase is marked completed, go to My Purchases and tap "Rate" on that order. You can only review items you\'ve actually bought.' },
    ],
  },
  {
    category: 'Freelancing',
    items: [
      { q: 'How does bidding work?', a: 'Post a project (it goes through admin review first), then freelancers submit bids with their price and timeline. You review bids under "My Posted Projects" and accept one — the rest are automatically marked as not selected.' },
      { q: 'When can I rate a freelancer?', a: 'After you mark the project as completed, a "Rate the freelancer" option appears on that project.' },
      { q: 'What happens to my other bids after I accept one?', a: "They're automatically marked as unsuccessful, and each bidder gets a notification so they're not left wondering." },
    ],
  },
  {
    category: 'Study Resources',
    items: [
      { q: 'Can anyone upload notes and resources?', a: 'Yes, any student can upload — subject to the same admin review as marketplace listings and freelance projects, to keep the library reliable and spam-free.' },
      { q: 'What file types can I share?', a: "You share a link to your file (Google Drive, GitHub, etc.) rather than uploading a raw file directly — this keeps things simple and works with whatever cloud storage you already use." },
    ],
  },
  {
    category: 'Placements & Internships',
    items: [
      { q: 'How do I find out about new drives?', a: 'You\'ll get an in-app notification, email, and push notification (if enabled) the moment a new placement or internship matching your branch is posted — no need to keep checking manually.' },
      { q: 'Who posts placement drives?', a: 'Admins post them, often with a poster image from the company. Students browse and apply directly via the link provided.' },
    ],
  },
  {
    category: 'Payments & Withdrawals',
    items: [
      { q: 'How do I get paid for a sale or freelance project?', a: 'Earnings accumulate in your account. Add your UPI ID in your profile, then request a withdrawal — an admin reviews and processes it, and you\'ll be notified (in-app, email, and push) at every status change.' },
      { q: 'Is my UPI ID safe?', a: "Only you can change your own UPI ID — even other logged-in users can't edit it, by design. We never see or store your UPI PIN." },
    ],
  },
  {
    category: 'Notifications & Privacy',
    items: [
      { q: 'How do push notifications work?', a: 'Tap "Enable push" in the notification bell dropdown. You\'ll get real browser notifications for bids, approvals, messages, and withdrawals — even when the tab is closed.' },
      { q: 'Can I delete my account?', a: 'Yes — go to Profile → Danger Zone. You\'ll need to confirm your password and type "DELETE". This permanently removes your account (super-admin accounts require another super-admin to do this instead).' },
      { q: 'How do I report a suspicious listing?', a: 'Tap the flag icon on any marketplace item, resource, or freelance project. Our team reviews every report and can take the listing down if it violates our terms.' },
    ],
  },
];

const FAQPage = () => {
  const navigate = useNavigate();
  const [openKey, setOpenKey] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return FAQ_DATA;
    const q = search.toLowerCase();
    return FAQ_DATA
      .map(cat => ({ ...cat, items: cat.items.filter(i => i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q)) }))
      .filter(cat => cat.items.length > 0);
  }, [search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/20 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-blue-900/50 hover:text-emerald-600 transition-colors mb-6">
          <ArrowLeft size={16} />Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 border border-emerald-100/30 rounded-3xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <HelpCircle size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-emerald-600">Help & FAQ</h1>
              <p className="text-xs text-blue-900/40 font-medium">Answers about how Engineer Hub actually works</p>
            </div>
          </div>

          <div className="relative mb-6">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search FAQs..."
              className="w-full pl-9 pr-3 py-2.5 text-sm font-medium border border-emerald-100/50 rounded-xl bg-gray-50 focus:outline-none focus:border-emerald-300 transition-all" />
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-blue-900/40 font-medium text-center py-10">No results for "{search}"</p>
          ) : filtered.map(cat => (
            <div key={cat.category} className="mb-6">
              <h2 className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-2">{cat.category}</h2>
              <div className="space-y-2">
                {cat.items.map(item => {
                  const key = `${cat.category}-${item.q}`;
                  const isOpen = openKey === key;
                  return (
                    <div key={key} className="border border-emerald-100/40 rounded-xl overflow-hidden">
                      <button onClick={() => setOpenKey(isOpen ? null : key)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-emerald-50/30 transition-colors">
                        <span className="text-sm font-bold text-blue-900">{item.q}</span>
                        <ChevronDown size={15} className={`text-blue-900/30 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden">
                            <p className="px-4 pb-3 text-sm text-blue-900/60 font-medium leading-relaxed">{item.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-8 pt-6 border-t border-emerald-50 text-center">
            <p className="text-xs text-blue-900/40 font-medium mb-2">Still need help?</p>
            <a href="mailto:admin@engineerhub.in" className="inline-flex items-center gap-1.5 text-sm font-black text-emerald-600 hover:underline">
              <Mail size={14} />admin@engineerhub.in
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQPage;
