# Pull updates on SpidyHost — Charu Garments

Live app: `https://charustore.in`  
Server path: `~/charustore.in`  
Full first-time setup: [DEPLOY.md](DEPLOY.md)

## 1. On your computer, push first

If store or admin UI changed, build and commit dists (server cannot run Vite):

```bash
npm run build:apps
git add frontend/src frontend/dist admin/src admin/dist
git commit -m "Describe your change"
git push
```

Backend-only: commit and push (skip build if UI did not change).

## 2. SpidyHost Terminal

```bash
source ~/nodevenv/charustore.in/20/bin/activate
cd ~/charustore.in
```

Prompt should look like `[charustore.in (20)] ...`.

## 3. Pull

```bash
git pull
```

If blocked by local server edits:

```bash
git reset --hard origin/main
```

Do **not** commit on the server.

## 4. Install and restart

- Root [`package.json`](package.json) deps changed → **Run NPM Install**
- Always → **Setup Node.js App** → `charustore.in` → **Restart**

## 5. Verify

- `https://charustore.in/api/health`
- Store home + `/admin/`
- Hard refresh if old UI shows (Ctrl+Shift+R / Cmd+Shift+R)
