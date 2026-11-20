import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [email, setEmail] = useState('trainee@statskill.ai');
  const [password, setPassword] = useState('Trainee@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(email, password);
      const path = user.role === 'admin' ? '/admin' : user.role === 'trainer' ? '/trainer' : '/trainee';
      navigate(path);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const quick = (e, p) => { setEmail(e); setPassword(p); };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white rounded-3xl p-8 border border-slate-200 card-soft-shadow">
      <h1 className="text-2xl font-extrabold text-slate-900 font-display mb-2">{t('loginTitle')}</h1>
      <p className="text-sm text-slate-500 mb-6">{t('loginSubtitle')}</p>
      {error && <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
        <button disabled={loading} className="w-full py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500 disabled:opacity-50">{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <div className="mt-6 text-xs text-slate-500 space-y-1">
        <div className="font-semibold text-slate-700">{t('demoAccounts')}</div>
        <button onClick={()=>quick('admin@statskill.ai','Admin@123')} className="block text-cyan-600 hover:underline">Admin User (admin@statskill.ai)</button>
        <button onClick={()=>quick('trainer@statskill.ai','Trainer@123')} className="block text-cyan-600 hover:underline">Trainer User (trainer@statskill.ai)</button>
        <button onClick={()=>quick('trainee@statskill.ai','Trainee@123')} className="block text-cyan-600 hover:underline">Trainee User (trainee@statskill.ai)</button>
      </div>
      <p className="mt-4 text-xs text-slate-500">{t('noAccount')} <Link to="/register" className="text-cyan-600 hover:underline">{t('register')}</Link></p>
    </div>
  );
}