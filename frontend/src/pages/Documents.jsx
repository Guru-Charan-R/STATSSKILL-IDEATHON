import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { offlineDocuments } from '../lib/offlineStore.js';
import { buildDocumentText, downloadText, safeFilename } from '../lib/offlineFiles.js';

export default function Documents() {
  const { user } = useAuth();
  const { t } = useSettings();
  const [docs, setDocs] = useState([]);
  const [question, setQuestion] = useState('');
  const [docId, setDocId] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [notice, setNotice] = useState('');

  const load = async () => {
    const r = await api.get('/documents');
    setDocs(r.data.documents || []);
  };
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title || file.name);
    fd.append('status', user?.role === 'admin' ? 'approved' : 'draft');
    try {
      await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setTitle(''); setFile(null);
      await load();
    } catch (err) { alert(err.response?.data?.error || 'Upload failed'); }
    setUploading(false);
  };

  const ask = async () => {
    if (!question.trim()) return;
    setAnswer('Thinking...');
    try {
      const r = await api.post('/documents/ask', { question, document_id: docId || undefined });
      setAnswer(r.data.answer);
      setSources(r.data.sources || []);
    } catch (err) { setAnswer('Error: ' + (err.response?.data?.error || err.message)); }
  };

  const approve = async (id) => {
    await api.patch(`/documents/${id}/approve`);
    await load();
  };

  // Save the full document locally and also download a plain-text (.txt) copy.
  const saveOffline = async (d) => {
    setSavingId(d.id);
    setNotice('');
    try {
      let contents = (await offlineDocuments.get(d.id))?.chunks || null;
      if (navigator.onLine) {
        try {
          const r = await api.get(`/documents/${d.id}`);
          if (r.data.chunks?.length) contents = r.data.chunks.map(c => c.content);
        } catch (e) { /* fall back to the locally saved copy */ }
      }
      if (!contents || !contents.length) throw new Error('No local copy yet - connect to the internet once to download it.');
      const record = {
        id: d.id,
        title: d.title,
        tags: d.tags,
        original_name: d.original_name,
        chunks: contents,
      };
      await offlineDocuments.save(record);
      downloadText(`${safeFilename(d.title)}.txt`, buildDocumentText(record, contents.map(content => ({ content }))), 'text/plain;charset=utf-8');
      setNotice(`"${d.title}" is saved on this device and a downloadable copy was created.`);
    } catch (err) {
      setNotice('Could not save offline: ' + (err.response?.data?.error || err.message));
    }
    setSavingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900 font-display">{t('documentsTitle')}</h1>

      {(user?.role === 'admin' || user?.role === 'trainer') && (
        <form onSubmit={upload} className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow space-y-3">
          <h2 className="font-bold text-slate-900">Upload document</h2>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          <input type="file" accept=".pdf,.txt" onChange={e=>setFile(e.target.files[0])} className="w-full text-sm" />
          <button disabled={uploading} className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500 disabled:opacity-50">{uploading ? 'Uploading...' : 'Upload'}</button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow">
          <h2 className="font-bold text-slate-900 mb-3">Documents</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {docs.map(d => (
              <div key={d.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 text-sm">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800">{d.title}</div>
                  <div className="text-[10px] text-slate-500">{d.original_name} · {d.status}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => saveOffline(d)}
                    disabled={savingId === d.id}
                    title="Save on this device and download a text (.txt) copy"
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500 disabled:opacity-50"
                  >
                    {savingId === d.id ? 'Saving...' : 'Download / Save offline'}
                  </button>
                  {user?.role === 'admin' && d.status !== 'approved' && (
                    <button onClick={() => approve(d.id)} className="text-xs text-cyan-600 hover:underline">Approve</button>
                  )}
                </div>
              </div>
            ))}
            {docs.length === 0 && <p className="text-sm text-slate-500">No documents yet.</p>}
            {notice && <p className="text-[11px] text-teal-600 mt-2">{notice}</p>}
            <p className="text-[10px] text-slate-500 mt-2">Saved documents appear in the Offline Library and open without the internet.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 card-soft-shadow space-y-3">
          <h2 className="font-bold text-slate-900">Ask the document (RAG)</h2>
          <select value={docId} onChange={e=>setDocId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
            <option value="">All approved documents</option>
            {docs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
          <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask a question..." className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" rows={3} />
          <button onClick={ask} className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500">Ask</button>
          {answer && (
            <div className="mt-3 text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{answer}</div>
          )}
          {sources.length > 0 && (
            <div className="text-[10px] text-slate-500">Sources: {sources.map(s => s.title).join(', ')}</div>
          )}
        </div>
      </div>
    </div>
  );
}