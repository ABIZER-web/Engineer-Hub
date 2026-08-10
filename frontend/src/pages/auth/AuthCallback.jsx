// frontend/src/pages/auth/AuthCallback.jsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token  = params.get('token');
    const userId = params.get('userId');
    const error  = params.get('error');

    if (error || !token) {
      navigate('/auth?error=auth_failed', { replace: true });
      return;
    }
    localStorage.setItem('token',  token);
    localStorage.setItem('userId', userId || '');
    navigate('/dashboard', { replace: true });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-600 border-r-blue-600 animate-spin" />
        </div>
        <p className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
          Completing sign-in...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
