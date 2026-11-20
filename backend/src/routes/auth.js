const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, authRequired } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password, role, department, region, designation } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  const allowedRole = (role === 'trainer' || role === 'trainee') ? role : 'trainee';
  // admin registration not allowed publicly
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users(name,email,password_hash,role,department,region,designation) VALUES (?,?,?,?,?,?,?)');
  const info = stmt.run(name, email, hash, allowedRole, department || null, region || null, designation || null);
  const user = db.prepare('SELECT id,name,email,role,department,region,designation FROM users WHERE id=?').get(info.lastInsertRowid);
  const token = signToken(user);
  res.json({ user, token });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
  const safe = { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, region: user.region, designation: user.designation };
  const token = signToken(safe);
  res.json({ user: safe, token });
});

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT id,name,email,role,department,region,designation,batch_id FROM users WHERE id=?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

router.post('/forgot-password', (req, res) => {
  // placeholder: in production send email; here just acknowledge
  res.json({ message: 'If the email exists, a reset link has been sent.' });
});

module.exports = router;