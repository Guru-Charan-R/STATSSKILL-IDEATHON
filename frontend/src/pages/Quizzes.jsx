import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export default function Quizzes() {
  const { user } = useAuth();
  const { t } = useSettings();
  const [quizzes, setQuizzes] = useState([]);
  const [genDoc, setGenDoc] = useState('');
  const [genTopic, setGenTopic] = useState('');
  const [genCount, setGenCount] = useState(5);
  const [genQuestions, setGenQuestions] = useState([]);
  const [title, setTitle] = useState('');
  const [docs, setDocs] = useState([]);

  const load = async () => {
    const r = await api.get('/quizzes');
    setQuizzes(r.data.quizzes || []);
    const d = await api.get('/documents');
    setDocs(d.data.documents || []);
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    try {
      const r = await api.post('/quizzes/generate', { document_id: genDoc || undefined, topic: genTopic, count: genCount });
      setGenQuestions(r.data.questions || []);
    } catch (err) { alert(err.response?.data?.error || 'Generation failed'); }
  };

  const saveQuiz = async () => {
    if (!title || genQuestions.length === 0) return alert('Title and questions required');
    await api.post('/quizzes', { title, document_id: genDoc || undefined, topic: genTopic, questions: genQuestions, status: 'draft' });
    setTitle(''); setGenQuestions([]);
    await load();
  };

  const approve = async (id) => { await api.patch(`/quizzes/${id}/approve`); await load(); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900 font-display">{t('quizzesTitle')}</h1>

      {(user?.role === 'admin' || user?.role === 'trainer') && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow space-y-3">
          <h2 className="font-bold text-slate-900">Generate MCQs with AI (Groq)</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select value={genDoc} onChange={e=>setGenDoc(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
              <option value="">No document</option>
              {docs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
            <input value={genTopic} onChange={e=>setGenTopic(e.target.value)} placeholder="Topic (optional)" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            <input value={genCount} onChange={e=>setGenCount(e.target.value)} type="number" min={1} max={20} className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            <button onClick={generate} className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500">Generate</button>
          </div>
          {genQuestions.length > 0 && (
            <div className="space-y-3 mt-3">
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Quiz title" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
              {genQuestions.map((q, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-3 text-sm">
                  <div className="font-semibold">{i+1}. {q.question}</div>
                  <ul className="mt-1 text-xs text-slate-600 list-disc pl-5">{(q.options||[]).map((o,j)=><li key={j}>{o} {q.correct_index===j && <span className="text-emerald-600">(correct)</span>}</li>)}</ul>
                </div>
              ))}
              <button onClick={saveQuiz} className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500">Save as draft</button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow">
        <h2 className="font-bold text-slate-900 mb-3">Available quizzes</h2>
        <div className="space-y-2">
          {quizzes.map(q => (
            <div key={q.id} className="flex items-center justify-between border-b border-slate-100 py-2">
              <div>
                <div className="font-semibold text-slate-800">{q.title}</div>
                <div className="text-[10px] text-slate-500">{q.topic || 'General'} · {q.difficulty} · {q.status}</div>
              </div>
              <div className="flex items-center space-x-3">
                {(user?.role === 'admin' || user?.role === 'trainer') && q.status !== 'approved' && (
                  <button onClick={() => approve(q.id)} className="text-xs text-cyan-600 hover:underline">Approve</button>
                )}
                <Link to={`/quizzes/${q.id}`} className="text-xs text-cyan-600 hover:underline">Open</Link>
              </div>
            </div>
          ))}
          {quizzes.length === 0 && <p className="text-sm text-slate-500">No quizzes yet.</p>}
        </div>
      </div>
    </div>
  );
}