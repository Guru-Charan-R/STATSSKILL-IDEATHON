import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';

export default function TrainerDashboard() {
  const { t } = useSettings();
  const [batches, setBatches] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    api.get('/users/batches').then(r => setBatches(r.data.batches || []));
    api.get('/assessments/gaps').then(r => setGaps(r.data.gaps || []));
    api.get('/quizzes').then(r => setQuizzes(r.data.quizzes || []));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900 font-display">{t('trainerDashboard')}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow">
          <h2 className="font-bold text-slate-900 mb-3">My batches</h2>
          {batches.length === 0 && <p className="text-sm text-slate-500">No batches assigned.</p>}
          {batches.map(b => <div key={b.id} className="text-sm border-b border-slate-100 py-1 text-slate-700">{b.name} — {b.department_name || '—'}</div>)}
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow">
          <h2 className="font-bold text-slate-900 mb-3">Quick actions</h2>
          <div className="space-y-2 text-sm">
            <Link to="/documents" className="block text-cyan-600 hover:underline">Upload training materials</Link>
            <Link to="/quizzes" className="block text-cyan-600 hover:underline">Create / approve quizzes</Link>
            <Link to="/videos" className="block text-cyan-600 hover:underline">Submit YouTube videos</Link>
            <Link to="/courses" className="block text-cyan-600 hover:underline">Manage courses</Link>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow">
        <h2 className="font-bold text-slate-900 mb-3">Batch competency gaps (overview)</h2>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-slate-500"><th className="py-1">Trainee</th><th>Competency</th><th>Score</th></tr></thead>
            <tbody>
              {gaps.slice(0, 40).map((g, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-1 text-slate-700">{g.name}</td>
                  <td className="py-1 text-slate-600">{g.competency}</td>
                  <td className="py-1">{g.score != null ? Math.round(g.score) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow">
        <h2 className="font-bold text-slate-900 mb-3">My quizzes</h2>
        {quizzes.map(q => <div key={q.id} className="text-sm border-b border-slate-100 py-1 text-slate-700">{q.title} <span className="text-[10px] text-slate-500">({q.status})</span></div>)}
      </div>
    </div>
  );
}