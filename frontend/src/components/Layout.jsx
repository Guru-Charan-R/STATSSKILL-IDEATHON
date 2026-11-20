import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import Chatbot from './Chatbot.jsx';
import GlobalTranslator from './GlobalTranslator.jsx';

export default function Layout({ children }) {
  const location = useLocation();

  useEffect(() => {
    const root = document.querySelector('main') || document.body;
    const targets = Array.from(root.querySelectorAll('section, .card-soft-shadow, [data-reveal]'));
    targets.forEach(el => el.classList.add('reveal'));
    // stagger siblings
    targets.forEach((el, i) => {
      const delay = Math.min((i % 6) * 80, 400);
      el.style.transitionDelay = `${delay}ms`;
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    targets.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [location.pathname]);

  return (
    <div className="min-h-screen antialiased text-slate-800 transition-colors duration-300">
      <Header />
      <main>{children ? children : <Outlet />}</main>
      <Footer />
      <Chatbot />
      <GlobalTranslator />
    </div>
  );
}