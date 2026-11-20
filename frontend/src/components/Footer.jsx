import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-border-subtle py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-space-md">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"></path></svg>
            </div>
            <div>
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold">StatSkill</span>
              <span className="font-headline-sm text-headline-sm text-on-tertiary-container tracking-tight font-semibold">AI</span>
              <span className="block text-label-sm text-on-surface-variant font-semibold tracking-wider">BY CODENIX</span>
            </div>
          </div>
          <div className="text-label-sm text-on-surface-variant text-center md:text-right">
            Official Capacity Building Portal · Team Codenix · SIH26101 · Smart India Hackathon Prototype
          </div>
        </div>
      </div>
    </footer>
  );
}
