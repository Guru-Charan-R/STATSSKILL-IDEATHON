const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authRequired, roleRequired } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authRequired, roleRequired('admin'), (req, res) => {
  const users = db.prepare('SELECT id,name,email,role,department,region,designation,batch_id,created_at FROM users ORDER BY id').all();
  res.json({ users });
});

router.post('/', authRequired, roleRequired('admin'), (req, res) => {
  const { name, email, password, role, department, region, designation, batch_id } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'missing fields' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email exists' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users(name,email,password_hash,role,department,region,designation,batch_id) VALUES (?,?,?,?,?,?,?,?)')
    .run(name, email, hash, role, department || null, region || null, designation || null, batch_id || null);
  const user = db.prepare('SELECT id,name,email,role,department,region,designation,batch_id FROM users WHERE id=?').get(info.lastInsertRowid);
  res.status(201).json({ user });
});

router.patch('/:id', authRequired, roleRequired('admin'), (req, res) => {
  const id = Number(req.params.id);
  const { name, role, department, region, designation, batch_id } = req.body;
  db.prepare(`UPDATE users SET name=COALESCE(?,name), role=COALESCE(?,role), department=COALESCE(?,department), region=COALESCE(?,region), designation=COALESCE(?,designation), batch_id=COALESCE(?,batch_id), updated_at=datetime('now') WHERE id=?`)
    .run(name, role, department, region, designation, batch_id, id);
  const user = db.prepare('SELECT id,name,email,role,department,region,designation,batch_id FROM users WHERE id=?').get(id);
  res.json({ user });
});

router.delete('/:id', authRequired, roleRequired('admin'), (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM users WHERE id=?').run(id);
  res.json({ ok: true });
});

router.get('/departments', authRequired, (req, res) => {
  const rows = db.prepare('SELECT * FROM departments ORDER BY id').all();
  res.json({ departments: rows });
});

router.post('/departments', authRequired, roleRequired('admin'), (req, res) => {
  const { name, region } = req.body;
  const info = db.prepare('INSERT INTO departments(name,region) VALUES (?,?)').run(name, region || null);
  res.status(201).json({ department: { id: info.lastInsertRowid, name, region } });
});

router.get('/batches', authRequired, (req, res) => {
  const rows = db.prepare('SELECT b.*, d.name as department_name, u.name as trainer_name FROM batches b LEFT JOIN departments d ON d.id=b.department_id LEFT JOIN users u ON u.id=b.trainer_id ORDER BY b.id').all();
  res.json({ batches: rows });
});

router.post('/batches', authRequired, roleRequired('admin','trainer'), (req, res) => {
  const { name, department_id, trainer_id } = req.body;
  const info = db.prepare('INSERT INTO batches(name,department_id,trainer_id) VALUES (?,?,?)').run(name, department_id || null, trainer_id || null);
  res.status(201).json({ batch: { id: info.lastInsertRowid, name, department_id, trainer_id } });
});

module.exports = router;