# Publishing StatSkill AI

## Important: there is no "connect Vercel to OpenCode" step

OpenCode is the coding agent used to build the app. Vercel is a host. You publish by
connecting Vercel to a **GitHub repository**, not to OpenCode.

This app has two parts, so it needs two hosts:

| Part | Folder | Suggested host |
| --- | --- | --- |
| Frontend (React + Vite) | `frontend/` | Vercel |
| Backend (Express + SQLite + Groq) | `backend/` | Render, Railway or Fly.io |

Vercel is serverless and does not reliably persist a SQLite file, so the backend is
deployed separately. `GROQ_API_KEY` stays on the backend host only.

---

## 1. Push the code to GitHub

This workspace is not a git repository yet. From the project root:

```bash
git init
git add .
git commit -m "StatSkill AI"
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

`.gitignore` already excludes `.env`, `node_modules/`, `backend/data/`, `backend/uploads/`
and `frontend/dist/`.

---

## 2. Deploy the backend (example: Render)

1. Render → **New** → **Web Service** → connect the GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. Add a **persistent disk** and mount it at `/data` (Render free instances otherwise
   lose the SQLite file on restart). Set:
   - `DB_PATH=/data/statskill.db`
   - For uploaded PDFs, also mount a disk at `/app/uploads` or accept that uploads are temporary.
4. Environment variables:

   ```text
   PORT=4000
   GROQ_API_KEY=<your real Groq key>
   GROQ_MODEL=openai/gpt-oss-120b
   FRONTEND_ORIGIN=https://<your-app>.vercel.app
   DB_PATH=/data/statskill.db
   ```

5. After the first deploy, open the service's **Shell** tab and run:

   ```bash
   npm run setup
   ```

   This runs `seed.js` (demo accounts, competencies) and `seed_content_update.js`
   (20 verified videos, 6 quizzes, 12 documents). Do **not** run `seed_extra.js` —
   it adds an unrelated demo video.

6. Verify: `https://<your-backend>.onrender.com/api/health` should return
   `{"status":"ok","groq":true,"model":"openai/gpt-oss-120b"}`.

---

## 3. Deploy the frontend (Vercel)

1. Vercel → **Add New** → **Project** → import the same GitHub repo.
2. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Environment variable:

   ```text
   VITE_API_URL=https://<your-backend>.onrender.com/api
   ```

   This is a `VITE_` variable so it is compiled into the frontend bundle — it will be
   public. Only put the **backend URL** here, never the Groq key.

4. `frontend/vercel.json` contains a catch-all rewrite to `index.html` so deep links
   like `/videos` and `/offline` work after refresh.
5. Deploy. You get `https://<your-app>.vercel.app`.

---

## 4. Finish and test

1. Update the backend's `FRONTEND_ORIGIN` to the Vercel URL (comma-separated origins are
   supported, e.g. `http://localhost:5173,https://<your-app>.vercel.app`) and redeploy.
2. Open the Vercel URL and log in:
   - `admin@statskill.ai` / `Admin@123`
   - `trainer@statskill.ai` / `Trainer@123`
   - `trainee@statskill.ai` / `Trainee@123`
3. Check the chatbot, video library, documents/RAG and quizzes.

---

## Local development (unchanged)

No env vars needed. `npm run dev` in `backend/` and `npm run dev` in `frontend/`;
Vite proxies `/api` to `http://localhost:4000`.

## If everyone is on the same Wi-Fi

You don't need Vercel. Open `http://<your-machine-ip>:5173` on the other computers
while both dev servers are running. Vercel is for a permanent public link.
