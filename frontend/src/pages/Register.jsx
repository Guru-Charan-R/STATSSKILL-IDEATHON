import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'trainee', department: '', region: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await register(form);
      const path = user.role === 'admin' ? '/admin' : user.role === 'trainer' ? '/trainer' : '/trainee';
      navigate(path);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white rounded-3xl p-8 border border-slate-200 card-soft-shadow">
      <h1 className="text-2xl font-extrabold text-slate-900 font-display mb-2">{t('registerTitle')}</h1>
      <p className="text-sm text-slate-500 mb-6">{t('registerSubtitle')}</p>
      {error && <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Full name" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
        <input value={form.email} onChange={e=>set('email',e.target.value)} type="email" placeholder="Email" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
        <input value={form.password} onChange={e=>set('password',e.target.value)} type="password" placeholder="Password" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
        <select value={form.role} onChange={e=>set('role',e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500">
          <option value="trainee">Trainee</option>
          <option value="trainer">Trainer</option>
        </select>
        <input value={form.department} onChange={e=>set('department',e.target.value)} placeholder="Department" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
        <input value={form.region} onChange={e=>set('region',e.target.value)} placeholder="Region" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
        <button disabled={loading} className="w-full py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500 disabled:opacity-50">{loading ? 'Creating...' : 'Create account'}</button>
      </form>
      <p className="mt-4 text-xs text-slate-500">{t('haveAccount')} <Link to="/login" className="text-cyan-600 hover:underline">{t('login')}</Link></p>
    </div>
  );
}