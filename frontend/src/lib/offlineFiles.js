// Builds self-contained HTML files that can be opened without the app or internet.

export function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeFilename(name) {
  return String(name || 'offline-copy').replace(/[^a-z0-9._-]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 90) || 'offline-copy';
}

export function downloadText(filename, text, mime = 'text/html;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const STYLE = `
  :root{color-scheme:light dark}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
    line-height:1.65;color:#0f1c31;background:#f4f7fb;padding:32px 16px}
  .wrap{max-width:860px;margin:0 auto;background:#fff;border:1px solid #dbe4f0;border-radius:16px;
    padding:32px;box-shadow:0 8px 30px rgba(15,28,49,.08)}
  .brand{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#0d9488;font-weight:700}
  h1{font-size:26px;line-height:1.25;margin:10px 0 6px;color:#0f1c31}
  .meta{font-size:12px;color:#64748b;margin-bottom:24px}
  h2{font-size:16px;margin:26px 0 8px;color:#0f1c31}
  p,li{font-size:14px;color:#243449}
  pre{white-space:pre-wrap;word-wrap:break-word;background:#f8fafc;border:1px solid #e2e8f0;
    border-radius:10px;padding:16px;font:inherit;font-size:14px}
  img{width:100%;border-radius:10px;margin:14px 0}
  a{color:#0d9488}
  .note{background:#ecfeff;border-left:4px solid #0d9488;padding:10px 14px;border-radius:6px;font-size:13px}
  @media (prefers-color-scheme:dark){
    body{background:#070d17;color:#f1f5f9}
    .wrap{background:#0f1c31;border-color:#2a4267;box-shadow:none}
    h1,h2{color:#f8fafc}p,li{color:#cbd5e1}
    pre{background:#0b172a;border-color:#1e2f49}
    .note{background:#0c2830}
  }
  @media print{body{background:#fff;padding:0}.wrap{box-shadow:none;border:0}}
`;

function shell(title, content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} - StatSkill AI offline copy</title>
<style>${STYLE}</style></head><body><div class="wrap">
<div class="brand">StatSkill AI · Offline Learning Copy</div>${content}
</div></body></html>`;
}

export function buildDocumentHtml(doc, chunks = []) {
  const text = chunks.map(c => c.content).join('\n\n') || 'No extracted text is available for this document.';
  return shell(doc.title, `
<h1>${escapeHtml(doc.title)}</h1>
<div class="meta">${escapeHtml(doc.original_name || '')} · ${escapeHtml(doc.tags || '')} · Saved ${escapeHtml(new Date().toLocaleString())}</div>
<div class="note">This file is a portable copy of the document. It works without the internet and can be printed or shared.</div>
<h2>Full text</h2>
<pre>${escapeHtml(text)}</pre>`);
}

// RAG chunks overlap by ~120 characters; stitch them back into continuous text.
function mergeChunks(chunks) {
  let out = '';
  for (const chunk of chunks) {
    const part = String(chunk?.content ?? chunk ?? '');
    if (!part) continue;
    if (!out) { out = part; continue; }
    let overlap = 0;
    const max = Math.min(200, out.length, part.length);
    for (let n = max; n > 0; n--) {
      if (out.slice(-n) === part.slice(0, n)) { overlap = n; break; }
    }
    out += overlap ? part.slice(overlap) : `\n\n${part}`;
  }
  return out;
}

// Plain-text copy for the document library (no HTML markup).
export function buildDocumentText(doc, chunks = []) {
  const text = mergeChunks(chunks) || 'No extracted text is available for this document.';
  const header = [
    doc.title,
    doc.original_name ? `Source: ${doc.original_name}` : '',
    doc.tags ? `Tags: ${doc.tags}` : '',
    `Saved: ${new Date().toLocaleString()}`
  ].filter(Boolean).join('\n');
  return `${header}\n\n${text}\n`;
}

export function buildLessonHtml(lesson) {
  const image = lesson.thumbnailData
    ? `<img src="${lesson.thumbnailData}" alt="Lesson thumbnail">`
    : (lesson.thumbnail ? `<img src="${escapeHtml(lesson.thumbnail)}" alt="Lesson thumbnail">` : '');
  const url = `https://www.youtube.com/watch?v=${encodeURIComponent(lesson.youtube_id)}`;
  return shell(lesson.title, `
<h1>${escapeHtml(lesson.title)}</h1>
<div class="meta">${escapeHtml(lesson.channel || '')} · ${escapeHtml(lesson.language || '')} · ${escapeHtml(lesson.subject || '')} · ${escapeHtml(lesson.difficulty || '')}</div>
${image}
<div class="note">The YouTube video itself needs an internet connection and is not copied. The lesson details and notes below are available offline.</div>
<h2>About this lesson</h2>
<p>${escapeHtml(lesson.description || 'No description provided.')}</p>
<h2>Open the video when online</h2>
<p><a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a></p>
<h2>Suggested AI prompts</h2>
<ul>
<li>Explain this lesson in simple terms.</li>
<li>Summarise this topic in five points.</li>
<li>Explain this lesson in Tamil or Hindi.</li>
<li>Give a practical official-statistics example.</li>
<li>Generate six MCQs from this lesson.</li>
</ul>
<div class="meta">Saved ${escapeHtml(new Date().toLocaleString())}</div>`);
}

// Best-effort conversion of a thumbnail to a data URL so the HTML copy is fully offline.
export async function toDataUrl(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
}
