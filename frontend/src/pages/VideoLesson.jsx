import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { offlineLessons } from '../lib/offlineStore.js';
import { buildLessonHtml, downloadText, safeFilename, toDataUrl } from '../lib/offlineFiles.js';

export default function VideoLesson() {
  const { id } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState(0);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    api.get(`/videos/${id}`).then(r => setVideo(r.data.video));
    api.get(`/videos/${id}/progress`).then(r => {
      if (r.data.progress) { setProgress(r.data.progress.position_seconds || 0); }
    }).catch(()=>{});
    api.get('/videos/saved/me').then(r => {
      if ((r.data.videos||[]).some(v => v.id === Number(id))) setSaved(true);
    }).catch(()=>{});
    offlineLessons.get(id).then(r => setOfflineSaved(!!r)).catch(()=>{});
  }, [id]);

  const toggleSave = async () => {
    if (saved) { await api.delete(`/videos/${id}/save`); setSaved(false); }
    else { await api.post(`/videos/${id}/save`); setSaved(true); }
  };

  // Save lesson details/notes locally and download a self-contained HTML copy.
  // The YouTube stream itself is not copied (copyright); playback needs internet.
  const saveOffline = async () => {
    if (!video) return;
    setSaving(true);
    setNotice('');
    try {
      const thumbnail = video.thumbnail || `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;
      const thumbnailData = await toDataUrl(thumbnail);
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CACHE_URL', url: thumbnail });
      }
      const record = {
        id: video.id,
        title: video.title,
        youtube_id: video.youtube_id,
        channel: video.channel,
        language: video.language,
        subject: video.subject,
        difficulty: video.difficulty,
        description: video.description,
        thumbnail,
        thumbnailData,
        url: `https://www.youtube.com/watch?v=${video.youtube_id}`,
      };
      await offlineLessons.save(record);
      downloadText(`${safeFilename(video.title)}.html`, buildLessonHtml(record));
      setOfflineSaved(true);
      setNotice('Lesson saved offline. Video playback still needs an internet connection.');
    } catch (e) {
      setNotice('Could not save lesson offline: ' + e.message);
    }
    setSaving(false);
  };

  const markComplete = async () => {
    await api.post(`/videos/${id}/progress`, { position_seconds: 0, completed: true });
    alert('Marked complete');
  };

  if (!video) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="aspect-video bg-black rounded-2xl overflow-hidden">
          <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${video.youtube_id}`} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{video.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{video.description}</p>
          <div className="flex items-center space-x-3 mt-3 text-xs text-slate-500">
            <span>{video.channel}</span>
            <span>·</span>
            <span>{video.language}</span>
            <span>·</span>
            <span>{video.subject}</span>
            <span>·</span>
            <span>{video.difficulty}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={toggleSave} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${saved ? 'bg-cyan-600 text-white border-cyan-600' : 'border-slate-200 text-slate-700'}`}>{saved ? 'Saved' : 'Bookmark'}</button>
            <button onClick={saveOffline} disabled={saving} title="Save lesson notes locally and download a portable copy" className="px-3 py-1.5 rounded-full text-xs font-semibold border border-teal-500 text-teal-600 disabled:opacity-50">{saving ? 'Saving...' : (offlineSaved ? 'Saved offline' : 'Save lesson offline')}</button>
            <button onClick={markComplete} className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500">Mark complete</button>
            <a href={`https://www.youtube.com/watch?v=${video.youtube_id}`} target="_blank" rel="noreferrer" className="text-xs text-cyan-600 hover:underline">Watch on YouTube</a>
          </div>
          {notice && <p className="text-[11px] text-teal-600 mt-2">{notice}</p>}
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 card-soft-shadow">
          <h3 className="font-bold text-slate-900 mb-2">Ask StatSkill AI about this lesson</h3>
          <p className="text-xs text-slate-500 mb-2">Use the floating AI assistant (bottom-right) with suggestions like: Explain this lesson, Summarise this topic, Explain in Tamil/Hindi, Give a practical example, Generate MCQs, Recommend the next lesson.</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 border border-slate-200 card-soft-shadow">
        <h3 className="font-bold text-slate-900 mb-3">Video details</h3>
        <dl className="text-sm text-slate-600 space-y-2">
          <div><dt className="font-semibold">Channel</dt><dd>{video.channel}</dd></div>
          <div><dt className="font-semibold">Language</dt><dd>{video.language}</dd></div>
          <div><dt className="font-semibold">Subject</dt><dd>{video.subject}</dd></div>
          <div><dt className="font-semibold">Difficulty</dt><dd>{video.difficulty}</dd></div>
          {video.duration && <div><dt className="font-semibold">Duration</dt><dd>{video.duration}</dd></div>}
        </dl>
        <div className="mt-4">
          <Link to="/videos" className="text-xs text-cyan-600 hover:underline">← Back to Video Library</Link>
        </div>
      </div>
    </div>
  );
}