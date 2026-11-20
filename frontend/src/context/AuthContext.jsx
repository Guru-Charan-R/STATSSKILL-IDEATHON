import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE } from '../lib/api.js';

const AuthContext = createContext(null);
const API = API_BASE;
const USER_KEY = 'statskill_user';
const receiptKey = (email) => `statskill_receipt_${String(email || '').trim().toLowerCase()}`;

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const skipMeRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Login/register already returned the full user. Also, on serverless a
    // transient /me 404 can occur when this instance has a fresh temporary DB,
    // so never let it wipe a session we already have complete data for.
    if (skipMeRef.current || user) {
      skipMeRef.current = false;
      setLoading(false);
      return;
    }
    axios.get(`${API}/auth/me`)
      .then(r => {
        setUser(r.data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(r.data.user));
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem(USER_KEY);
        setToken(null);
        delete axios.defaults.headers.common['Authorization'];
      })
      .finally(() => setLoading(false));
    // run only when the token changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const persistSession = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    if (data.receipt) localStorage.setItem(receiptKey(data.user.email), data.receipt);
    skipMeRef.current = true;
    setToken(data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => {
    try {
      const r = await axios.post(`${API}/auth/login`, { email, password });
      return persistSession(r.data);
    } catch (err) {
      // A freshly registered user can live only on another serverless instance.
      // Fall back to the server-signed receipt kept in this browser.
      if (err?.response?.status === 401) {
        const receipt = localStorage.getItem(receiptKey(email));
        if (receipt) {
          try {
            const r2 = await axios.post(`${API}/auth/relogin`, { email, password, receipt });
            return persistSession(r2.data);
          } catch {
            // fall through and surface the original login error
          }
        }
      }
      throw err;
    }
  };

  const register = async (payload) => {
    const r = await axios.post(`${API}/auth/register`, payload);
    return persistSession(r.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem(USER_KEY);
    skipMeRef.current = false;
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    // Keep re-auth receipts so a locally known account can log in again even
    // if this lambda instance has a fresh temporary database.
  };

  return <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
