import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';
import { globalTamil } from '../i18n_global_tamil.js';
import { globalHindi } from '../i18n_global_hindi.js';

const DICTS = { ta: globalTamil, hi: globalHindi };
const SORTED_KEYS = Object.fromEntries(
  Object.entries(DICTS).map(([lang, dict]) => [lang, Object.keys(dict).sort((a, b) => b.length - a.length)])
);

const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA']);
const TRANSLATE_ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
// Keeps the original English so switching languages (or back to English)
// restores the source text instead of stacking translations.
const originals = new WeakMap();
const originalAttrs = new WeakMap();

function translateText(text, lang) {
  const dict = DICTS[lang];
  if (!dict) return null;
  const t = text.trim();
  if (!t) return null;
  if (dict[t]) return text.replace(t, dict[t]);
  let out = text;
  let changed = false;
  SORTED_KEYS[lang].forEach(k => {
    if (out.includes(k)) { out = out.split(k).join(dict[k]); changed = true; }
  });
  return changed ? out : null;
}

function walk(root, lang) {
  if (!root) return;
  const iter = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  let n;
  while ((n = iter.nextNode())) {
    if (!n.nodeValue || !n.nodeValue.trim()) continue;
    const p = n.parentElement;
    if (!p || SKIP.has(p.tagName)) continue;
    if (p.closest('[data-no-translate]')) continue;
    nodes.push(n);
  }
  nodes.forEach(node => {
    const original = originals.has(node) ? originals.get(node) : node.nodeValue;
    if (!originals.has(node)) originals.set(node, original);
    const translated = translateText(original, lang);
    const next = translated || original;
    if (node.nodeValue !== next) node.nodeValue = next;
  });
}

function walkAttrs(root, lang) {
  if (!root) return;
  const iter = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
  let el;
  while ((el = iter.nextNode())) {
    if (SKIP.has(el.tagName) || el.closest('[data-no-translate]')) continue;
    let store = originalAttrs.get(el);
    if (!store) { store = new Map(); originalAttrs.set(el, store); }
    TRANSLATE_ATTRS.forEach(name => {
      if (!el.hasAttribute(name)) return;
      const current = el.getAttribute(name);
      const original = store.has(name) ? store.get(name) : current;
      if (!store.has(name)) store.set(name, original);
      const translated = translateText(original, lang);
      const next = translated || original;
      if (current !== next) el.setAttribute(name, next);
    });
  }
}

export default function GlobalTranslator() {
  const { language } = useSettings();
  const location = useLocation();

  useEffect(() => {
    const run = () => {
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      const footer = document.querySelector('footer');
      [header, main, footer].forEach(root => { walk(root, language); walkAttrs(root, language); });
    };
    const timer = setTimeout(run, 0);

    const observer = new MutationObserver((mutations) => {
      if (mutations.some(m => m.type === 'childList' && m.addedNodes.length)) setTimeout(run, 0);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [language, location.pathname]);

  return null;
}
