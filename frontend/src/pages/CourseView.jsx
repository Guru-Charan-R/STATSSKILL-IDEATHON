import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api.js';

export default function CourseView() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    api.get(`/courses/${id}`).then(r => {
      setCourse(r.data.course);
      setLessons(r.data.lessons || []);
    });
  }, [id]);

  useEffect(() => {
    if (course) api.post(`/courses/${id}/enroll`).catch(()=>{});
  }, [course]);

  if (!course) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;
  const v = lessons[active];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {v && (
          <>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${v.youtube_id}`}
                title={v.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{v.title}</h2>
              <p className="text-sm text-slate-500 mt-1">{v.description}</p>
              <div className="mt-3 flex items-center space-x-3">
                <button disabled={active===0} onClick={() => setActive(a=>a-1)} className="px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 disabled:opacity-40">Previous</button>
                <button disabled={active===lessons.length-1} onClick={() => setActive(a=>a+1)} className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500 disabled:opacity-40">Next</button>
                <span className="text-xs text-slate-500">{active+1} / {lessons.length}</span>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="bg-white rounded-2xl p-4 border border-slate-200 card-soft-shadow">
        <h3 className="font-bold text-slate-900 mb-3">{course.title}</h3>
        <div className="space-y-2 max-h-[480px] overflow-y-auto">
          {lessons.map((l, i) => (
            <button key={l.id} onClick={() => setActive(i)} className={`w-full text-left p-2 rounded-lg text-sm ${i===active ? 'bg-cyan-50 border border-cyan-200' : 'hover:bg-slate-50'}`}>
              <div className="font-semibold text-slate-800">{i+1}. {l.title}</div>
              <div className="text-[10px] text-slate-500">{l.duration || '—'}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}