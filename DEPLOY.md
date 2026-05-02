# Deploy ExpenseApp (Render + Vercel)

This project has:

- `backend/` — Express API + MongoDB
- `frontend/` — React + Vite SPA

## 1) Deploy backend on Render

You can use the included `render.yaml`.

### Option A: Blueprint (recommended)

1. In Render, choose **New +** -> **Blueprint**.
2. Connect this GitHub repo.
3. Render reads `render.yaml` and creates `expenseapp-api`.
4. In Render service settings, set secret env vars:
   - `MONGODB_URI`
   - `JWT_ACCESS_SECRET`
   - `CORS_ORIGIN` (set this after frontend is deployed)

### Option B: Manual web service

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`

Set env vars:

- `MONGODB_URI=<your atlas uri>`
- `JWT_ACCESS_SECRET=<long random secret>`
- `ACCESS_TOKEN_EXPIRES=15m`
- `REFRESH_TOKEN_DAYS=7`
- `CORS_ORIGIN=<your frontend url>`

After deploy, test:

- `GET https://<your-render-host>/health` -> `{ "ok": true }`

## 2) Deploy frontend on Vercel

1. In Vercel, import this GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Environment variable:
   - `VITE_API_BASE_URL=https://<your-render-host>`

`frontend/vercel.json` is included for SPA routing fallback (`/dashboard`, `/profile`, etc.).

## 3) Final CORS setup

Once Vercel gives you your frontend URL:

1. Go back to Render.
2. Set backend `CORS_ORIGIN` exactly to your Vercel URL (example: `https://expenseapp.vercel.app`).
3. Redeploy backend.

If you use Vercel preview deployments too, use comma-separated values:

`CORS_ORIGIN=https://expenseapp.vercel.app,https://expenseapp-git-main-yourname.vercel.app`

## 4) Smoke test checklist

1. Open frontend URL.
2. Sign up (or log in).
3. Add/delete a transaction.
4. Open Profile, upload/remove profile photo.
5. Confirm no CORS errors in browser console.
