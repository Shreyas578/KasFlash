# Deployment Guide

This guide details how to deploy the **KasFlash** backend to **Railway** and the frontend to **Render**.

## Prerequisites

- [GitHub](https://github.com) account with this repository pushed.
- [Railway](https://railway.app) account.
- [Render](https://render.com) account.

---

## Part 1: Deploy Backend to Railway

1.  **Login to Railway**: Go to [Railway](https://railway.app) and log in.
2.  **New Project**: Click **New Project** > **Deploy from GitHub repo**.
3.  **Select Repository**: Choose your `KasFlash` repository.
4.  **Configuration**:
    - Railway should automatically detect the `Dockerfile` at the root.
    - If asked for variables, add the following (based on your `.env`):
        - `KASPA_NETWORK` (e.g., `testnet-10` or `mainnet`)
        - `PORT` (Railway usually provides this, but defaults to 3001 in our app if not set. Railway overrides it, which is fine.)
    - **Wait**: Railway will prioritize `railway.json` if present.
5.  **Deploy**: Click **Deploy**.
6.  **Verify**:
    - Click on the deployment card to see logs.
    - Wait for the build to finish.
    - You should see `Server running` in the logs.
7.  **Public Domain**:
    - Go to **Settings** -> **Networking**.
    - Click **Generate Domain** (or add a custom one).
    - **COPY THIS URL**. You will need it for the frontend.
    - Example: `https://kas-flash-production.up.railway.app`

---

## Part 2: Deploy Frontend to Render

1.  **Login to Render**: Go to [Render](https://render.com) and log in.
2.  **New Web Service**: Click **New +** > **Web Service**.
3.  **Connect Repo**: Connect your GitHub repository.
4.  **Configuration**:
    - **Name**: `kas-flash-frontend`
    - **Runtime**: `Node`
    - **Build Command**: `npm install && npm run build --workspace=shared && npm run build --workspace=frontend`
    - **Start Command**: `npm start --workspace=frontend`
    - **Root Directory**: `.` (leave empty or use dot)
5.  **Environment Variables**:
    - Scroll down to **Environment Variables**.
    - Add `NEXT_PUBLIC_API_URL`.
    - **Value**: The Railway URL you copied in Part 1 (e.g., `https://kas-flash-production.up.railway.app`). make sure to NOT include a trailing slash / unless your frontend code handles it.
6.  **Deploy**: Click **Create Web Service**.
7.  **Verify**:
    - Wait for the build to complete.
    - Click the link provided by Render (e.g., `https://kas-flash-frontend.onrender.com`) to view your live app.

---

## Troubleshooting

- **Build Fails on Render**: Ensure the Build Command includes building the `shared` workspace first.
- **Frontend can't connect to Backend**: Check the browser console -> Network tab. If requests to `/api/...` are failing, verify `NEXT_PUBLIC_API_URL` is set correctly in Render and that the Railway backend is running.
- **CORS Issues**: The backend is configured with `cors()`, which allows all origins by default. If you restricted it, update `backend/src/index.ts`.
