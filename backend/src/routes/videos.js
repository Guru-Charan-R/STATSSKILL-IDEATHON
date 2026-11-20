const express = require('express');
const db = require('../db');
const { authRequired, roleRequired } = require('../middleware/authMiddleware');

const router = express.Router();

const SUBJECTS = ['Statistics Fundamentals','Data Analysis','Survey Methodology','Census and Data Collection','Statistical Software','Excel and Data Management','Data Visualisation','Government Statistical Reporting','Digital Skills'];
const LANGS = ['en','hi','ta','ml'];

router.get('/subjects', (req, res) => res.json({ subjects: SUBJECTS }));
router.get('/languages', (req, res) => res.json({ languages: LANGS }));

router.get('/', (req, res) => {
  const { language, subject, difficulty, q, featured } = req.query;
  let sql = "SELECT v.*, u.name as submitter_name FROM videos v LEFT JOIN users u ON u.id=v.submitted_by WHERE v.status='approved'";
  const params = [];
  if (language) { sql += ' AND v.language = ?'; params.push(language); }
  if (subject) { sql += ' AND v.subject = ?'; params.push(subject); }
  if (difficulty) { sql += ' AND v.difficulty = ?'; params.push(difficulty); }
  if (q) { sql += ' AND (v.title LIKE ? OR v.description LIKE ? OR v.channel LIKE ?)'; params.push(`%${q}%`,`%${q}%`,`%${q}%`); }
  sql += ' ORDER BY v.id DESC';
  const videos = db.prepare(sql).all(...params);
  // saved flag if auth
  res.json({ videos });
});

router.get('/pending', authRequired, roleRequired('admin','trainer'), (req, res) => {
  const videos = db.prepare("SELECT v.*, u.name as submitter_name FROM videos v LEFT JOIN users u ON u.id=v.submitted_by WHERE v.status='pending' ORDER BY v.id DESC").all();
  res.json({ videos });
});

router.get('/:id', (req, res) => {
  const v = db.prepare("SELECT v.*, u.name as submitter_name FROM videos v LEFT JOIN users u ON u.id=v.submitted_by WHERE v.id=?").get(req.params.id);
  if (!v) return res.status(404).json({ error: 'Not found' });
  res.json({ video: v });
});

router.post('/', authRequired, roleRequired('admin','trainer'), (req, res) => {
  const { title, youtube_id, channel, language, subject, difficulty, description, duration } = req.body;
  if (!title || !youtube_id) return res.status(400).json({ error: 'title and youtube_id required' });
  const id = youtube_id.trim();
  const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  const info = db.prepare('INSERT INTO videos(title,youtube_id,channel,language,subject,difficulty,description,duration,thumbnail,submitted_by,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(title, id, channel || null, language || 'en', subject || null, difficulty || 'beginner', description || null, duration || null, thumb, req.user.id, req.user.role === 'admin' ? 'approved' : 'pending');
  const video = db.prepare('SELECT * FROM videos WHERE id=?').get(info.lastInsertRowid);
  res.status(201).json({ video });
});

router.patch('/:id/approve', authRequired, roleRequired('admin'), (req, res) => {
  db.prepare("UPDATE videos SET status='approved' WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

router.patch('/:id/reject', authRequired, roleRequired('admin'), (req, res) => {
  db.prepare("UPDATE videos SET status='rejected' WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// saved videos
router.get('/saved/me', authRequired, (req, res) => {
  const videos = db.prepare("SELECT v.* FROM saved_videos sv JOIN videos v ON v.id=sv.video_id WHERE sv.user_id=? ORDER BY sv.saved_at DESC").all(req.user.id);
  res.json({ videos });
});

router.post('/:id/save', authRequired, (req, res) => {
  try { db.prepare('INSERT INTO saved_videos(user_id,video_id) VALUES (?,?)').run(req.user.id, req.params.id); } catch (e) {}
  res.json({ ok: true });
});

router.delete('/:id/save', authRequired, (req, res) => {
  db.prepare('DELETE FROM saved_videos WHERE user_id=? AND video_id=?').run(req.user.id, req.params.id);
  res.json({ ok: true });
});

// progress
router.post('/:id/progress', authRequired, (req, res) => {
  const { position_seconds, completed } = req.body;
  db.prepare(`INSERT INTO video_progress(user_id,video_id,position_seconds,completed,updated_at) VALUES (?,?,?,?,datetime('now'))
    ON CONFLICT(user_id,video_id) DO UPDATE SET position_seconds=excluded.position_seconds, completed=excluded.completed, updated_at=datetime('now')`).run(req.user.id, req.params.id, position_seconds || 0, completed ? 1 : 0);
  res.json({ ok: true });
});

router.get('/:id/progress', authRequired, (req, res) => {
  const p = db.prepare('SELECT * FROM video_progress WHERE user_id=? AND video_id=?').get(req.user.id, req.params.id);
  res.json({ progress: p || null });
});

module.exports = router;