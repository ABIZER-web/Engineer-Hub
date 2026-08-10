import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CookieConsentProvider } from './contexts/CookieConsentContext';
import ProtectedRoute from './components/ProtectedRoute';
import CookieConsent from './components/CookieConsent';
import ScrollToTopButton from './components/ScrollToTopButton';
import { captureException } from './config/sentry';

// ── Lazy pages ─────────────────────────────────────────────────────────────
const LandingPage          = lazy(() => import('./pages/LandingPage'));
const CookiePolicy         = lazy(() => import('./pages/CookiePolicy'));
const PrivacyPolicy        = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService       = lazy(() => import('./pages/TermsOfService'));
const FAQPage              = lazy(() => import('./pages/FAQPage'));
const NotFoundPage         = lazy(() => import('./pages/NotFoundPage'));
const AuthPage             = lazy(() => import('./pages/auth/AuthPage'));
const AuthCallback         = lazy(() => import('./pages/auth/AuthCallback'));
const StudentDashboard     = lazy(() => import('./pages/student/StudentDashboard'));
const DeveloperDashboard   = lazy(() => import('./pages/developer/DeveloperDashboard'));
const AdminDashboard       = lazy(() => import('./pages/admin/AdminDashboard'));
const SuperAdminDashboard  = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const AttendancePage       = lazy(() => import('./pages/common/AttendancePage'));
const ResultsPage          = lazy(() => import('./pages/common/ResultsPage'));
const MarketplacePage      = lazy(() => import('./pages/common/MarketplacePage'));
const FreelancingPage      = lazy(() => import('./pages/common/FreelancingPage'));
const ResourceLibrary      = lazy(() => import('./pages/common/ResourceLibrary'));
const EventsPage           = lazy(() => import('./pages/common/EventsPage'));
const PurchasesPage        = lazy(() => import('./pages/common/PurchasesPage'));
const EarningsPage         = lazy(() => import('./pages/common/EarningsPage'));
const WithdrawalPage       = lazy(() => import('./pages/common/WithdrawalPage'));
const Profile              = lazy(() => import('./pages/common/Profile'));
const TestimonialPage      = lazy(() => import('./pages/common/TestimonialPage'));
const FreelancerProfilePage= lazy(() => import('./pages/FreelancerProfilePage'));
const AdminApproval        = lazy(() => import('./pages/AdminApproval'));
const AdminAnnouncements   = lazy(() => import('./pages/AdminAnnouncements'));
const AdminEarnings        = lazy(() => import('./pages/AdminEarnings'));
const AdminTestimonials    = lazy(() => import('./pages/AdminTestimonials'));
const AdminWithdrawals     = lazy(() => import('./pages/AdminWithdrawals'));
const AdminReports         = lazy(() => import('./pages/AdminReports'));
const PlacementsPage       = lazy(() => import('./pages/common/PlacementsPage'));
const MessagesPage         = lazy(() => import('./pages/common/MessagesPage'));
const AdminSettings        = lazy(() => import('./pages/AdminSettings'));

// ── Page loader ────────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50/30">
    <div className="text-center">
      <div className="relative w-16 h-16 mx-auto mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-600 border-r-blue-600 animate-spin" />
      </div>
      <p className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
        Loading...
      </p>
    </div>
  </div>
);

// ── Error boundary ─────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(e) { return { hasError: true, error: e }; }
  componentDidCatch(e, info) { console.error('App Error:', e); captureException(e, { componentStack: info?.componentStack }); }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-black text-emerald-600 mb-2">Something went wrong</h1>
          <p className="text-xs text-blue-900/50 mb-6 font-mono break-all">{this.state.error?.message}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] transition-all shadow-md">Reload</button>
            <button onClick={() => window.location.href = '/'} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-wider hover:bg-gray-200 transition-all">Home</button>
          </div>
        </div>
      </div>
    );
    return this.props.children;
  }
}

// ── Scroll restore ─────────────────────────────────────────────────────────
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
};

// ── Role-based dashboard router ────────────────────────────────────────────
const DashboardRouter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!user) navigate('/auth', { replace: true }); }, [user, navigate]);
  if (!user) return null;
  if (user.role === 'super_admin') return <SuperAdminDashboard />;
  if (user.role === 'admin')       return <AdminDashboard />;
  if (user.role === 'developer')   return <DeveloperDashboard />;
  return <StudentDashboard />;
};

// ── Inner app (needs AuthContext) ──────────────────────────────────────────
const InnerApp = () => {
  useEffect(() => {
    document.body.style.overflowY = 'auto';
    document.body.style.overflowX = 'hidden';
    if (typeof window.hideLoader === 'function') window.hideLoader();
  }, []);

  return (
    <>
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { background: '#fff', color: '#1e3a8a', fontWeight: 700, fontSize: '12px', border: '1px solid #d1fae5', borderRadius: '12px', boxShadow: '0 4px 24px rgba(5,150,105,0.12)' },
          success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <div className="min-h-screen w-full overflow-x-hidden">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/"              element={<LandingPage />} />
            <Route path="/auth"          element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/faq" element={<FAQPage />} />

            {/* Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />

            {/* Common protected routes */}
            <Route path="/attendance"     element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
            <Route path="/results"        element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
            <Route path="/resources"      element={<ProtectedRoute><ResourceLibrary /></ProtectedRoute>} />
            <Route path="/placements"     element={<ProtectedRoute><PlacementsPage /></ProtectedRoute>} />
            <Route path="/messages"       element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/messages/:conversationId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/events"         element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
            <Route path="/marketplace"    element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
            <Route path="/purchases"      element={<ProtectedRoute><PurchasesPage /></ProtectedRoute>} />
            <Route path="/earnings"       element={<ProtectedRoute><EarningsPage /></ProtectedRoute>} />
            <Route path="/withdrawal"     element={<ProtectedRoute><WithdrawalPage /></ProtectedRoute>} />
            <Route path="/freelancing"    element={<ProtectedRoute><FreelancingPage /></ProtectedRoute>} />
            <Route path="/freelancer/:id" element={<ProtectedRoute><FreelancerProfilePage /></ProtectedRoute>} />
            <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/testimonial"    element={<ProtectedRoute><TestimonialPage /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin/approval"      element={<ProtectedRoute adminOnly><AdminApproval /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute adminOnly><AdminAnnouncements /></ProtectedRoute>} />
            <Route path="/admin/earnings"      element={<ProtectedRoute adminOnly><AdminEarnings /></ProtectedRoute>} />
            <Route path="/admin/testimonials"  element={<ProtectedRoute adminOnly><AdminTestimonials /></ProtectedRoute>} />
            <Route path="/admin/withdrawals"   element={<ProtectedRoute adminOnly><AdminWithdrawals /></ProtectedRoute>} />
            <Route path="/admin/reports"       element={<ProtectedRoute adminOnly><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/settings"      element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
      <CookieConsent />
      <ScrollToTopButton />
    </>
  );
};

// ── Root App ───────────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider>
          <CookieConsentProvider>
            <AuthProvider>
              <InnerApp />
            </AuthProvider>
          </CookieConsentProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
