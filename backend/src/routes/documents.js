const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const db = require('../db');
const { authRequired, roleRequired } = require('../middleware/authMiddleware');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, safe);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['application/pdf','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (ok.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.pdf') || file.originalname.toLowerCase().endsWith('.txt')) cb(null, true);
    else cb(new Error('Unsupported file type'));
  }
});

function chunkText(text, size = 900) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let i = 0;
  while (i < cleaned.length) {
    chunks.push(cleaned.slice(i, i + size));
    i += size - 120;
    if (i < 0) i = 0;
    if (i >= cleaned.length) break;
  }
  return chunks;
}

router.post('/upload', authRequired, roleRequired('admin','trainer'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const { title, tags, status } = req.body;
  const info = db.prepare('INSERT INTO documents(title,filename,original_name,mime_type,size,uploaded_by,status,tags) VALUES (?,?,?,?,?,?,?,?)')
    .run(title || req.file.originalname, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, req.user.id, status === 'approved' ? 'approved' : 'draft', tags || null);
  const docId = info.lastInsertRowid;

  // extract text
  let text = '';
  try {
    if (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
      const data = await pdfParse(fs.readFileSync(req.file.path));
      text = data.text || '';
    } else {
      text = fs.readFileSync(req.file.path, 'utf8');
    }
  } catch (e) {
    text = '';
  }

  const chunks = chunkText(text);
  const insChunk = db.prepare('INSERT INTO document_chunks(document_id,chunk_index,content) VALUES (?,?,?)');
  const insFts = db.prepare('INSERT INTO chunks_fts(content,document_id,chunk_id) VALUES (?,?,?)');
  chunks.forEach((c, idx) => {
    const r = insChunk.run(docId, idx, c);
    insFts.run(c, docId, r.lastInsertRowid);
  });

  const doc = db.prepare('SELECT * FROM documents WHERE id=?').get(docId);
  res.status(201).json({ document: doc, chunks: chunks.length });
});

router.get('/', authRequired, (req, res) => {
  const status = req.query.status;
  let sql = 'SELECT d.*, u.name as uploader_name FROM documents d LEFT JOIN users u ON u.id=d.uploaded_by';
  const params = [];
  if (status) { sql += ' WHERE d.status = ?'; params.push(status); }
  sql += ' ORDER BY d.id DESC';
  const docs = db.prepare(sql).all(...params);
  // trainees only see approved
  if (req.user.role === 'trainee') {
    const approved = docs.filter(d => d.status === 'approved');
    return res.json({ documents: approved });
  }
  res.json({ documents: docs });
});

router.get('/:id', authRequired, (req, res) => {
  const id = Number(req.params.id);
  const doc = db.prepare('SELECT d.*, u.name as uploader_name FROM documents d LEFT JOIN users u ON u.id=d.uploaded_by WHERE d.id=?').get(id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'trainee' && doc.status !== 'approved') return res.status(403).json({ error: 'Forbidden' });
  const chunks = db.prepare('SELECT id,chunk_index,content,page FROM document_chunks WHERE document_id=? ORDER BY chunk_index').all(id);
  res.json({ document: doc, chunks });
});

router.patch('/:id/approve', authRequired, roleRequired('admin'), (req, res) => {
  const id = Number(req.params.id);
  db.prepare("UPDATE documents SET status='approved' WHERE id=?").run(id);
  res.json({ ok: true });
});

router.patch('/:id/archive', authRequired, roleRequired('admin'), (req, res) => {
  const id = Number(req.params.id);
  db.prepare("UPDATE documents SET status='archived' WHERE id=?").run(id);
  res.json({ ok: true });
});

// RAG query: retrieve chunks + ask Groq
router.post('/ask', authRequired, async (req, res) => {
  const { question, document_id, language } = req.body;
  if (!question) return res.status(400).json({ error: 'question required' });

  const statusFilter = req.user.role === 'trainee' ? " AND d.status='approved' " : '';
  const words = question.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
  let sql = "SELECT dc.content, dc.page, d.title, d.id FROM document_chunks dc JOIN documents d ON d.id=dc.document_id WHERE 1=1 " + statusFilter;
  const params = [];
  if (document_id) { sql += " AND dc.document_id = ?"; params.push(document_id); }
  const all = db.prepare(sql).all(...params);
  const scored = all.map(r => {
    const low = r.content.toLowerCase();
    const score = words.reduce((acc, w) => acc + (low.includes(w) ? 1 : 0), 0);
    return { ...r, score };
  }).sort((a, b) => b.score - a.score);
  let rows = scored.filter(r => r.score > 0).slice(0, 6);
  if (rows.length === 0) rows = all.slice(0, 6);

  const context = rows.map((r, i) => `[Source ${i + 1}: ${r.title}${r.page ? ' (page ' + r.page + ')' : ''}]\n${r.content}`).join('\n\n');
  const sources = rows.map(r => ({ title: r.title, page: r.page }));

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.json({ answer: 'Groq API key not configured. Retrieved context:\n' + context, sources, retrieved: rows.length });
  }

  try {
    const Groq = require('groq-sdk');
    const client = new Groq({ apiKey });
    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    const lang = language || 'en';
    const langName = { en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam' }[lang] || 'English';
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: `You are StatSkill AI, an assistant for India's Official Statistical System. Answer using the provided document context. Cite sources by their Source number. If the answer is not in the context, say so honestly. Respond in ${langName}.` },
        { role: 'user', content: `Context:\n${context || '(no relevant passages found)'}\n\nQuestion: ${question}` }
      ],
      temperature: 0.3,
      max_tokens: 1024
    });
    const answer = completion.choices?.[0]?.message?.content || '';
    res.json({ answer, sources, retrieved: rows.length });
  } catch (e) {
    res.status(500).json({ error: 'Groq request failed', detail: e.message, sources });
  }
});

module.exports = router;
