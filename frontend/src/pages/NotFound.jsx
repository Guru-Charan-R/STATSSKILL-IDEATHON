import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';

export default function NotFound() {
  const { t } = useSettings();
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-extrabold text-slate-900 font-display">404</h1>
      <p className="text-slate-500 mt-2">{t('notFound')}</p>
      <Link to="/" className="inline-block mt-4 text-cyan-600 hover:underline">{t('goHome')}</Link>
    </div>
  );
}