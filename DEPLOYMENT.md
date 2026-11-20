# Publishing StatSkill AI

## Important: there is no "connect Vercel to OpenCode" step

OpenCode is the coding agent used to build the app. Vercel is a host. You publish by
connecting Vercel to a **GitHub repository**, not to OpenCode.

The app is split into two Vercel projects:

| Project | Source in repo | Purpose |
| --- | --- | --- |
| Backend | root (`vercel.json` → `backend/server.js`) | Express API + Groq + SQLite |
| Frontend | `frontend/` (`frontend/vercel.json`) | React + Vite site |

The backend runs as a Vercel serverless function. Because Vercel's filesystem is
temporary, the SQLite file and uploaded PDFs live in `/tmp` and the app re-seeds
itself on a cold start. **Data resets when the function restarts or you redeploy.**
That is fine for a hackathon demo; for a production system use Render/Railway with a
persistent disk and a hosted database (see the alternative at the end).

---

## 1. Push the code to GitHub

This workspace was not a git repository, so it has been initialised and committed
locally. Add a remote and push:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

`.gitignore` excludes `.env`, `node_modules/`, `backend/data/`, `backend/uploads/`
and `frontend/dist/`, so your Groq key is never uploaded.

---

## 2. Deploy the backend on Vercel

1. Vercel → **Add New** → **Project** → import the GitHub repo.
2. Keep the **Root Directory** as the repository root (`.`). Vercel detects the
   root `vercel.json`, which builds `backend/server.js` as a serverless function.
3. Framework Preset: **Other**. Build/Output are handled by `vercel.json`.
4. Add environment variables:

   ```text
   GROQ_API_KEY=<your Groq key>
   GROQ_MODEL=openai/gpt-oss-120b
   FRONTEND_ORIGIN=https://<your-frontend>.vercel.app
   ```

   `FRONTEND_ORIGIN` can be left unset for the demo (CORS then allows any origin),
   but set it to your frontend URL for better security. `DB_PATH` and `UPLOADS_DIR`
   default to `/tmp/...` when running on Vercel.

5. Deploy. Note the backend URL, e.g. `https://statskill-api.vercel.app`.
6. Test: `https://statskill-api.vercel.app/api/health` should return
   `{"status":"ok","groq":true,"model":"openai/gpt-oss-120b"}`.

**Limits on the Hobby plan:** serverless functions time out after ~10 seconds, so
long Groq streaming answers may be cut off. Data is not durable.

---

## 3. Deploy the frontend on Vercel

1. Vercel → **Add New** → **Project** → import the **same** GitHub repo.
2. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Environment variable:

   ```text
   VITE_API_URL=https://<your-backend>.vercel.app/api
   ```

   This is a `VITE_` variable, so it is compiled into the public bundle. Only put
   the backend **URL** here — never the Groq key.

4. `frontend/vercel.json` rewrites all routes to `index.html`, so `/videos` and
   `/offline` work after a refresh.
5. Deploy. You get `https://<your-app>.vercel.app`.

---

## 4. Finish and test

1. If you set `FRONTEND_ORIGIN` on the backend, make sure it matches the Vercel
   frontend URL and redeploy the backend.
2. Open the frontend URL and log in:
   - `admin@statskill.ai` / `Admin@123`
   - `trainer@statskill.ai` / `Trainer@123`
   - `trainee@statskill.ai` / `Trainee@123`
3. Check videos, quizzes, documents/RAG, the chatbot and all three languages.

---

## Local development (unchanged)

No Vercel env vars needed. In `backend/` run `npm run dev`, in `frontend/` run
`npm run dev`. Vite proxies `/api` to `http://localhost:4000`.

## Alternative: durable backend (recommended for production)

Deploy `backend/` to Render or Railway with a persistent disk, set
`DB_PATH=/data/statskill.db`, then run `npm run setup` once in the host shell to
seed users and content. Keep the frontend project on Vercel pointing at that URL.
See the earlier notes in this file's history or ask me to regenerate those steps.
