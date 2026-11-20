import React from 'react';
import { useSettings } from '../context/SettingsContext.jsx';

export default function About() {
  const { t } = useSettings();
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-slate-900 font-display mb-4">{t('aboutTitle')}</h1>
      <p className="text-slate-600 leading-relaxed mb-4">
        StatSkill AI is a National Statistical Governance &amp; Simulation Engine for India's Official Statistical System (SIH26101). It is the mandatory pre-deployment gatekeeper: officers rehearse on realistic dirty microdata, pass methodology compliance audits, and earn SHA-256 signed credentials before they are cleared to handle live national datasets. It replaces passive training with measurable bias prevention.
      </p>
      <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">Governance capabilities</h2>
      <ul className="list-disc pl-6 text-slate-600 space-y-1">
        <li>Live Microdata Sandbox — winsorization, GVF imputation and non-response weight recalibration with real-time variance and bias telemetry</li>
        <li>Methodology &amp; Policy Auditor — UNSC Fundamental Principles, SNA 2008 §25.42 and MoSPI TAG citation engine with one-click compliant fixes</li>
        <li>Tamper-Proof Cert Ledger — SHA-256 credential hashes, token registry and live officer-readiness verification</li>
        <li>Offline-First CAPI Field Simulator — compressed micro-modules, geo-tagged polygon validation and encrypted telemetry sync</li>
        <li>RAG document library over MoSPI manuals, NSS schedules and PLFS/CPI methodology notes</li>
        <li>Role-based Admin / Trainer / Trainee governance dashboards</li>
        <li>Multilingual delivery in English, Hindi and Tamil with a readable dark institutional theme</li>
      </ul>
      <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">Technology</h2>
      <p className="text-slate-600 leading-relaxed">
        React frontend, Node.js/Express backend, SQLite database, Groq AI for chatbot and MCQ generation, Retrieval-Augmented Generation over uploaded PDFs, and a multilingual YouTube Video Library.
      </p>
    </div>
  );
}