# StatSkill AI

AI-Enabled Competency & Capacity Building Platform for India's Official Statistical System (SIH26101).

## Stack
- Frontend: React 19 + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: SQLite (node:sqlite)
- AI: Groq API (chatbot + MCQ generation)
- Document RAG: chunking + keyword retrieval + Groq
- Video Library: YouTube embeds, courses, progress

## Local setup

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env and set GROQ_API_KEY
npm install
node seed.js
npm start
```
Backend runs on http://localhost:4000.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5173 (proxies /api to backend).

## Demo accounts
- Admin: admin@statskill.ai / Admin@123
- Trainer: trainer@statskill.ai / Trainer@123
- Trainee: trainee@statskill.ai / Trainee@123

## Groq setup
1. Get an API key from https://console.groq.com
2. Set GROQ_API_KEY in backend/.env
3. Optionally set GROQ_MODEL (default llama-3.3-70b-versatile)

The key is read only by the backend and never exposed to the browser.

## Production build
```bash
cd frontend && npm run build
cd ../backend && npm start
```
Backend serves frontend/dist automatically.

## Features
- Role-based auth (Admin/Trainer/Trainee)
- Competency gap dashboard
- Groq AI chatbot (streaming, multilingual EN/HI/TA/TE/ML)
- Personalized learning suggestions
- AI MCQ generation from documents with trainer approval
- Offline-first PWA (service worker)
- Content upload + RAG over PDFs/TXT
- YouTube Video Library with courses, bookmarks, progress
- Quiz attempts and progress tracking
- Global floating AI assistant with context awareness