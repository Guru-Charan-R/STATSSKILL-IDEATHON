require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const assessmentRoutes = require('./src/routes/assessments');
const documentRoutes = require('./src/routes/documents');
const videoRoutes = require('./src/routes/videos');
const courseRoutes = require('./src/routes/courses');
const quizRoutes = require('./src/routes/quizzes');
const chatRoutes = require('./src/routes/chat');

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api/', limiter);

const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
app.use('/api/chat', chatLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/chat', chatRoutes);

// serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// serve frontend build if present
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
const fs = require('fs');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    if (fs.existsSync(frontendDist)) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', groq: !!process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || null }));

app.listen(PORT, () => console.log(`StatSkill AI backend running on http://localhost:${PORT}`));