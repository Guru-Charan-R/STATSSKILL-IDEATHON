import React from 'react';
import { useSettings } from '../context/SettingsContext.jsx';

export default function About() {
  const { t } = useSettings();
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-slate-900 font-display mb-4">{t('aboutTitle')}</h1>
      <p className="text-slate-600 leading-relaxed mb-4">
        StatSkill AI is an AI-enabled competency and capacity building platform for India's Official Statistical System (SIH26101). It identifies skill gaps, recommends personalized learning, generates assessments from official documents, and tracks improvement across Admin, Trainer and Trainee roles.
      </p>
      <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">Eight core modules</h2>
      <ul className="list-disc pl-6 text-slate-600 space-y-1">
        <li>Login Profiles</li>
        <li>Competency Gap Dashboard</li>
        <li>AI Assistance</li>
        <li>Personalised Learning Suggestions</li>
        <li>Quiz and MCQ Generation</li>
        <li>Offline Learning</li>
        <li>Content Upload and Library</li>
        <li>Progress Tracker</li>
      </ul>
      <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">Technology</h2>
      <p className="text-slate-600 leading-relaxed">
        React frontend, Node.js/Express backend, SQLite database, Groq AI for chatbot and MCQ generation, Retrieval-Augmented Generation over uploaded PDFs, and a multilingual YouTube Video Library.
      </p>
    </div>
  );
}