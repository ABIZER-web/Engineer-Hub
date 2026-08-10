// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe, getCurrentUser, updateUser } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Bootstrap – restore session from the httpOnly auth cookie (never from
  // localStorage — a token sitting in localStorage is readable by any
  // injected script, which defeats the point of an httpOnly cookie).
  useEffect(() => {
    const restore = async () => {
      try {
        const res = await getMe();
        if (res.success) setUser(res.user);
      } catch {
        // no valid session cookie — stay logged out
      }
      setLoading(false);
    };
    restore();
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const res = await apiLogin({ email, password });
      if (res.success) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      const msg = res.message || 'Login failed';
      setError(msg);
      return { success: false, message: msg };
    } catch (e) {
      const msg = e.message || 'Login failed';
      setError(msg);
      return { success: false, message: msg };
    }
  }, []);

  const register = useCallback(async (data) => {
    setError(null);
    try {
      const res = await apiRegister(data);
      if (res.success) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      const msg = res.message || 'Registration failed';
      setError(msg);
      return { success: false, message: msg };
    } catch (e) {
      const msg = e.message || 'Registration failed';
      setError(msg);
      return { success: false, message: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    setUser(null);
    setError(null);
  }, []);

  const updateProfile = useCallback(async (id, data) => {
    try {
      const res = await updateUser(id, data);
      if (res.success) setUser(res.user);
      return res;
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await getCurrentUser(user._id);
      if (res.success) setUser(res.user);
    } catch { /* ignore */ }
  }, [user?._id]);

  const isAdmin      = () => ['admin','super_admin'].includes(user?.role);
  const isSuperAdmin = () => user?.role === 'super_admin';
  const isDeveloper  = () => user?.role === 'developer';
  const isStudent    = () => user?.role === 'student';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      isAuthenticated: !!user,
      role: user?.role || null,
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
      isAdmin,
      isSuperAdmin,
      isDeveloper,
      isStudent,
      currentUser: user,   // alias for legacy code
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
