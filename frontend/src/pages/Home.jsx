import React, { useState, useEffect } from 'react';
import { homeHtmlNew } from './homeContentNew.js';
import { homeScripts } from './homeScripts.js';

export default function Home() {
  const [html, setHtml] = useState(homeHtmlNew);

  // inject interactive scripts (role switcher, curricula filter, toast)
  useEffect(() => {
    // remove the DOMContentLoaded wrapper so it runs immediately (React mounts after DOMContentLoaded)
    let code = homeScripts.replace("document.addEventListener('DOMContentLoaded', () => {", '(function(){')
                         .replace(/\n\s*\}\);\n\s*\n\s*\/\/ Role Switcher/, '\n})();\n\n  // Role Switcher');
    const s = document.createElement('script');
    s.textContent = code;
    document.body.appendChild(s);
    return () => { document.body.removeChild(s); };
  }, []);

  // reveal-node observer (design uses .reveal-node class)
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal-node').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [html]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
