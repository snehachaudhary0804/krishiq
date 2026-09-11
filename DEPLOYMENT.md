# Deployment Guide (Free Tier: Render + Vercel + MongoDB Atlas)

This project includes ready-made config files so you don't have to configure hosting platforms
from scratch:

- `render.yaml` — deploys the **backend** on [Render](https://render.com)
- `frontend/vercel.json` — deploys the **frontend** on [Vercel](https://vercel.com)

## 1. Database — MongoDB Atlas (free)

1. Create a free account at https://www.mongodb.com/atlas
2. Create a free (M0) cluster.
3. Under **Database Access**, create a user with a password.
4. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) — fine for a hackathon demo.
5. Click **Connect → Drivers**, copy the connection string. It looks like:
 `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/krishiqueue?retryWrites=true&w=majority`

## 2. Backend — Render

1. Push this project to a GitHub repository.
2. In Render, click **New → Blueprint**, connect your repo. Render will detect `render.yaml`
 automatically and create the service.
3. Render will ask you to fill in the two `sync: false` variables:
 - `MONGO_URI` → paste your Atlas connection string from step 1
 - `CLIENT_ORIGIN` → your Vercel frontend URL (you'll get this in step 3 — you can update it
 after the frontend is deployed too)
4. Deploy. Once live, note your backend URL, e.g. `https://krishiqueue-backend.onrender.com`.
5. Check it's alive: open `https://krishiqueue-backend.onrender.com/api/health` — should show
 `{"status":"ok", ...}`.

> Free Render web services sleep after inactivity and take ~30–50s to wake up on the first
> request. That's normal on the free tier.

## 3. Frontend — Vercel

1. In Vercel, click **New Project**, import the same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Add an environment variable:
 - `VITE_API_URL` = `https://krishiqueue-backend.onrender.com/api` (your Render URL + `/api`)
4. Deploy. Vercel will use `frontend/vercel.json` automatically for SPA routing.
5. Once live, copy the Vercel URL (e.g. `https://krishiqueue.vercel.app`) and go back to Render →
 your backend's environment variables → set `CLIENT_ORIGIN` to that URL → save (this triggers a
 redeploy so CORS allows your frontend to call the API).

## 4. Seed demo data (optional)

Render gives you a **Shell** tab on your service. Open it and run:

```bash
npm run seed
```

This creates a demo admin (`agency@admin` / `admin123`), operator (`desk1@operator` / `operator123`), one
centre, and two crops with MSP rates.

## 5. You're live 

- Frontend: `https://krishiqueue.vercel.app`
- Backend health check: `https://krishiqueue-backend.onrender.com/api/health`

If something doesn't load, check the browser console for CORS or network errors first — 9 times
out of 10 it's `CLIENT_ORIGIN` (backend) or `VITE_API_URL` (frontend) being mismatched or missing
the `/api` suffix.
