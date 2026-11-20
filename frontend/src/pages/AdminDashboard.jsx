import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { useSettings } from '../context/SettingsContext.jsx';

export default function AdminDashboard() {
  const { t } = useSettings();
  const [users, setUsers] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [pendingVideos, setPendingVideos] = useState([]);
  const [pendingQuizzes, setPendingQuizzes] = useState([]);

  const load = async () => {
    const u = await api.get('/users');
    setUsers(u.data.users || []);
    const g = await api.get('/assessments/gaps');
    setGaps(g.data.gaps || []);
    const pv = await api.get('/videos/pending');
    setPendingVideos(pv.data.videos || []);
    const q = await api.get('/quizzes');
    setPendingQuizzes((q.data.quizzes || []).filter(x => x.status !== 'approved'));
  };
  useEffect(() => { load(); }, []);

  const approveVideo = async (id) => { await api.patch(`/videos/${id}/approve`); await load(); };
  const approveQuiz = async (id) => { await api.patch(`/quizzes/${id}/approve`); await load(); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900 font-display">{t('adminDashboard')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow">
          <h2 className="font-bold text-slate-900 mb-3">Users ({users.length})</h2>
          <div className="max-h-72 overflow-y-auto space-y-1">
            {users.map(u => (
              <div key={u.id} className="flex justify-between text-sm border-b border-slate-100 py-1">
                <span className="text-slate-700">{u.name} <span className="text-[10px] text-slate-500">({u.role})</span></span>
                <span className="text-[10px] text-slate-500">{u.department}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow">
          <h2 className="font-bold text-slate-900 mb-3">Pending video approvals</h2>
          {pendingVideos.length === 0 && <p className="text-sm text-slate-500">None.</p>}
          {pendingVideos.map(v => (
            <div key={v.id} className="flex justify-between items-center text-sm border-b border-slate-100 py-1">
              <span className="text-slate-700">{v.title}</span>
              <button onClick={() => approveVideo(v.id)} className="text-xs text-cyan-600 hover:underline">Approve</button>
            </div>
          ))}
          <h2 className="font-bold text-slate-900 mt-4 mb-2">Pending quiz approvals</h2>
          {pendingQuizzes.length === 0 && <p className="text-sm text-slate-500">None.</p>}
          {pendingQuizzes.map(q => (
            <div key={q.id} className="flex justify-between items-center text-sm border-b border-slate-100 py-1">
              <span className="text-slate-700">{q.title}</span>
              <button onClick={() => approveQuiz(q.id)} className="text-xs text-cyan-600 hover:underline">Approve</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow">
        <h2 className="font-bold text-slate-900 mb-3">Organisation competency gaps (sample)</h2>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-slate-500"><th className="py-1">Trainee</th><th>Competency</th><th>Score</th><th>Target</th></tr></thead>
            <tbody>
              {gaps.slice(0, 40).map((g, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-1 text-slate-700">{g.name}</td>
                  <td className="py-1 text-slate-600">{g.competency}</td>
                  <td className="py-1">{g.score != null ? Math.round(g.score) : '—'}</td>
                  <td className="py-1">{g.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}