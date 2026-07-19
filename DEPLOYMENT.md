# Deploying Rentora for free (public link)

Rentora has two parts, hosted on two free services:

- **Frontend** (React) → **Vercel**
- **Backend** (FastAPI) → **Render**

End result: a public URL like `https://rentora.vercel.app` you can open and share.

**Before you start:** push this repo to **GitHub** (both hosts deploy from a Git repo). Config files are already included: `render.yaml` (backend) and `frontend/vercel.json` (SPA routing).

---

## Step 1 — Backend on Render

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. **New → Blueprint**, choose this repo. Render reads `render.yaml` and creates the `rentora-api` web service. (Or **New → Web Service** manually with: Root Directory `backend`, Build `pip install -r requirements.txt`, Start `alembic upgrade head && python seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT`, Plan **Free**.)
3. Confirm the environment variables (`render.yaml` sets sensible defaults; `SECRET_KEY` is auto-generated).
4. **Create / Deploy.** You get a URL like `https://rentora-api.onrender.com`.
5. Verify it works: open `https://rentora-api.onrender.com/docs` — you should see the API docs.

Copy your API URL; you need it next.

## Step 2 — Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New → Project → Import** this repo.
3. Set **Root Directory** to `frontend` (framework auto-detects as **Vite**).
4. Add **Environment Variables** (use your Render URL from Step 1):
   - `VITE_API_URL` = `https://rentora-api.onrender.com/api/v1`
   - `VITE_UPLOAD_ORIGIN` = `https://rentora-api.onrender.com`
5. **Deploy.** You get your public URL, e.g. `https://rentora.vercel.app`.

## Step 3 — Connect them (CORS)

The backend must allow requests from your Vercel domain:

1. Render → your service → **Environment** → set `CORS_ORIGINS` = `https://rentora.vercel.app` (your exact Vercel URL).
2. Save — Render redeploys automatically.

## Step 4 — Open your site

Visit your Vercel URL and log in with a demo account (password `Demo1234!`):

- `admin@rentora.demo`, `renter@rentora.demo`, `owner@rentora.demo`

---

## Changing the site after it's live

- **Every push to your GitHub `main` branch auto-redeploys both** Vercel and Render — no manual step.
- Other branches / pull requests get **preview URLs** on Vercel so you can test before going live.
- Env vars can be changed in each dashboard, then redeploy.

## Free-tier things to know

- **Render sleeps** after ~15 min idle; the first request wakes it (~30–60 s). Normal for free.
- **SQLite on Render is temporary.** On each restart the database resets and the demo data re-seeds automatically (demo accounts are always there), but data users create won't persist across restarts. That's fine for a demo/submission.
- **For real persistence:** add a free **Render PostgreSQL**, set `DATABASE_URL` to its connection string, and add `psycopg2-binary` to `backend/requirements.txt`. Uploaded images would also need object storage (e.g. Cloudinary/S3) since the disk is ephemeral.
