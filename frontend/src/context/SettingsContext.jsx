import React, { createContext, useContext, useState, useEffect } from 'react';
import enDict from '../i18n_en.json';
import hiDict from '../i18n_hi.json';
import taDict from '../i18n_ta.json';
import teDict from '../i18n_te.json';
import mlDict from '../i18n_ml.json';

const SettingsContext = createContext(null);

const dict = {
  en: enDict,
  hi: hiDict,
  ta: taDict,
  te: teDict,
  ml: mlDict
};

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
  const [capiMode, setCapiMode] = useState(() => localStorage.getItem('capiMode') === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('capiMode', String(capiMode));
  }, [capiMode]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const toggleCapiMode = () => setCapiMode(v => !v);
  const t = (key) => (dict[language] && dict[language][key]) || dict.en[key] || key;

  return <SettingsContext.Provider value={{ theme, setTheme, toggleTheme, language, setLanguage, capiMode, setCapiMode, toggleCapiMode, t }}>{children}</SettingsContext.Provider>;
}

export function useSettings() { return useContext(SettingsContext); }