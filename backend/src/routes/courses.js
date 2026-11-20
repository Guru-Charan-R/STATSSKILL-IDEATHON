const express = require('express');
const db = require('../db');
const { authRequired, roleRequired } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', (req, res) => {
  const courses = db.prepare("SELECT c.*, u.name as creator_name, (SELECT COUNT(*) FROM course_lessons cl WHERE cl.course_id=c.id) as lesson_count FROM courses c LEFT JOIN users u ON u.id=c.created_by ORDER BY c.id DESC").all();
  res.json({ courses });
});

router.get('/:id', (req, res) => {
  const course = db.prepare("SELECT c.*, u.name as creator_name FROM courses c LEFT JOIN users u ON u.id=c.created_by WHERE c.id=?").get(req.params.id);
  if (!course) return res.status(404).json({ error: 'Not found' });
  const lessons = db.prepare("SELECT cl.position, v.* FROM course_lessons cl JOIN videos v ON v.id=cl.video_id WHERE cl.course_id=? ORDER BY cl.position").all(req.params.id);
  res.json({ course, lessons });
});

router.post('/', authRequired, roleRequired('admin','trainer'), (req, res) => {
  const { title, description, language, subject, difficulty, video_ids } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const info = db.prepare('INSERT INTO courses(title,description,language,subject,difficulty,created_by) VALUES (?,?,?,?,?,?)')
    .run(title, description || null, language || 'en', subject || null, difficulty || 'beginner', req.user.id);
  const courseId = info.lastInsertRowid;
  (video_ids || []).forEach((vid, idx) => {
    db.prepare('INSERT INTO course_lessons(course_id,video_id,position) VALUES (?,?,?)').run(courseId, vid, idx);
  });
  const course = db.prepare('SELECT * FROM courses WHERE id=?').get(courseId);
  res.status(201).json({ course });
});

router.post('/:id/enroll', authRequired, (req, res) => {
  try { db.prepare('INSERT INTO course_enrollments(user_id,course_id) VALUES (?,?)').run(req.user.id, req.params.id); } catch (e) {}
  res.json({ ok: true });
});

router.get('/enrollments/me', authRequired, (req, res) => {
  const rows = db.prepare("SELECT ce.*, c.title, c.subject, c.language FROM course_enrollments ce JOIN courses c ON c.id=ce.course_id WHERE ce.user_id=?").all(req.user.id);
  res.json({ enrollments: rows });
});

router.patch('/enrollments/:courseId/progress', authRequired, (req, res) => {
  const { progress } = req.body;
  db.prepare('UPDATE course_enrollments SET progress=? WHERE user_id=? AND course_id=?').run(progress, req.user.id, req.params.courseId);
  res.json({ ok: true });
});

module.exports = router;