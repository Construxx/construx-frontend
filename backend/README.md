# CONSTRUX Backend (NestJS + Prisma + PostgreSQL)

Project management + procurement + building digital twin, with an AI layer (Claude).

The active frontend is the Vite app in the repository root. It calls this Nest API; the legacy root `server.ts` in-memory demo API is not used by the root `dev` or `start` scripts.

## Setup (Windows PowerShell)

```powershell
# From the repository root, start PostgreSQL with the backend compose file:
docker compose -f backend/docker-compose.yml up -d

# Install backend dependencies (from repository root)
npm install --prefix backend

# Copy backend/.env.example to backend/.env and set unique random JWT secrets (>=32 chars).
# Set DATABASE_URL to your Postgres connection string.

# Apply migrations and seed local demo data (run seed only in non-production)
npm --prefix backend run db:setup

# Start API (one terminal)
npm run backend:dev      # http://localhost:4000 (health: /health)

# Start frontend (another terminal, repository root)
npm run dev              # http://localhost:5173
```

Copy the root `.env.example` to `.env` if using a direct API origin. In local Vite development the default is the `/api` proxy to port 4000. Set `ANTHROPIC_API_KEY` to enable natural-language AI answers; rule-based risk and procurement workflows remain available without it. For production, set `VITE_API_BASE_URL` at frontend build time and set `FRONTEND_URL` to the exact frontend origin(s). If frontend and API are cross-site, use `AUTH_COOKIE_SAME_SITE=none` only behind HTTPS.

Local development seed logins (password `password123`): admin@construx.dev, engineer@construx.dev,
procurement@construx.dev, viewer@construx.dev. These credentials are demo-only and must never be deployed.

## Roles
ADMIN (everything) · SITE_ENGINEER (tasks, site updates, docs, deliveries, building assets)
· PROCUREMENT_OFFICER (materials, suppliers, POs) · VIEWER (read-only).
Send `Authorization: Bearer <accessToken>` on every request except /auth/* and /health.

## The demo story (matches the product data flow)
1. Log in as engineer. `GET /projects` -> Victoria Heights id.
2. `GET /projects/:id/materials` -> note "Electrical cable" id (1200 m on site, ~20 days cover).
3. `POST /projects/:id/site-updates` `{ "note":"Cable remaining 600m","materialId":"<cable id>","remainingQty":600 }`
   -> response includes a new **PROCUREMENT alert** (10 days of cover, suggested qty + supplier).
4. `POST /ai/risk-check/:id` and `POST /ai/procurement-suggestion/:id` (Claude analysis).
5. Log in as procurement. `POST /purchase-orders` `{ "materialId","supplierId","quantity","cost" }` using the alert's `suggestion`.
6. `PATCH /purchase-orders/:id/deliver` -> stock updated, budget updated, alert auto-resolved.
7. As admin: `POST /projects/:id/handover` `{ "force": true }` -> Building/Floors/Rooms/Equipment created from tasks.
8. `GET /buildings/:id` -> floor picker; `GET /buildings/:id/floors/:floorId/rooms/:roomId` -> room detail.
9. `POST /ai/building-check/:buildingId` -> flags overdue equipment, creates alerts + maintenance tasks.
   (Seeded "Lekki Office Block" is already a building with an overdue AC unit.)

## API
Auth: POST /auth/register|login|refresh, GET /auth/me · GET /users
Projects: GET|POST /projects · GET|PATCH /projects/:id · GET /projects/:id/dashboard
Tasks: GET|POST /projects/:id/tasks · PATCH|DELETE /tasks/:id  (tasks with level+roomName+systemType/equipmentName feed handover; progress % auto-derives from DONE tasks)
Milestones: GET|POST /projects/:id/milestones · PATCH /milestones/:id
Site updates: GET|POST /projects/:id/site-updates (multipart: note, [materialId, remainingQty], [photo])
Documents: GET|POST /projects/:id/documents (multipart: file, [title, type]) · DELETE /documents/:id
Materials/inventory: GET|POST /projects/:id/materials · GET /projects/:id/inventory · PATCH /materials/:id · GET /materials/:id/logs
Suppliers: GET|POST /suppliers · PATCH /suppliers/:id
Purchase orders: GET /projects/:id/purchase-orders · POST /purchase-orders · PATCH /purchase-orders/:id/deliver|cancel
Alerts: GET /projects/:id/alerts · GET /buildings/:id/alerts · POST /projects/:id/alerts/scan · PATCH /alerts/:id/resolve
Buildings: POST /projects/:id/handover · GET /buildings · GET /buildings/:id · GET /buildings/:id/floors · GET /buildings/:id/floors/:floorId/rooms/:roomId
Assets: POST /floors/:id/rooms · POST /rooms/:id/equipment · PATCH /equipment/:id · POST /rooms/:id/systems · PATCH /systems/:id
Maintenance: GET|POST /buildings/:id/maintenance-tasks · PATCH /maintenance-tasks/:id (DONE resets equipment service dates + closes alert)
AI: GET /ai/status · POST /ai/risk-check/:id · POST /ai/procurement-suggestion/:id · POST /ai/ask `{projectId,question}` · GET /ai/executive-summary/:id · POST /ai/building-check/:id

Uploaded files are served from `/uploads/<file>` (stored on local disk).

## Scripts
From the backend directory: `npm run start:dev`, `npm run build`, `npm start`, `npm run migrate`, `npm run db:seed` (non-production only), `npm run db:setup`. `npm run db:reset` is destructive and for disposable local databases only. Production container startup applies migrations with `prisma migrate deploy` and never seeds.

## Deployment notes
- Build: `npm --prefix backend run build`; start: `npm --prefix backend start` (or build/run the supplied Dockerfile).
- Configure database, signing secrets, allowed CORS origins, cookie policy, and optional Anthropic key through deployment secrets; do not commit `.env`.
- Terminate HTTPS at the deployment proxy/load balancer. The API's `/health` checks PostgreSQL connectivity.
- Local file uploads are not durable across ephemeral/container deployments. TODO: configure S3-compatible object storage and a retention/access policy before production file uploads are enabled.
- Migration verification against a fresh database requires a running PostgreSQL service; local Docker was unavailable during this change.
