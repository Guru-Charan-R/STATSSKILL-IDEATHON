const express = require('express');
const db = require('../db');
const { authRequired, roleRequired } = require('../middleware/authMiddleware');
const { Groq } = require('groq-sdk');

const router = express.Router();

// list quizzes (trainees see approved only)
router.get('/', authRequired, (req, res) => {
  let sql = "SELECT q.*, u.name as creator_name, d.title as document_title FROM quizzes q LEFT JOIN users u ON u.id=q.created_by LEFT JOIN documents d ON d.id=q.document_id";
  if (req.user.role === 'trainee') sql += " WHERE q.status='approved'";
  sql += " ORDER BY q.id DESC";
  const quizzes = db.prepare(sql).all();
  res.json({ quizzes });
});

router.get('/:id', authRequired, (req, res) => {
  const quiz = db.prepare("SELECT q.*, u.name as creator_name FROM quizzes q LEFT JOIN users u ON u.id=q.created_by WHERE q.id=?").get(req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'trainee' && quiz.status !== 'approved') return res.status(403).json({ error: 'Forbidden' });
  const questions = db.prepare('SELECT id, question_text, options, competency_key FROM questions WHERE quiz_id=?').all(quiz.id);
  // hide correct answers for trainees? Keep for scoring; but don't expose correct_index
  const safe = questions.map(q => ({ ...q, options: JSON.parse(q.options) }));
  res.json({ quiz, questions: safe });
});

// generate MCQs from a document using Groq
router.post('/generate', authRequired, roleRequired('admin','trainer'), async (req, res) => {
  const { document_id, topic, difficulty, count } = req.body;
  const n = Math.min(Number(count) || 5, 20);
  const doc = document_id ? db.prepare('SELECT * FROM documents WHERE id=?').get(document_id) : null;
  let context = '';
  if (doc) {
    const chunks = db.prepare('SELECT content FROM document_chunks WHERE document_id=? LIMIT 8').all(document_id);
    context = chunks.map(c => c.content).join('\n\n');
  }
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Groq API key not configured' });

  const client = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const prompt = `Generate ${n} multiple-choice questions ${topic ? 'about ' + topic : ''} at ${difficulty || 'medium'} difficulty.
${context ? 'Base them on this source text:\n' + context.slice(0, 6000) : ''}
Return ONLY a JSON array. Each item: {"question":string,"options":[4 strings],"correct_index":0-3,"explanation":string,"competency_key":one of [statistics,data_analysis,digital_tools,survey_methods,census,data_viz,reporting,software]}.`;
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 2048,
      response_format: { type: 'json_object' }
    });
    const raw = completion.choices?.[0]?.message?.content || '[]';
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) { parsed = JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0] || '[]'); }
    const arr = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.items || []);
    res.json({ questions: arr });
  } catch (e) {
    res.status(500).json({ error: 'Generation failed', detail: e.message });
  }
});

// create quiz (with questions)
router.post('/', authRequired, roleRequired('admin','trainer'), (req, res) => {
  const { title, description, document_id, topic, difficulty, status, questions } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const info = db.prepare('INSERT INTO quizzes(title,description,created_by,document_id,topic,difficulty,status) VALUES (?,?,?,?,?,?,?)')
    .run(title, description || null, req.user.id, document_id || null, topic || null, difficulty || 'medium', status === 'approved' ? 'approved' : 'draft');
  const quizId = info.lastInsertRowid;
  (questions || []).forEach(q => {
    db.prepare('INSERT INTO questions(quiz_id,question_text,options,correct_index,explanation,competency_key) VALUES (?,?,?,?,?,?)')
      .run(quizId, q.question, JSON.stringify(q.options), q.correct_index, q.explanation || null, q.competency_key || null);
  });
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id=?').get(quizId);
  res.status(201).json({ quiz });
});

router.patch('/:id/approve', authRequired, roleRequired('admin','trainer'), (req, res) => {
  db.prepare("UPDATE quizzes SET status='approved' WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// submit attempt
router.post('/:id/attempt', authRequired, (req, res) => {
  const quizId = Number(req.params.id);
  const { answers } = req.body; // array of selected indices
  const qs = db.prepare('SELECT id, correct_index FROM questions WHERE quiz_id=?').all(quizId);
  if (!qs.length) return res.status(404).json({ error: 'No questions' });
  let score = 0;
  qs.forEach((q, idx) => { if (answers[idx] === q.correct_index) score++; });
  const pct = (score / qs.length) * 100;
  db.prepare('INSERT INTO quiz_attempts(quiz_id,user_id,score,total,answers) VALUES (?,?,?,?,?)')
    .run(quizId, req.user.id, pct, qs.length, JSON.stringify(answers));
  // update assessments competency scores (avg) - optional: add a score per competency
  res.json({ score, total: qs.length, percentage: pct });
});

router.get('/attempts/me', authRequired, (req, res) => {
  const rows = db.prepare("SELECT qa.*, q.title FROM quiz_attempts qa JOIN quizzes q ON q.id=qa.quiz_id WHERE qa.user_id=? ORDER BY qa.attempted_at DESC").all(req.user.id);
  res.json({ attempts: rows });
});

module.exports = router;
