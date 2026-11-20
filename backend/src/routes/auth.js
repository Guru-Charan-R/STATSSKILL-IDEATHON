const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { signToken, authRequired, JWT_SECRET } = require('../middleware/authMiddleware');

const router = express.Router();

const safeUser = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role,
  department: u.department, region: u.region, designation: u.designation
});

// Serverless lambdas each have their own temporary SQLite DB, so a user created
// on one instance can be missing on another. This signed receipt lets the same
// browser re-authenticate a locally known account without storing the password.
function signReceipt(user, password) {
  const pv = crypto.createHmac('sha256', JWT_SECRET).update(`${user.email}:${password}`).digest('hex');
  return jwt.sign({ ...safeUser(user), pv }, JWT_SECRET, { expiresIn: '30d' });
}

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
  res.json({ user, token, receipt: signReceipt(user, password) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
  const safe = safeUser(user);
  const token = signToken(safe);
  res.json({ user: safe, token, receipt: signReceipt(safe, password) });
});

// Fallback for a browser that registered/logged in before this lambda's DB was
// reset. The receipt is signed by the server and proves the email/password pair.
router.post('/relogin', (req, res) => {
  const { email, password, receipt } = req.body;
  if (!email || !password || !receipt) return res.status(400).json({ error: 'email, password and receipt required' });
  let payload;
  try { payload = jwt.verify(receipt, JWT_SECRET); } catch { return res.status(401).json({ error: 'Invalid credentials' }); }
  if (payload.email !== email) return res.status(401).json({ error: 'Invalid credentials' });
  const pv = crypto.createHmac('sha256', JWT_SECRET).update(`${email}:${password}`).digest('hex');
  if (pv !== payload.pv) return res.status(401).json({ error: 'Invalid credentials' });
  const user = safeUser(payload);
  res.json({ user, token: signToken(user), receipt });
});

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT id,name,email,role,department,region,designation,batch_id FROM users WHERE id=?').get(req.user.id);
  if (user) return res.json({ user });
  // On serverless each lambda instance has its own temporary SQLite DB, so a
  // freshly registered user may not exist on the instance handling this request.
  // The signed token is authoritative — rebuild the session from its payload.
  const { id, name, email, role } = req.user;
  res.json({ user: { id, name, email, role, department: null, region: null, designation: null, batch_id: null } });
});

router.post('/forgot-password', (req, res) => {
  // placeholder: in production send email; here just acknowledge
  res.json({ message: 'If the email exists, a reset link has been sent.' });
});

module.exports = router;
