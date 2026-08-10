// frontend/src/pages/NotFoundPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-blue-50/20 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 border border-emerald-100/30 rounded-3xl shadow-2xl p-10 max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-t-3xl" />
        <motion.div animate={{ rotate: [0, 10, -10, 10, 0] }} transition={{ duration: 0.6, delay: 0.3 }}
          className="text-7xl mb-6">🔍</motion.div>
        <h1 className="text-5xl font-black text-emerald-600 mb-2">404</h1>
        <h2 className="text-lg font-black text-blue-900 mb-3">Page Not Found</h2>
        <p className="text-sm font-medium text-blue-900/50 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-all">
            <ArrowLeft size={15} />Back
          </button>
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-black text-sm uppercase tracking-wider hover:scale-[1.02] transition-all shadow-md">
            <Home size={15} />Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
