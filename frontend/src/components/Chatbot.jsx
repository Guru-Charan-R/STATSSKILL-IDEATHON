import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

// The model is asked for plain text, but older/stored answers can still contain
// Markdown or LaTeX. Convert those symbols to readable plain text instead of
// showing them literally inside the narrow chat bubble.
function formatChatText(raw) {
  let s = String(raw == null ? '' : raw).replace(/\r\n/g, '\n');

  // Literal escapes first, then common LaTeX macros.
  s = s.replace(/\\n/g, '\n');
  s = s.replace(/\\\[|\\\]|\\\(|\\\)/g, '');
  s = s.replace(/\\text\{([^}]*)\}/g, '$1');
  s = s.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)');
  s = s.replace(/\\times/g, '×');
  s = s.replace(/\\%/g, '%');
  s = s.replace(/\\([A-Za-z])/g, '$1');

  // Markdown emphasis/headings/rules.
  s = s.replace(/\*\*|__/g, '');
  s = s.replace(/(^|\s)\*([^*\n]+)\*/g, '$1$2');
  s = s.replace(/(^|\s)_([^_\n]+)_/g, '$1$2');
  s = s.replace(/^#{1,6}\s*/gm, '');
  s = s.replace(/^\s*(?:---+|\*\*\*+|___+)\s*$/gm, '');
  s = s.replace(/^\s*[-*•]\s+/gm, '• ');

  // Markdown tables become simple key · value lines.
  s = s.split('\n').map((line) => {
    const t = line.trim();
    if (t.includes('-') && /^\|?[\s:|-]+\|?$/.test(t)) return '';
    if (t.startsWith('|') || (t.includes('|') && t.endsWith('|'))) {
      return t.replace(/^\||\|$/g, '').split('|').map(c => c.trim()).filter(Boolean).join('  ·  ');
    }
    return line;
  }).join('\n');

  return s.replace(/\n{3,}/g, '\n\n').trim();
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState(null);
  const scrollRef = useRef(null);
  const location = useLocation();
  const { language, t } = useSettings();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const contextForPath = () => {
    const p = location.pathname;
    if (p === '/') return 'Landing page: Explain StatSkill AI.';
    if (p.startsWith('/videos/')) return 'Video lesson page: explain lesson topics, recommend next lessons.';
    if (p === '/videos') return 'Video Library: recommend videos and explain lesson topics.';
    if (p.startsWith('/trainee')) return 'Trainee dashboard: explain competency gaps and recommendations.';
    if (p.startsWith('/admin')) return 'Admin dashboard: organisation-wide insights.';
    if (p.startsWith('/trainer')) return 'Trainer dashboard: batch progress.';
    if (p.startsWith('/documents')) return 'Document library: answer from selected documents.';
    if (p.startsWith('/quizzes')) return 'Quiz page: explain concepts without revealing active assessment answers.';
    return 'General StatSkill AI help.';
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: text, conversation_id: convId, language, context: contextForPath() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const obj = JSON.parse(payload);
            if (obj.conversation_id) setConvId(obj.conversation_id);
            if (obj.delta) {
              setMessages(prev => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === 'assistant') {
                  // Never mutate state inside an updater: React StrictMode may
                  // call it twice, which used to duplicate every streamed token.
                  copy[copy.length - 1] = { ...last, content: last.content + obj.delta };
                }
                return copy;
              });
            }
            if (obj.error) throw new Error(obj.error);
          } catch (e) { /* ignore parse */ }
        }
      }
    } catch (e) {
      setMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.role === 'assistant') {
          copy[copy.length - 1] = { ...last, content: `Error: ${e.message}` };
        }
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  const newConv = () => { setMessages([]); setConvId(null); };
  const copyText = (t) => { navigator.clipboard?.writeText(formatChatText(t)); };
  const suggestions = ['Explain this lesson', 'Summarise this topic', 'Give a practical example', 'Generate MCQs', 'Recommend the next lesson'];

  return (
    <>
      <button onClick={() => setOpen(o => !o)} className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 to-teal-500 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition" title="Ask StatSkill AI">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-600 to-teal-500 text-white">
            <div>
              <div className="text-sm font-bold">{t('chatTitle')}</div>
              <div className="text-[10px] opacity-90">{t('chatSubtitle')}</div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={newConv} className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded" title="New conversation">New</button>
              <button onClick={() => setOpen(false)} className="text-white hover:opacity-80">✕</button>
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-xs text-slate-500 bg-white rounded-xl p-3 border border-slate-200">
                {t('chatWelcome')}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${m.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                  <div className="whitespace-pre-wrap break-words">{formatChatText(m.content)}{loading && i === messages.length - 1 && m.role === 'assistant' && !m.content ? '...' : ''}</div>
                  {m.role === 'assistant' && m.content && (
                    <button onClick={() => copyText(m.content)} className="mt-1 text-[9px] text-slate-400 hover:text-cyan-600">Copy</button>
                  )}
                </div>
              </div>
            ))}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map(s => (
                  <button key={s} onClick={() => setInput(s)} className="text-[10px] px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-cyan-400">{s}</button>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={t('chatPlaceholder')} className="flex-1 text-xs px-3 py-2 rounded-full border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
            <button onClick={send} disabled={loading} className="px-3 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-500 disabled:opacity-50">Send</button>
          </div>
        </div>
      )}
    </>
  );
}