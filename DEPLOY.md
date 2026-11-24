# SpidyHost (cPanel) Deployment Guide — Charu Garments

Deploy the full stack (store + admin + API) on SpidyHost using **Setup Node.js App**, same pattern as My India Service (`~/mis`).

One Node process serves everything on `https://charustore.in`.

```
Browser ──► charustore.in ──► cPanel Node.js App (~/charustore.in)
                                    │
                                    ▼
                              server.js → backend/server.js
                               ├── /api/*           → REST API
                               ├── /admin/*         → admin/dist (React SPA)
                               └── /*               → frontend/dist (store SPA)
                                    │
                                    ▼
                              MongoDB Atlas (e-commerce DB)
```

## CloudLinux constraints

1. **npm installs only from the app-root `package.json`** into a virtualenv  
   (`~/charustore.in/node_modules` → `~/nodevenv/charustore.in/20/...`).  
   Root [`package.json`](package.json) must list all runtime deps the server needs.
2. **`omit=dev` is enforced** — Vite never runs on the server. Build locally and commit `frontend/dist` + `admin/dist`.
3. Use **git**, not ZIP upload (cPanel antivirus).
4. Keep code in `~/charustore.in`, not `public_html`.

## Prerequisites

- cPanel **Setup Node.js App** with **Node 20.x**
- Domain `charustore.in` linked + SSL (AutoSSL)
- MongoDB Atlas cluster
- GitHub access to `My-India-Service/Charu-garments`

## Step 1: MongoDB Atlas

1. Create a free cluster + DB user.
2. Network Access: allow the SpidyHost IP (or `0.0.0.0/0` for testing).
3. Connection string **without** a DB path, e.g.  
   `mongodb+srv://user:pass@cluster.mongodb.net`  
   The app appends `/e-commerce` in [`backend/config/mongodb.js`](backend/config/mongodb.js).

## Step 2: Build store + admin locally and commit

```bash
npm run install:all
npm install                 # root deps for local start
npm run build:apps         # frontend/dist + admin/dist
git add frontend/dist admin/dist
git commit -m "build apps for SpidyHost deploy"
git push
```

## Step 3: Get the code on the server

cPanel → **Terminal**:

```bash
cd ~
git clone https://github.com/My-India-Service/Charu-garments.git charustore.in
cd charustore.in
```

(Private repo: add a deploy key, same approach as SocialIQ / MIS.)

## Step 4: Create / verify the Node.js app

cPanel → **Setup Node.js App**

| Setting | Value |
|---------|-------|
| Node.js version | **20.x** (e.g. 20.20.2) |
| Application mode | Production |
| Application root | `charustore.in` |
| Application URL | `charustore.in` (empty path) |
| Application startup file | `server.js` |

## Step 5: Environment variables

Add in the Node.js app panel (Passenger). See [`backend/.env.example`](backend/.env.example).

| Variable | Required | Example |
|----------|----------|---------|
| `PORT` | Yes | value shown by cPanel |
| `MONGODB_URI` | Yes | `mongodb+srv://user:pass@cluster.mongodb.net` |
| `JWT_SECRET` | Yes | long random string |
| `ADMIN_EMAIL` | Yes | admin login email |
| `ADMIN_PASSWORD` | Yes | admin login password |
| `CLOUDINARY_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | |
| `CLOUDINARY_SECRET_KEY` | Yes | |
| `FRONTEND_URL` | Yes | `https://charustore.in` |
| `CLOUDINARY_FOLDER` | No | `charu_garments` |
| Stripe / Razorpay / SMTP / `HF_TOKEN` | No | as needed |

Optional for Terminal scripts only: copy the same values into `~/charustore.in/.env` (do not commit).

## Step 6: Install and restart

1. **Run NPM Install**
2. **Restart**

Verify venv in Terminal (every new session):

```bash
source ~/nodevenv/charustore.in/20/bin/activate
cd ~/charustore.in
node -e "import('express').then(() => console.log('deps OK'))"
```

## Step 7: Test

- `https://charustore.in/api/health` → `{"status":"ok",...}`
- `https://charustore.in/` → store
- `https://charustore.in/admin/` → admin login

## Deploy updates

See [SPIDYHOST_PULL.md](SPIDYHOST_PULL.md).

| Change type | Local | Server |
|-------------|-------|--------|
| Frontend / admin UI | `npm run build:apps`, commit dists, push | `git pull`, **Restart** |
| Backend only | commit, push | `git pull`, **Restart** (+ Run NPM Install if root deps changed) |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `node: command not found` | `source ~/nodevenv/charustore.in/20/bin/activate` every Terminal session |
| 503 / `Cannot find module 'express'` | Root `package.json` deps missing → **Run NPM Install** + **Restart** |
| `sh: vite: command not found` | Do not build on the server; commit dists locally |
| Blank page but `/api/health` works | Missing/stale `frontend/dist` or `admin/dist` |
| Admin assets 404 | Rebuild with `base: '/admin/'`, commit `admin/dist` |
| MongoDB failed | Atlas IP allowlist + `MONGODB_URI` (no `/e-commerce` in URI; code adds it) |
| Old PHP/static site showing | Domain must map to the Node.js app, not `public_html` |
