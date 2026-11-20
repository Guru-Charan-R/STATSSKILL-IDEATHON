import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export default function Profile() {
  const { user } = useAuth();
  const { t } = useSettings();
  const [me, setMe] = useState(null);
  useEffect(() => { api.get('/auth/me').then(r => setMe(r.data.user)); }, []);
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-slate-900 font-display mb-4">{t('profileTitle')}</h1>
      <div className="bg-white rounded-2xl p-6 border border-slate-200 card-soft-shadow space-y-2 text-sm">
        <div><span className="font-semibold text-slate-700">Name:</span> {me?.name || user?.name}</div>
        <div><span className="font-semibold text-slate-700">Email:</span> {me?.email || user?.email}</div>
        <div><span className="font-semibold text-slate-700">Role:</span> {me?.role || user?.role}</div>
        <div><span className="font-semibold text-slate-700">Department:</span> {me?.department || '—'}</div>
        <div><span className="font-semibold text-slate-700">Region:</span> {me?.region || '—'}</div>
        <div><span className="font-semibold text-slate-700">Designation:</span> {me?.designation || '—'}</div>
      </div>
    </div>
  );
}