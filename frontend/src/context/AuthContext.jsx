import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

function getStoredUser() {
  const stored = localStorage.getItem('eration_user');
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem('eration_token');
    localStorage.removeItem('eration_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('eration_token'));
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let active = true;
    async function loadMe() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        if (active) setUser(data.data.user);
      } catch {
        localStorage.removeItem('eration_token');
        localStorage.removeItem('eration_user');
        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadMe();
    return () => {
      active = false;
    };
  }, [token]);

  async function login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('eration_token', data.data.token);
    localStorage.setItem('eration_user', JSON.stringify(data.data.user));
    setToken(data.data.token);
    setUser(data.data.user);
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('eration_token', data.data.token);
    localStorage.setItem('eration_user', JSON.stringify(data.data.user));
    setToken(data.data.token);
    setUser(data.data.user);
  }

  function logout() {
    localStorage.removeItem('eration_token');
    localStorage.removeItem('eration_user');
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, loading, isAuthenticated: Boolean(token && user), login, register, logout }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
