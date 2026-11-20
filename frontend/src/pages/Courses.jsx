import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { useSettings } from '../context/SettingsContext.jsx';

export default function Courses() {
  const { t } = useSettings();
  const [courses, setCourses] = useState([]);
  useEffect(() => { api.get('/courses').then(r => setCourses(r.data.courses || [])); }, []);
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-slate-900 font-display mb-6">{t('coursesTitle')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(c => (
          <div key={c.id} className="bg-white rounded-3xl p-6 border border-slate-200 card-soft-shadow">
            <h3 className="text-lg font-bold text-slate-900 mb-1">{c.title}</h3>
            <p className="text-sm text-slate-500 mb-3">{c.description}</p>
            <div className="text-[10px] text-slate-500 mb-3">{c.language} · {c.subject} · {c.lesson_count} lessons</div>
            <Link to={`/courses/${c.id}`} className="text-xs text-cyan-600 hover:underline">Open course →</Link>
          </div>
        ))}
        {courses.length === 0 && <p className="text-sm text-slate-500">No courses yet.</p>}
      </div>
    </div>
  );
}