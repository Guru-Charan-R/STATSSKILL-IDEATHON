const express = require('express');
const db = require('../db');
const { authRequired, roleRequired } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/competencies', authRequired, (req, res) => {
  const rows = db.prepare('SELECT * FROM competencies').all();
  res.json({ competencies: rows });
});

// submit assessment scores (array)
router.post('/', authRequired, (req, res) => {
  const { scores } = req.body; // [{competency_key, score, target}]
  if (!Array.isArray(scores)) return res.status(400).json({ error: 'scores array required' });
  const compMap = new Map(db.prepare('SELECT id,key FROM competencies').all().map(c => [c.key, c.id]));
  const ins = db.prepare('INSERT INTO assessments(user_id,competency_id,score,target) VALUES (?,?,?,?)');
  for (const s of scores) {
    const cid = compMap.get(s.competency_key);
    if (!cid) continue;
    ins.run(req.user.id, cid, Number(s.score), Number(s.target || 80));
  }
  res.json({ ok: true });
});

// my latest scores per competency
router.get('/me', authRequired, (req, res) => {
  const rows = db.prepare(`
    SELECT c.key, c.name, a.score, a.target, a.taken_at
    FROM competencies c
    LEFT JOIN (
      SELECT competency_id, score, target, taken_at,
        ROW_NUMBER() OVER (PARTITION BY competency_id ORDER BY taken_at DESC) rn
      FROM assessments WHERE user_id = ?
    ) a ON a.competency_id = c.id AND a.rn = 1
  `).all(req.user.id);
  res.json({ scores: rows });
});

// batch/org gaps
router.get('/gaps', authRequired, roleRequired('admin','trainer'), (req, res) => {
  const { batch_id, department } = req.query;
  let sql = `SELECT u.id, u.name, u.department, u.region, c.key, c.name as competency, a.score, a.target FROM users u CROSS JOIN competencies c LEFT JOIN (SELECT user_id, competency_id, score, target, ROW_NUMBER() OVER (PARTITION BY user_id, competency_id ORDER BY taken_at DESC) rn FROM assessments) a ON a.user_id=u.id AND a.competency_id=c.id AND a.rn=1 WHERE u.role='trainee'`;
  const params = [];
  if (batch_id) { sql += ' AND u.batch_id = ?'; params.push(batch_id); }
  if (department) { sql += ' AND u.department = ?'; params.push(department); }
  const rows = db.prepare(sql).all(...params);
  res.json({ gaps: rows });
});

// progress summary
router.get('/progress/:userId', authRequired, (req, res) => {
  const userId = Number(req.params.userId);
  if (req.user.role === 'trainee' && req.user.id !== userId) return res.status(403).json({ error: 'Forbidden' });
  const scores = db.prepare(`
    SELECT c.key, c.name, a.score, a.target, a.taken_at FROM competencies c
    LEFT JOIN (SELECT competency_id, score, target, taken_at, ROW_NUMBER() OVER (PARTITION BY competency_id ORDER BY taken_at DESC) rn FROM assessments WHERE user_id=?) a ON a.competency_id=c.id AND a.rn=1
  `).all(userId);
  const attempts = db.prepare('SELECT COUNT(*) as n, AVG(score) as avg_score FROM quiz_attempts WHERE user_id=?').get(userId);
  const completed = db.prepare('SELECT COUNT(*) as n FROM course_enrollments WHERE user_id=? AND progress>=100').get(userId);
  res.json({ scores, quiz_attempts: attempts, courses_completed: completed.n });
});

module.exports = router;