// frontend/src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isLandingPage = location.pathname === '/';
  const isDashboardRoute = !['/','auth','/cookie-policy','/privacy-policy','/terms-of-service','/faq'].some(p => location.pathname === p || location.pathname.startsWith('/auth'));

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Don't show navbar inside dashboard routes — sidebar handles nav there
  if (isDashboardRoute && isAuthenticated) return null;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || !isLandingPage ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-emerald-100/30' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="focus:outline-none">
          <Logo size="sm" showText />
        </button>

        {/* Desktop links */}
        {isLandingPage && (
          <div className="hidden md:flex items-center gap-6">
            {['Features', 'Why Us'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-sm font-bold text-blue-900/60 hover:text-emerald-600 transition-colors">
                {item}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <button onClick={() => navigate('/dashboard')}
                className="hidden md:flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2.5 rounded-xl hover:scale-[1.02] transition-all shadow-md">
                Dashboard <ChevronRight size={13} />
              </button>
              <button onClick={async () => { await logout(); navigate('/'); }}
                className="hidden md:block text-xs font-bold text-blue-900/50 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 transition-all">
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/auth')}
                className="hidden md:block text-sm font-bold text-blue-900/60 hover:text-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-50 transition-all">
                Login
              </button>
              <button onClick={() => navigate('/auth')}
                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-blue-600 px-4 py-2.5 rounded-xl hover:scale-[1.02] transition-all shadow-md">
                Get Started
              </button>
            </>
          )}

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-xl hover:bg-emerald-50 transition-colors">
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-t border-emerald-100/30 overflow-hidden shadow-lg">
            <div className="px-4 py-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <button onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-50 to-blue-50 text-sm font-black text-emerald-600">
                    Dashboard
                  </button>
                  <button onClick={async () => { await logout(); navigate('/'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { navigate('/auth'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-blue-900/60 hover:bg-emerald-50 transition-colors">
                    Login
                  </button>
                  <button onClick={() => { navigate('/auth'); setIsMenuOpen(false); }}
                    className="w-full text-center px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-sm font-black text-white">
                    Get Started
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
