import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { offlineLessons } from '../lib/offlineStore.js';

const SUBJECTS = ['Statistics Fundamentals','Data Analysis','Survey Methodology','Census and Data Collection','Statistical Software','Excel and Data Management','Data Visualisation','Government Statistical Reporting','Digital Skills'];

export default function VideoLibrary() {
  const { t } = useSettings();
  const [videos, setVideos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [q, setQ] = useState('');
  const [language, setLanguage] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [offlineIds, setOfflineIds] = useState([]);

  const load = async () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (language) params.set('language', language);
    if (subject) params.set('subject', subject);
    if (difficulty) params.set('difficulty', difficulty);
    const r = await api.get(`/videos?${params.toString()}`);
    setVideos(r.data.videos || []);
    const c = await api.get('/courses');
    setCourses(c.data.courses || []);
  };
  useEffect(() => {
    load();
    offlineLessons.list().then(rows => setOfflineIds(rows.map(r => String(r.id)))).catch(()=>{});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">{t('videosTitle')}</h1>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200 card-soft-shadow flex flex-wrap gap-3">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search videos..." className="px-3 py-2 rounded-lg border border-slate-200 text-sm flex-1 min-w-[200px]" />
        <select value={language} onChange={e=>setLanguage(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="">All languages</option>
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="ta">Tamil</option>
          <option value="ml">Malayalam</option>
        </select>
        <select value={subject} onChange={e=>setSubject(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="">All subjects</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={difficulty} onChange={e=>setDifficulty(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button onClick={load} className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500">Search</button>
      </div>

      {courses.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-3">Structured courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(c => (
              <Link key={c.id} to={`/courses/${c.id}`} className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow hover:border-cyan-400 transition">
                <h3 className="font-bold text-slate-900">{c.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{c.subject} · {c.language} · {c.lesson_count} lessons</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Videos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {videos.map(v => (
            <Link key={v.id} to={`/videos/${v.id}`} className="bg-white rounded-2xl overflow-hidden border border-slate-200 card-soft-shadow hover:border-cyan-400 transition">
              <img src={v.thumbnail || `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`} alt={v.title} className="w-full aspect-video object-cover" />
              <div className="p-3">
                <div className="text-sm font-bold text-slate-900 line-clamp-2">{v.title}</div>
                <div className="text-[10px] text-slate-500 mt-1">{v.channel}</div>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700">{v.language}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{v.subject}</span>
                  {offlineIds.includes(String(v.id)) && <span className="text-[9px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">Saved offline</span>}
                </div>
              </div>
            </Link>
          ))}
          {videos.length === 0 && <p className="text-sm text-slate-500 col-span-full">No videos found.</p>}
        </div>
      </div>

      {/* Submit video (trainers/admins) */}
      <SubmitVideo onDone={load} />
    </div>
  );
}

function SubmitVideo({ onDone }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', youtube_id: '', channel: '', language: 'en', subject: '', difficulty: 'beginner', description: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/videos', form);
      setOpen(false);
      setForm({ title: '', youtube_id: '', channel: '', language: 'en', subject: '', difficulty: 'beginner', description: '' });
      onDone();
    } catch (err) { alert(err.response?.data?.error || 'Submit failed'); }
  };
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow">
      <button onClick={() => setOpen(o=>!o)} className="text-sm font-semibold text-cyan-600">{open ? 'Cancel' : '+ Submit a YouTube video (Trainers/Admins)'}</button>
      {open && (
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Title" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          <input value={form.youtube_id} onChange={e=>set('youtube_id',e.target.value)} placeholder="YouTube video ID" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          <input value={form.channel} onChange={e=>set('channel',e.target.value)} placeholder="Channel" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          <select value={form.language} onChange={e=>set('language',e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
            <option value="en">English</option><option value="hi">Hindi</option><option value="ta">Tamil</option><option value="ml">Malayalam</option>
          </select>
          <select value={form.subject} onChange={e=>set('subject',e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
            <option value="">Subject</option>{SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select value={form.difficulty} onChange={e=>set('difficulty',e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
            <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
          </select>
          <textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Description" className="md:col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-sm" rows={2} />
          <button type="submit" className="md:col-span-2 px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500">Submit for approval</button>
        </form>
      )}
    </div>
  );
}