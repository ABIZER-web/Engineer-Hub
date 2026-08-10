// frontend/src/components/ScrollToTopButton.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-[500] w-11 h-11 rounded-2xl
            bg-white/90 backdrop-blur-md border border-emerald-200/60
            shadow-lg shadow-emerald-500/10 flex items-center justify-center
            hover:scale-110 hover:shadow-emerald-500/20 hover:border-emerald-400/60
            active:scale-95 transition-all duration-200 group"
        >
          <ChevronUp
            size={18}
            className="text-emerald-600 group-hover:text-emerald-700 transition-colors"
            strokeWidth={2.5}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTopButton;
