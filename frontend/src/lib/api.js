import axios from 'axios';

// Local development uses the Vite proxy (/api -> http://localhost:4000).
// Production uses VITE_API_URL, e.g. https://statskill-api.onrender.com/api
export const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const baseURL = API_BASE;

const api = axios.create({ baseURL });
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
export default api;
