import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../lib/api.js';

const AuthContext = createContext(null);
const API = API_BASE;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get(`${API}/auth/me`).then(r => setUser(r.data.user)).catch(() => { localStorage.removeItem('token'); setToken(null); delete axios.defaults.headers.common['Authorization']; }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const r = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('token', r.data.token);
    setToken(r.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`;
    setUser(r.data.user);
    return r.data.user;
  };

  const register = async (payload) => {
    const r = await axios.post(`${API}/auth/register`, payload);
    localStorage.setItem('token', r.data.token);
    setToken(r.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`;
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }