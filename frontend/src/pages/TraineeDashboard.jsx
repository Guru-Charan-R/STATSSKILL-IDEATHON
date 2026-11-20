import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { Link } from 'react-router-dom';

export default function TraineeDashboard() {
  const { user } = useAuth();
  const { t } = useSettings();
  const [scores, setScores] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    api.get('/assessments/me').then(r => setScores(r.data.scores || []));
    api.get('/quizzes/attempts/me').then(r => setAttempts(r.data.attempts || []));
    api.get('/courses/enrollments/me').then(r => setEnrollments(r.data.enrollments || []));
  }, []);

  const weak = scores.filter(s => s.score != null && s.score < (s.target || 80)).sort((a,b)=>a.score-b.score);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900 font-display">{t('traineeDashboard')}</h1>
      <p className="text-sm text-slate-500">Welcome, {user?.name}. Track your competencies and learning.</p>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow">
        <h2 className="font-bold text-slate-900 mb-3">Competency scores</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {scores.map(s => (
            <div key={s.key} className="border border-slate-200 rounded-xl p-3">
              <div className="text-xs font-semibold text-slate-700">{s.name}</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{s.score != null ? Math.round(s.score) : '—'}</div>
              <div className="text-[10px] text-slate-500">target {s.target || 80}</div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-600 to-teal-500" style={{ width: `${Math.min(100, s.score || 0)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow">
          <h2 className="font-bold text-slate-900 mb-3">Recommended focus areas</h2>
          {weak.length === 0 && <p className="text-sm text-slate-500">No gaps detected. Great job!</p>}
          <ul className="space-y-2">
            {weak.map(w => (
              <li key={w.key} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{w.name}</span>
                <span className="text-rose-600 font-semibold">{Math.round(w.score)}%</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex space-x-3">
            <Link to="/videos" className="text-xs text-cyan-600 hover:underline">Browse videos</Link>
            <Link to="/courses" className="text-xs text-cyan-600 hover:underline">Browse courses</Link>
            <Link to="/quizzes" className="text-xs text-cyan-600 hover:underline">Take quizzes</Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow">
          <h2 className="font-bold text-slate-900 mb-3">My course progress</h2>
          {enrollments.length === 0 && <p className="text-sm text-slate-500">No courses enrolled yet.</p>}
          <ul className="space-y-2">
            {enrollments.map(e => (
              <li key={e.id} className="text-sm">
                <div className="flex justify-between"><span className="text-slate-700">{e.title}</span><span className="text-cyan-600 font-semibold">{Math.round(e.progress)}%</span></div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1"><div className="h-full bg-gradient-to-r from-cyan-600 to-teal-500" style={{ width: `${e.progress}%` }}></div></div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow">
        <h2 className="font-bold text-slate-900 mb-3">Recent quiz attempts</h2>
        {attempts.length === 0 && <p className="text-sm text-slate-500">No attempts yet.</p>}
        <ul className="space-y-1 text-sm">
          {attempts.slice(0,8).map(a => (
            <li key={a.id} className="flex justify-between border-b border-slate-100 py-1">
              <span className="text-slate-700">{a.title}</span>
              <span className="text-cyan-600 font-semibold">{Math.round(a.score)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}