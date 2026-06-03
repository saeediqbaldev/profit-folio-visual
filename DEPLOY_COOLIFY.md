# Deploy Trading Journal on Coolify + VPS

This app ships as a **single Docker container** containing:
- React frontend (built into `dist/`)
- Node.js/Express API
- PostgreSQL 16
- Local file storage for uploads

All data lives in a single persistent volume mounted at `/data`.

---

## 1. Prerequisites

- A VPS (any Linux, 1 vCPU / 1 GB RAM minimum, 2 GB recommended)
- Coolify installed and reachable in your browser
- A domain pointed (A record) at your VPS IP (e.g. `journal.yourdomain.com`)
- This repo pushed to GitHub / Gitea / GitLab

## 2. Push the repo

Make sure these files are in the project root:
- `Dockerfile`
- `docker-compose.yml`
- `supervisord.conf`
- `docker-entrypoint-wrapper.sh`
- `init.sql`
- `server/` folder

Push to your Git provider.

## 3. Create the application in Coolify

1. Open Coolify → **+ New** → **Resource** → **Application**
2. Choose your Git source and select the repo + branch
3. Build pack: **Dockerfile**
4. Dockerfile location: `/Dockerfile` (default)
5. Port exposed by the container: **3000**

## 4. Add the persistent volume

In the application's **Storages** tab, add:

| Source (host or named volume) | Destination (in container) |
|-------------------------------|----------------------------|
| `tjdata` (named volume)       | `/data`                    |

This volume keeps the Postgres data, uploaded screenshots, and avatars across deploys.

> **Do not skip this** — without it, every redeploy will wipe your trades.

## 5. Environment variables (optional)

Defaults work out of the box. You can override:

| Variable      | Default              |
|---------------|----------------------|
| `PORT`        | `3000`               |
| `PGUSER`      | `postgres`           |
| `PGPASSWORD`  | `postgres`           |
| `PGDATABASE`  | `trading_journal`    |
| `UPLOAD_DIR`  | `/data/uploads`      |

Postgres listens only on `127.0.0.1` inside the container — not exposed to the network.

## 6. Domain + SSL

1. In the application's **Domains** tab, add `https://journal.yourdomain.com`
2. Coolify will request a Let's Encrypt certificate automatically
3. Make sure your domain's A record points to the VPS IP **before** clicking deploy

## 7. Deploy

Click **Deploy** in Coolify. First build takes 3–5 minutes (npm install + postgres image).

When the deploy is green:
- Open `https://journal.yourdomain.com`
- Log in with:
  - Username: `Saeeddev`
  - Password: `Saeed@@2026&&`

## 8. Backups (recommended)

Add a Coolify **Scheduled Task** on the application:

```bash
docker exec $(docker ps -qf "name=<your-app-container>") \
  pg_dump -U postgres trading_journal > /data/backups/backup-$(date +%F).sql
```

Run daily. Rotate after 30 days with another scheduled task:
```bash
find /data/backups -name "backup-*.sql" -mtime +30 -delete
```

You can also mount the `/data` volume on the host and `rsync` it offsite.

## 9. Updating the app

Push to your Git branch → Coolify auto-deploys (if webhook is enabled) or hit **Redeploy**.
The `/data` volume persists, so trades and uploads survive every redeploy.

---

## Local testing (before deploying)

```bash
docker compose up --build
# open http://localhost:3000
```

To wipe local data:
```bash
docker compose down -v
```

---

## Security notes

- Auth is a **hardcoded frontend check** (as requested). Anyone who knows your domain can reach `/api/*` directly without credentials. Put the app behind a Coolify-level Basic Auth or restrict the domain to a VPN if you need real protection.
- Change the hardcoded credentials in `src/hooks/useAuth.tsx` and rebuild before exposing publicly.
- The Postgres password (`postgres/postgres`) is internal-only and never exposed outside the container.
