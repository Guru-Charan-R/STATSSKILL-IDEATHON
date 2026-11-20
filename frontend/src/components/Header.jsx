import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

const LANGS = [
  { value: 'en', label: 'English (India)' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'te', label: 'తెలుగు' },
  { value: 'ml', label: 'മലയാളം' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, language, setLanguage, capiMode, toggleCapiMode, t } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine !== false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const navLink = (to, label) => {
    const active = location.pathname === to;
    return (
      <Link to={to} className={`inline-flex items-center h-full px-space-xs whitespace-nowrap flex-shrink-0 border-b-2 transition-colors text-label-md font-label-md ${active ? 'text-on-surface font-semibold border-on-tertiary-container' : 'text-on-surface-variant border-transparent hover:text-on-surface hover:border-outline-variant'}`}>
        {label}
      </Link>
    );
  };

  const dashboardPath = user ? (user.role === 'admin' ? '/admin' : user.role === 'trainer' ? '/trainer' : '/trainee') : null;

  return (
    <header className="w-full sticky top-0 z-50 bg-surface-pure border-b border-border-subtle shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="w-full bg-surface-container-low border-b border-border-subtle text-label-sm text-on-surface-variant py-1 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs select-none">🏛️</span>
            <span className="font-semibold tracking-wider uppercase text-label-sm">Government of India · MoSPI</span>
            <span className="hidden sm:inline text-label-sm opacity-70">(Prototype · SIH26101)</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleCapiMode} className={`flex items-center gap-1.5 font-semibold transition ${capiMode ? 'text-amber-600' : 'text-on-surface-variant hover:text-on-tertiary-container'}`} title="Simulate a field district with no network connectivity">
              <span className={`relative inline-flex w-6 h-3.5 rounded-full transition ${capiMode ? 'bg-amber-500' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-all ${capiMode ? 'left-3' : 'left-0.5'}`}></span>
              </span>
              <span className="hidden sm:inline tracking-tight text-label-sm">Simulate Offline District Mode</span>
              <span className="sm:hidden tracking-tight text-label-sm">CAPI Mode</span>
            </button>
            <div className={`flex items-center space-x-1.5 font-semibold ${online ? 'text-on-tertiary-container' : 'text-amber-600'}`}>
              <span className="relative flex h-1.5 w-1.5">
                {online && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-accent opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${online ? 'bg-teal-accent' : 'bg-amber-500'}`}></span>
              </span>
              <span className="tracking-tight text-label-sm">{capiMode ? 'District Edge · Offline' : online ? 'System Online' : t('offlineMode')}</span>
            </div>
          </div>
        </div>
      </div>
      {capiMode && (
        <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-900 px-4 sm:px-6 lg:px-8 py-1.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] font-semibold">
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">inventory_2</span> 12 micro-modules compressed · 4.8 MB</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">gps_fixed</span> Geo-tagged survey polygons validated</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">lock</span> Encrypted local queue · 18 records pending</span>
            <Link to="/offline" className="ml-auto underline hover:no-underline">Open CAPI Field Simulator →</Link>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 flex flex-wrap items-center justify-between gap-x-space-md gap-y-0 py-2">
        <Link to="/" className="flex items-center gap-space-sm group flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container shadow-xs">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"></path></svg>
          </div>
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold group-hover:text-on-tertiary-container transition">StatSkill AI</span>
              <span className="hidden sm:inline-flex items-center px-space-xs py-0.5 rounded-full bg-teal-surface border border-on-tertiary-container text-on-tertiary-container font-label-sm text-label-sm">SIH26101</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Codenix · Statistical Capacity Portal</span>
          </div>
        </Link>
        <nav className="hidden lg:flex order-3 w-full items-center gap-3 xl:gap-space-md h-11 overflow-x-auto no-scrollbar border-t border-border-subtle">
          {navLink('/', t('home'))}
          {navLink('/about', t('about'))}
          {navLink('/features', t('features'))}
          {navLink('/videos', t('videos'))}
          {navLink('/courses', t('courses'))}
          {navLink('/documents', t('documents'))}
          {navLink('/quizzes', t('quizzes'))}
          {navLink('/offline', t('offlineLibrary'))}
          {dashboardPath && navLink(dashboardPath, t('dashboard'))}
        </nav>
        <div className="flex items-center gap-space-sm shrink-0 order-2">
          <div className="relative hidden sm:block">
            <select value={language} onChange={e => setLanguage(e.target.value)} className="bg-surface-container-low border border-border-subtle text-on-surface text-label-sm rounded pl-2 pr-6 py-1 font-label-md cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-accent">
              {LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <button aria-label="Toggle Theme" onClick={toggleTheme} className="w-8 h-8 rounded border border-border-subtle bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {theme === 'dark'
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />}
            </svg>
          </button>
          {user ? (
            <div className="flex items-center gap-space-sm">
              <Link to="/profile" className="flex items-center bg-surface-container border border-border-subtle hover:bg-surface-container-high rounded pl-1 pr-2.5 py-0.5 cursor-pointer transition">
                <div className="w-5 h-5 rounded-full bg-teal-accent text-on-teal text-label-sm font-bold flex items-center justify-center">
                  {user.name.split(' ').map(s=>s[0]).join('').slice(0,2)}
                </div>
                <div className="ml-1.5 text-left leading-none">
                  <span className="block text-label-sm font-semibold text-on-surface">{user.name}</span>
                  <span className="text-label-sm text-on-tertiary-container capitalize">{user.role}</span>
                </div>
              </Link>
              <button onClick={() => { logout(); navigate('/'); }} className="text-label-sm font-semibold text-on-surface-variant hover:text-on-tertiary-container">{t('logout')}</button>
            </div>
          ) : (
            <div className="flex items-center gap-space-sm">
              <Link to="/login" className="text-label-md font-semibold text-on-surface hover:text-on-tertiary-container">{t('login')}</Link>
              <Link to="/register" className="px-space-md py-1 rounded text-label-md font-semibold text-on-primary bg-primary hover:opacity-90 transition">{t('register')}</Link>
            </div>
          )}
          <button aria-label="Open Menu" onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-1.5 rounded text-on-surface hover:bg-surface-container">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden border-t border-border-subtle bg-surface-pure px-4 py-3 space-y-2">
          {[
            ['/', t('home')], ['/about', t('about')], ['/features', t('features')], ['/videos', t('videos')],
            ['/courses', t('courses')], ['/documents', t('documents')], ['/quizzes', t('quizzes')],
            ['/offline', t('offlineLibrary')],
          ].map(([to, label]) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)} className="block text-label-md text-on-surface hover:text-on-tertiary-container py-1">{label}</Link>
          ))}
          {dashboardPath && <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="block text-label-md text-on-surface hover:text-on-tertiary-container py-1">{t('dashboard')}</Link>}
        </div>
      )}
    </header>
  );
}
