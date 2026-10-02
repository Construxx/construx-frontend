# construx-frontend

# CONSTRUX — Construction Operating System

> A single platform that connects **project management**, **construction procurement/supply chain**, and **building digital twins** into one intelligent system — from the first construction task to the long-term operation of the building.

This repository currently runs a Vite + React frontend at the root and a separate NestJS + Prisma + PostgreSQL API in `backend/`. The product/architecture notes below are conceptual and may describe features not yet represented by persisted API fields. For verified setup and deployment steps, use the operational guide below and [backend/README.md](backend/README.md).

## Run the connected application locally (Windows PowerShell)

1. Copy `backend/.env.example` to `backend/.env`; configure a local database URL and two different random JWT secrets of at least 32 characters. Copy `.env.example` to `.env` if you want to configure a direct frontend API URL; the default Vite development proxy targets `http://localhost:4000`.
2. Start PostgreSQL: `docker compose -f backend/docker-compose.yml up -d` (requires Docker Desktop), or point `DATABASE_URL` at an existing PostgreSQL service.
3. Install dependencies: `npm install` and `npm install --prefix backend`.
4. Create schema and local sample data: `npm --prefix backend run db:setup`.
5. In separate terminals from the repository root, run `npm run backend:dev` and `npm run dev`. Open `http://localhost:5173`; check API readiness at `http://localhost:4000/health`.

To build: `npm run lint`, `npm run build`, and `npm --prefix backend run build`. Production frontend hosting must provide SPA fallback to `index.html`, set `VITE_API_BASE_URL` at build time, and serve HTTPS. Configure backend `FRONTEND_URL` to exact allowed origins, production secrets and `DATABASE_URL` in deployment secrets. The backend Dockerfile applies Prisma migrations on startup. Never run the demo seed in production.

Local development seed accounts are documented in [backend/README.md](backend/README.md); their shared demo password is not safe for deployment. API login is required before protected screens load. The production frontend no longer offers role switching or database reset/demo-step controls.

Known deployment TODOs: durable object storage is required before production use of uploads; configure an Anthropic API key for natural-language AI; specify the production frontend/API origins; and validate a fresh-database migration against an available PostgreSQL service. Live building sensor telemetry and market-price feeds are not implemented by the current API.

---

## Table of Contents

1. [Product Concept](#1-product-concept)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Backend Documentation](#4-backend-documentation)
5. [Frontend Documentation](#5-frontend-documentation)
6. [Data Flow (End-to-End)](#6-data-flow-end-to-end)
7. [Database Schema (Core Tables)](#7-database-schema-core-tables)
8. [AI Engine](#8-ai-engine)
9. [Hackathon Demo Script](#9-hackathon-demo-script)
10. [Team Split (Suggested)](#10-team-split-suggested)
11. [AI Build Prompt (Copy-Paste)](#11-ai-build-prompt-copy-paste)

---

## 1. Product Concept

CONSTRUX has **three connected pillars**, all sitting on one shared database and one AI layer:

| Pillar | Public Name | What it does |
|---|---|---|
| Project OS | **Projects** | Manage construction projects: tasks, milestones, teams, site updates, documents, progress |
| Supply OS | **Procurement** | Manage materials, suppliers, purchase orders, deliveries, inventory |
| BuildTwin | **Buildings** | After handover, the project becomes a living digital twin: floors, rooms, equipment, systems, maintenance |

The key idea: **the same data object flows through all three pillars.** A cable that was ordered in Procurement becomes an inventory item used in a Project task, which becomes part of the Electrical System of Room 204 in the Digital Twin after handover. Nothing is siloed.

One-sentence pitch:

> "We don't just manage construction projects. We create the digital operating layer for the entire lifecycle of the building."

---

## 2. High-Level Architecture

```
                        ┌─────────────────────────┐
                        │        FRONTEND          │
                        │  (React / Next.js SPA)   │
                        └────────────┬─────────────┘
                                     │ REST/GraphQL (HTTPS, JWT)
                                     ▼
                        ┌─────────────────────────┐
                        │         BACKEND           │
                        │   (Node.js / Express or   │
                        │    NestJS API server)      │
                        ├─────────────────────────┤
                        │  Auth   Projects  Supply  │
                        │  Users  Tasks     Twin    │
                        │  AI Engine (calls Claude)  │
                        └────────────┬─────────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 ▼                   ▼                   ▼
          ┌─────────────┐    ┌──────────────┐    ┌────────────────┐
          │  PostgreSQL  │    │  File Storage │    │  Anthropic API  │
          │  (main DB)   │    │ (S3 / local)  │    │  (AI Engine)     │
          └─────────────┘    └──────────────┘    └────────────────┘
```

Three logical modules live inside **one backend service** (not three separate microservices — that's overkill for a hackathon and even for v1 production):

- `projects` module → Project OS
- `procurement` module → Supply OS
- `buildings` module → BuildTwin

They all reference the same `project_id` foreign key, which is what makes the "lifecycle" story real instead of just marketing language.

---

## 3. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | **React + Next.js (App Router)** | SSR for the dashboard, fast client nav, huge ecosystem |
| Styling | **Tailwind CSS** + shadcn/ui | Fast to build clean, professional UI without a designer |
| State/data fetching | **TanStack Query (React Query)** | Handles caching, loading/error states, polling for live AI alerts |
| Charts / dashboard visuals | **Recharts** | Budget bars, progress rings, material charts |
| Backend framework | **Node.js + NestJS** (or Express if you want it lighter/faster to build) | Structured modules map 1:1 to Project/Procurement/Buildings; built-in DI, guards, validation |
| Database | **PostgreSQL** | Relational data (projects → tasks → materials → rooms) fits relational modeling perfectly |
| ORM | **Prisma** | Type-safe queries, easy migrations, great with TypeScript on both ends |
| Auth | **JWT (access + refresh token)** via `@nestjs/jwt` or `jsonwebtoken` | Simple, stateless, works well with mobile/web clients |
| File uploads (drawings, photos) | **Multer** → stored in **AWS S3** (or local disk for demo) | Site photos, architectural drawings |
| AI Engine | **Anthropic API (Claude)** | Risk detection, procurement suggestions, document search, executive summaries |
| Realtime (optional stretch) | **WebSockets (Socket.IO)** | Push live AI alerts / dashboard updates without polling |
| Deployment | Frontend → **Vercel**; Backend → **Render/Railway**; DB → **Supabase/Neon (Postgres)** | Fast, free-tier friendly for a hackathon |

---

## 4. Backend Documentation

### 4.1 Responsibilities

The backend is the single source of truth. It:

1. Authenticates users and manages roles (Admin, Site Engineer, Procurement Officer, Viewer)
2. Owns all business data (projects, tasks, materials, buildings, etc.)
3. Exposes a REST API consumed by the frontend
4. Talks to the Anthropic API to generate AI alerts, recommendations, and summaries
5. Handles file uploads (drawings, site photos)
6. Emits events when state changes (e.g., "material delivered" → recompute risk)

### 4.2 Backend Folder Structure

```
backend/
├── src/
│   ├── main.ts                     # App bootstrap
│   ├── app.module.ts               # Root module, imports everything below
│   │
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── env.validation.ts       # Validates required env vars on boot
│   │   └── constants.ts
│   │
│   ├── common/
│   │   ├── decorators/             # @CurrentUser(), @Roles()
│   │   ├── guards/                 # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/           # logging, response-shaping
│   │   ├── filters/                # global exception filter
│   │   ├── pipes/                  # validation pipe config
│   │   └── dto/                    # shared base DTOs (pagination, etc.)
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts      # /auth/login, /auth/register, /auth/refresh
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── entities/user.entity.ts
│   │
│   ├── projects/                   # === PROJECT OS ===
│   │   ├── projects.module.ts
│   │   ├── projects.controller.ts  # /projects, /projects/:id
│   │   ├── projects.service.ts
│   │   ├── dto/
│   │   │   ├── create-project.dto.ts
│   │   │   └── update-project.dto.ts
│   │   ├── tasks/
│   │   │   ├── tasks.controller.ts # /projects/:id/tasks
│   │   │   ├── tasks.service.ts
│   │   │   └── dto/
│   │   ├── milestones/
│   │   │   ├── milestones.controller.ts
│   │   │   └── milestones.service.ts
│   │   ├── site-updates/
│   │   │   ├── site-updates.controller.ts   # daily site logs + photos
│   │   │   └── site-updates.service.ts
│   │   └── documents/
│   │       ├── documents.controller.ts      # drawings, reports
│   │       └── documents.service.ts
│   │
│   ├── procurement/                # === SUPPLY OS ===
│   │   ├── procurement.module.ts
│   │   ├── materials/
│   │   │   ├── materials.controller.ts      # /projects/:id/materials
│   │   │   └── materials.service.ts
│   │   ├── suppliers/
│   │   │   ├── suppliers.controller.ts
│   │   │   └── suppliers.service.ts
│   │   ├── purchase-orders/
│   │   │   ├── purchase-orders.controller.ts
│   │   │   └── purchase-orders.service.ts
│   │   ├── deliveries/
│   │   │   ├── deliveries.controller.ts     # marks PO as received, updates inventory
│   │   │   └── deliveries.service.ts
│   │   └── inventory/
│   │       ├── inventory.controller.ts
│   │       └── inventory.service.ts
│   │
│   ├── buildings/                  # === BUILDTWIN ===
│   │   ├── buildings.module.ts
│   │   ├── buildings.controller.ts # /buildings/:id
│   │   ├── floors/
│   │   │   └── floors.service.ts
│   │   ├── rooms/
│   │   │   └── rooms.service.ts
│   │   ├── equipment/
│   │   │   └── equipment.service.ts
│   │   ├── systems/                # electrical, plumbing, HVAC status per room
│   │   │   └── systems.service.ts
│   │   └── maintenance/
│   │       ├── maintenance.controller.ts
│   │       └── maintenance.service.ts
│   │
│   ├── ai-engine/                  # === AI LAYER ===
│   │   ├── ai-engine.module.ts
│   │   ├── ai-engine.controller.ts  # /ai/ask, /ai/risk-check/:projectId
│   │   ├── ai-engine.service.ts     # builds prompts, calls Anthropic API
│   │   ├── prompts/
│   │   │   ├── risk-detection.prompt.ts
│   │   │   ├── procurement-suggestion.prompt.ts
│   │   │   ├── document-search.prompt.ts
│   │   │   └── executive-summary.prompt.ts
│   │   └── anthropic-client.ts      # thin wrapper around the Anthropic SDK
│   │
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   └── notifications.service.ts # in-app + (optional) email/websocket push
│   │
│   └── uploads/
│       ├── uploads.controller.ts    # handles Multer file intake
│       └── uploads.service.ts       # pushes to S3 or local /uploads folder
│
├── prisma/
│   ├── schema.prisma                # single source of truth for DB schema
│   ├── migrations/
│   └── seed.ts                      # seeds a demo project (Victoria Heights)
│
├── test/
│   └── *.e2e-spec.ts
│
├── .env.example
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### 4.3 Core API Routes (v1)

```
Auth
POST   /auth/register
POST   /auth/login
POST   /auth/refresh

Projects
GET    /projects
POST   /projects
GET    /projects/:id
PATCH  /projects/:id
GET    /projects/:id/dashboard        # aggregated progress+budget+schedule+materials

Tasks & Milestones
GET    /projects/:id/tasks
POST   /projects/:id/tasks
PATCH  /tasks/:taskId
GET    /projects/:id/milestones
POST   /projects/:id/milestones

Site Updates
POST   /projects/:id/site-updates     # text + photo upload
GET    /projects/:id/site-updates

Procurement
GET    /projects/:id/materials
POST   /projects/:id/materials
GET    /suppliers
POST   /suppliers
POST   /purchase-orders               # create PO for a material shortfall
PATCH  /purchase-orders/:id/deliver   # marks delivered → updates inventory

Buildings (BuildTwin)
POST   /projects/:id/handover         # converts a completed project into a Building
GET    /buildings/:id
GET    /buildings/:id/floors/:floorId/rooms/:roomId
POST   /buildings/:id/maintenance-tasks

AI Engine
POST   /ai/risk-check/:projectId      # returns a schedule/budget risk analysis
POST   /ai/procurement-suggestion/:projectId
POST   /ai/ask                        # free-form question, scoped to a project
GET    /ai/executive-summary/:projectId
```

### 4.4 Auth & Roles

- JWT access token (short-lived, ~15 min) + refresh token (7 days, httpOnly cookie or secure storage)
- Roles: `ADMIN`, `SITE_ENGINEER`, `PROCUREMENT_OFFICER`, `VIEWER`
- Guard pattern: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN','SITE_ENGINEER')` on controllers that mutate data

---

## 5. Frontend Documentation

### 5.1 Responsibilities

The frontend is a dashboard-first application. It:

1. Lets a user log in and see their assigned projects
2. Renders the **Project Dashboard** (progress, budget, schedule, materials, AI alert)
3. Lets users create/manage tasks, milestones, site updates, documents
4. Renders the **Procurement** views (materials table, suppliers, POs, deliveries)
5. Renders the **BuildTwin** view (floor picker → room detail → equipment/systems/maintenance)
6. Surfaces AI output (risk alerts, procurement suggestions, executive summaries) as clearly labeled cards, not silently

### 5.2 Frontend Folder Structure (Next.js App Router)

```
frontend/
├── app/
│   ├── layout.tsx                   # root layout, providers (QueryClient, Auth)
│   ├── page.tsx                     # landing/login redirect
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx               # sidebar + topbar shell
│   │   ├── dashboard/page.tsx       # list of all projects (cards)
│   │   │
│   │   ├── projects/
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx             # Project Dashboard (the main screen)
│   │   │       ├── tasks/page.tsx
│   │   │       ├── milestones/page.tsx
│   │   │       ├── site-updates/page.tsx
│   │   │       ├── documents/page.tsx
│   │   │       └── procurement/
│   │   │           ├── page.tsx          # materials table
│   │   │           ├── suppliers/page.tsx
│   │   │           └── purchase-orders/page.tsx
│   │   │
│   │   └── buildings/
│   │       └── [buildingId]/
│   │           ├── page.tsx              # floor selector (digital twin entry)
│   │           └── floors/[floorId]/
│   │               └── rooms/[roomId]/page.tsx   # room detail: equipment/systems/maintenance
│   │
│   └── api/                         # (only if using Next.js route handlers as a BFF proxy)
│
├── components/
│   ├── ui/                          # shadcn/ui primitives (button, card, table, dialog...)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── dashboard/
│   │   ├── ProjectCard.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── BudgetGauge.tsx
│   │   └── AIAlertCard.tsx          # renders the "⚠ AI Alert" box
│   ├── projects/
│   │   ├── TaskList.tsx
│   │   ├── MilestoneTracker.tsx
│   │   ├── SiteUpdateForm.tsx
│   │   └── DocumentUploader.tsx
│   ├── procurement/
│   │   ├── MaterialsTable.tsx
│   │   ├── SupplierCard.tsx
│   │   └── PurchaseOrderForm.tsx
│   ├── buildings/
│   │   ├── FloorPicker.tsx
│   │   ├── RoomGrid.tsx
│   │   └── RoomDetailPanel.tsx      # equipment/systems/maintenance tabs
│   └── ai/
│       ├── AskAIDialog.tsx
│       └── ExecutiveSummaryCard.tsx
│
├── lib/
│   ├── api-client.ts                # axios/fetch wrapper, attaches JWT
│   ├── query-keys.ts                # centralised React Query keys
│   ├── auth.ts                      # token storage/refresh logic
│   └── utils.ts
│
├── hooks/
│   ├── useProjects.ts
│   ├── useProjectDashboard.ts
│   ├── useMaterials.ts
│   ├── useBuilding.ts
│   └── useAIRiskCheck.ts
│
├── types/
│   ├── project.types.ts
│   ├── procurement.types.ts
│   ├── building.types.ts
│   └── ai.types.ts
│
├── styles/
│   └── globals.css                  # Tailwind base + design tokens
│
├── public/
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
└── package.json
```

### 5.3 Key UI Screens

| Screen | Purpose |
|---|---|
| **Dashboard (project list)** | Cards of all projects with quick status |
| **Project Dashboard** | Progress %, budget bar, schedule status, materials %, AI alert box, milestone tracker |
| **Procurement view** | Materials table (required/delivered/status), supplier list, PO creation flow |
| **BuildTwin view** | Floor picker → Room grid → Room detail (equipment, systems, maintenance, AI recommendation) |
| **Ask AI dialog** | Free-form question box scoped to the current project |

---

## 6. Data Flow (End-to-End)

This is the story that makes the product feel "connected" instead of three separate apps.

```
1. Site Engineer logs a site update:
   "Electrical cable remaining: 600m"
        │
        ▼
2. Backend updates `inventory` table for that material
        │
        ▼
3. AI Engine service compares inventory vs. upcoming task requirements
        │
        ▼
4. If inventory < projected 14-day need → generate Procurement Alert
   (stored as an `ai_alert` row, linked to project_id + material_id)
        │
        ▼
5. Frontend polls / receives the alert → renders "⚠ Procurement Alert" card
        │
        ▼
6. Procurement Officer creates a Purchase Order from the alert (pre-filled
   supplier + quantity based on AI suggestion)
        │
        ▼
7. Delivery recorded → inventory updated → alert auto-resolved
        │
        ▼
8. Project reaches "Handover" milestone → POST /projects/:id/handover
        │
        ▼
9. Backend creates a `Building` record, maps:
   Project → Building
   Task (Electrical Installation, Level 4) → Room 204 → Electrical System
        │
        ▼
10. BuildTwin now shows Room 204 with the Distribution Board as an
    equipment record, carried over from construction — not re-entered
        │
        ▼
11. Months later: AI Building Assistant flags "AC unit due for
    preventive maintenance" → maintenance task created → technician
    assigned → digital twin updated on completion
```

The single design principle to keep in your head while building: **every entity (`material`, `task`, `room`, `equipment`) carries a `project_id` and, after handover, a `building_id`, so nothing has to be manually re-entered when a project becomes a building.**

---

## 7. Database Schema (Core Tables)

This is a simplified relational model — enough to build the demo and extend later. (Full Prisma schema should mirror this.)

```
User            (id, name, email, password_hash, role)

Project         (id, name, type, budget_total, budget_spent, start_date,
                 end_date, status, progress_percent, created_by)

Task            (id, project_id, title, status, assigned_to, due_date)

Milestone       (id, project_id, title, status, order_index)

SiteUpdate      (id, project_id, author_id, note, photo_url, created_at)

Document        (id, project_id, title, type, file_url, uploaded_by)

Material        (id, project_id, name, unit, quantity_required,
                 quantity_delivered, status)

Supplier        (id, name, contact_info, materials_supplied)

PurchaseOrder   (id, project_id, material_id, supplier_id, quantity,
                 status, ordered_at, expected_delivery, delivered_at)

InventoryLog    (id, project_id, material_id, change_qty, reason, created_at)

Building        (id, project_id, name, total_floors, handed_over_at)

Floor           (id, building_id, floor_number, name)

Room            (id, floor_id, name, area_sqm)

Equipment       (id, room_id, name, model, status, last_maintenance,
                 next_maintenance)

BuildingSystem  (id, room_id, type [electrical|plumbing|hvac], status)

MaintenanceTask (id, building_id, room_id, equipment_id, description,
                 assigned_to, status, due_date)

AIAlert         (id, project_id OR building_id, type, message, severity,
                 resolved, created_at)
```

Relationships in one line: `Project 1—* Task`, `Project 1—* Material`, `Material 1—* PurchaseOrder`, `Project 1—1 Building` (after handover), `Building 1—* Floor 1—* Room 1—* Equipment/BuildingSystem`, `Room 1—* MaintenanceTask`.

---

## 8. AI Engine

The AI layer is not a chatbot bolted on — it's called contextually from specific backend actions, each with its own prompt template in `ai-engine/prompts/`.

| AI Function | Trigger | Input Context Sent to Claude | Output |
|---|---|---|---|
| **Risk Detection** | Site update logged, or scheduled job runs nightly | Task progress, milestone dates, material availability | "Level 4 electrical may finish 5 days late" style alert |
| **Procurement Suggestion** | Inventory drops below threshold | Current stock, task requirements, past supplier/PO history | Recommended supplier + quantity + expected delivery |
| **Document Intelligence** | User searches documents | Document metadata + extracted text | Ranked list of relevant drawings/reports |
| **Executive Summary** | User opens "Summary" tab | Full project state (progress, budget, risks, materials) | 3–5 sentence plain-English health summary |
| **Building/Maintenance AI** | Nightly job on Building records | Equipment last-maintenance dates, issue logs | "Schedule preventive maintenance for AC unit in Room 204" |

Each of these is implemented as: **gather structured data from Postgres → format into a prompt → call Anthropic API → parse the response → store as an `AIAlert` (or return directly for on-demand queries like Ask AI).**

---

## 9. Hackathon Demo Script

Keep the demo to **one continuous story**, not a feature tour:

1. Create project "Victoria Heights" (12 floors, ₦430M budget)
2. Add tasks: Structural Works ✓ → MEP Installation → Electrical Installation → Finishing
3. Show Procurement: Electrical Cable required 4,000m, available 600m → generate PO to ABC Electrical Supplies
4. Record delivery of 3,400m → inventory updates live
5. Post a site update: "Electrical installation on Level 4 is 40% complete" + photo
6. **AI moment:** dashboard status flips from "On Track" to "⚠ At Risk — 5 days"
7. Trigger handover → open the Building
8. Click Floor 2 → Room 204 → show equipment/systems/AI maintenance recommendation
9. Close with the one-sentence pitch.

---

## 10. Team Split (Suggested)

Since there are two of you:

- **Person A — Backend:** Auth, Projects module, Procurement module, Prisma schema/migrations, seed script, AI Engine service + prompts
- **Person B — Frontend:** Auth pages, Project Dashboard, Procurement UI, BuildTwin UI, AI alert/summary components

Agree on the API contract (routes + DTO shapes from section 4.3) **first**, then build in parallel against mocked responses if needed.

---

## 11. AI Build Prompt (Copy-Paste)

Use this prompt with an AI coding assistant (Claude, Cursor, etc.) to start scaffolding the project. Paste it as-is, then follow up module by module (don't ask it to build everything in one shot).

```
You are building "CONSTRUX" — a construction operating system that connects
project management, construction procurement, and building digital twins
into one platform.

STACK:
- Backend: Node.js + NestJS + TypeScript + Prisma + PostgreSQL, JWT auth
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui +
  TanStack Query
- AI: Anthropic API (Claude) called from the backend only, never from the
  frontend directly

CORE CONCEPT:
The product has three connected modules that all share the same underlying
data via a project_id (and later building_id after handover):
1. Projects — tasks, milestones, site updates, documents, progress
2. Procurement — materials, suppliers, purchase orders, deliveries, inventory
3. Buildings (Digital Twin) — floors, rooms, equipment, building systems,
   maintenance, created automatically when a project is "handed over"

AI must be triggered contextually (risk detection on site updates,
procurement suggestions on low inventory, executive summaries on demand,
maintenance recommendations for buildings) — not a generic chatbot.

TASK 1 — BACKEND SCAFFOLD:
Set up a NestJS project with modules: auth, users, projects (with nested
tasks, milestones, site-updates, documents), procurement (with nested
materials, suppliers, purchase-orders, deliveries, inventory), buildings
(with nested floors, rooms, equipment, systems, maintenance), ai-engine,
notifications, uploads. Use Prisma with PostgreSQL. Generate the
schema.prisma file matching this data model: [paste the schema from
section 7 of the README]. Add JWT auth with roles ADMIN, SITE_ENGINEER,
PROCUREMENT_OFFICER, VIEWER. Implement the REST endpoints listed in
section 4.3 of the README. Add a seed script that creates a demo project
called "Victoria Heights" with sample tasks, materials, and one supplier.

TASK 2 — AI ENGINE:
Implement an ai-engine module that calls the Anthropic API. Build four
functions: checkScheduleRisk(projectId), suggestProcurement(materialId),
getExecutiveSummary(projectId), and askProjectQuestion(projectId, question).
Each should gather relevant data from the database, build a clear prompt,
call Claude, and return/store a structured result (store risk and
procurement outputs as AIAlert records).

TASK 3 — FRONTEND SCAFFOLD:
Set up a Next.js app with the folder structure in section 5.2 of the
README. Build the login/register pages, an authenticated dashboard layout
with sidebar, a project list page, and a Project Dashboard page showing
progress %, budget bar, schedule status, a materials completion bar, an
AI alert card, and a milestone tracker — matching the layout described in
section 2 of the README. Use TanStack Query for all data fetching against
the backend API, with a typed api-client wrapper that attaches the JWT.

TASK 4 — PROCUREMENT UI:
Build the materials table (required/delivered/status), supplier list, and
a purchase order creation form that can be pre-filled from an AI
procurement suggestion.

TASK 5 — BUILDTWIN UI:
Build the building view: a floor picker, a room grid per floor, and a room
detail panel with tabs for Equipment, Systems (electrical/plumbing/HVAC),
and Maintenance, including an AI recommendation card when maintenance is
due.

Work through these tasks one at a time. After each task, show me the file
structure you created and ask if I want to proceed to the next task before
continuing.
```

---

**That's the full doc.** Start with Section 4.3 (API routes) and Section 7 (schema) — agree on those together before either of you writes a single line of code, since everything else depends on that contract staying stable.
