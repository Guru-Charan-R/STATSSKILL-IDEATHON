import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { offlineDocuments, offlineLessons } from '../lib/offlineStore.js';
import { buildDocumentText, buildLessonHtml, downloadText, safeFilename } from '../lib/offlineFiles.js';
import { useSettings } from '../context/SettingsContext.jsx';

export default function OfflineLibrary() {
  const { t } = useSettings();
  const [docs, setDocs] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [active, setActive] = useState('documents');
  const [openId, setOpenId] = useState(null);
  const [online, setOnline] = useState(navigator.onLine !== false);
  const [notice, setNotice] = useState('');

  const refresh = async () => {
    try {
      const [d, l] = await Promise.all([offlineDocuments.list(), offlineLessons.list()]);
      const byDate = (a, b) => String(b.savedAt || '').localeCompare(String(a.savedAt || ''));
      setDocs([...d].sort(byDate));
      setLessons([...l].sort(byDate));
    } catch (e) {
      setNotice('Offline storage is not available in this browser.');
    }
  };

  useEffect(() => {
    refresh();
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const remove = async (kind, id) => {
    if (!window.confirm('Remove this item from this device?')) return;
    if (kind === 'documents') await offlineDocuments.remove(id);
    else await offlineLessons.remove(id);
    setOpenId(null);
    setNotice('Removed from this device.');
    refresh();
  };

  const redownload = (kind, item) => {
    if (kind === 'documents') {
      downloadText(`${safeFilename(item.title)}.txt`, buildDocumentText(item, (item.chunks || []).map(content => ({ content }))), 'text/plain;charset=utf-8');
    } else {
      downloadText(`${safeFilename(item.title)}.html`, buildLessonHtml(item));
    }
  };

  const tabButton = (key, label, count) => (
    <button onClick={() => { setActive(key); setOpenId(null); }} className={`px-4 py-2 text-sm font-semibold border-b-2 ${active === key ? 'text-teal-600 border-teal-500' : 'text-slate-500 border-transparent hover:text-teal-600'}`}>
      {label} <span className="text-[10px] opacity-70">({count})</span>
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">{t('offlineLibrary')}</h1>
          <p className="text-xs text-slate-500 mt-1">{t('offlineLibraryHint')}</p>
        </div>
        <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${online ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'}`}>
          {online ? t('online') : t('offlineMode')}
        </span>
      </div>

      {notice && <p className="text-xs text-teal-600">{notice}</p>}

      <div className="bg-white rounded-2xl border border-slate-200 card-soft-shadow">
        <div className="flex border-b border-slate-100 px-3">
          {tabButton('documents', t('documents'), docs.length)}
          {tabButton('lessons', t('videoLessons'), lessons.length)}
        </div>

        <div className="p-5">
          {active === 'documents' && (
            docs.length === 0 ? (
              <div className="text-sm text-slate-500 space-y-2">
                <p>{t('nothingSaved')}</p>
                <Link to="/documents" className="text-cyan-600 hover:underline">→ {t('browseDocuments')}</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {docs.map(d => (
                  <div key={d.id} className="border border-slate-100 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800">{d.title}</div>
                        <div className="text-[10px] text-slate-500">{d.tags} · {t('savedAt')} {d.savedAt ? new Date(d.savedAt).toLocaleString() : '-'}</div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => redownload('documents', d)} className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500">{t('downloadCopy')}</button>
                        <button onClick={() => setOpenId(openId === d.id ? null : d.id)} className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-slate-200 text-slate-600">{openId === d.id ? t('close') : t('open')}</button>
                        <button onClick={() => remove('documents', d.id)} className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-rose-200 text-rose-600">{t('remove')}</button>
                      </div>
                    </div>
                    {openId === d.id && (
                      <div data-no-translate className="mt-3 bg-slate-50 rounded-lg p-3 max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-xs text-slate-700">{(d.chunks || []).join('\n\n')}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {active === 'lessons' && (
            lessons.length === 0 ? (
              <div className="text-sm text-slate-500 space-y-2">
                <p>{t('nothingSaved')}</p>
                <Link to="/videos" className="text-cyan-600 hover:underline">→ {t('browseVideos')}</Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500 bg-amber-50 border-l-4 border-amber-400 p-2 rounded">{t('videoOfflineNote')}</p>
                {lessons.map(l => (
                  <div key={l.id} className="border border-slate-100 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800">{l.title}</div>
                        <div className="text-[10px] text-slate-500">{l.channel} · {l.language} · {t('savedAt')} {l.savedAt ? new Date(l.savedAt).toLocaleString() : '-'}</div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => redownload('lessons', l)} className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500">{t('downloadCopy')}</button>
                        <button onClick={() => setOpenId(openId === l.id ? null : l.id)} className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-slate-200 text-slate-600">{openId === l.id ? t('close') : t('open')}</button>
                        <button onClick={() => remove('lessons', l.id)} className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-rose-200 text-rose-600">{t('remove')}</button>
                      </div>
                    </div>
                    {openId === l.id && (
                      <div data-no-translate className="mt-3 bg-slate-50 rounded-lg p-3 space-y-2">
                        {l.thumbnailData ? <img src={l.thumbnailData} alt="" className="w-full max-w-xs rounded-lg" /> : null}
                        <p className="text-xs text-slate-700">{l.description}</p>
                        <a href={l.url} target="_blank" rel="noreferrer" className="text-xs text-cyan-600 hover:underline break-all">{l.url}</a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
