# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Web app to help university students plan their academic trajectory and run collaborative study activities (Grupo 7, DesApp 2026c1). It is a monorepo with a separate Express/MongoDB API (`backend/`) and a React/Vite SPA (`frontend/`). The whole product and codebase is in Spanish — domain terms, routes, JSON fields, commit messages, and UI text are all Spanish; keep new code consistent with that.

## Commands

Backend (`cd backend`):
- `npm run dev` — start API with nodemon (`src/server.js`), default port 5000. Connects to MongoDB and runs seeds on boot.
- `npm start` — start without watch.
- `npm test` — run the Node built-in test runner (`node --test`) over `test/*.test.js`.
- Run a single test file: `node --test test/sprint2.test.js`
- Filter by test name: `node --test --test-name-pattern="feed" test/sprint2.test.js`

Frontend (`cd frontend`):
- `npm run dev` — Vite dev server bound to `--host`, fixed at `http://localhost:5173`.
- `npm run build` — type-check then build (`tsc -b && vite build`). The build fails on TS errors.
- `npm run lint` — ESLint over the project.

Before opening a PR, run what CI runs: backend `npm test`, frontend `npm run lint && npm run build`. CI (`.github/workflows/ci.yml`) runs backend (`node --check` on every `src/*.js` + `npm test`) and frontend (lint + build) as separate jobs on Node 20.

## Environment

Backend needs a `.env` (loaded via `dotenv`). Required:
- `MONGO_URI` — **required**; the server throws on boot if missing.
- `JWT_SECRET` — signing secret (falls back to the literal `'cambiame'` if unset; tests set their own).
- `PORT` — optional, defaults to 5000.
- `SEED_RESET` — set to `false` to skip wiping the DB on boot (otherwise every restart drops and reseeds all collections).

On every boot `seedUsers()` (`backend/src/utils/seed.js`) reseeds careers, subjects, a Plan 2023 study plan, an academic offer, and three default accounts: `admin@universidad.edu`/`admin123`, `estudiante@universidad.edu`/`estudiante123`, `estudiante2@universidad.edu`/`estudiante123`. Use these for manual testing.

Frontend reads `VITE_API_URL` (defaults to `http://localhost:5000/api`).

## Backend architecture

Layered Express 5 app (CommonJS, `require`). Request flow: `server.js` (boot: connect DB, seed, listen) → `app.js` (cors, JSON body limit 5mb, request logger) → `routes/index.js` mounts every feature router under `/api`.

The standard per-feature pattern is **route → middleware → controller → Mongoose model**:
- `routes/*.routes.js` — wire paths, apply `auth`/`authorize` guards, delegate to a controller. `routes/index.js` is the single mount table; new features get a line here.
- `controllers/*.controller.js` — request handlers; most business logic lives here (services are mostly empty except `mail.service.js`).
- `models/*.js` — Mongoose schemas. Relations are `ObjectId` refs (e.g. `User.carrera → Career`, `StudyPlan.materias[].correlativas → Subject`). Correlatividades are modeled as ref arrays and validated in controller logic, not in the schema.
- `middlewares/auth.js` — `auth` verifies the JWT and sets `req.user`; `authorize(...roles)` gates by `role`. Admin-only routes chain both.

Auth is stateless JWT with two roles, `student` and `admin` (a single `User.role` field, no discriminators). Errors funnel through `middlewares/notFound.js` and `middlewares/errorHandler.js`.

API namespaces (all under `/api`): `/auth`, `/carreras`, `/materias`, `/planes`, `/academico` (grades), `/finales`, `/usuarios`, `/ofertas`, `/perfil`, `/invitaciones`, `/notificaciones`, `/eventos`.

Note on route ordering: literal routes must be registered before parametric ones (e.g. `/perfil/search` before `/perfil/:id`) or they get shadowed — this is an existing, intentional ordering, don't reorder it.

## Backend tests

Tests live in `backend/test/*.test.js` and use Node's built-in `node:test` + `assert/strict`, `supertest` against the real `app`, and an in-memory Mongo (`mongodb-memory-server`) spun up in `test.before`. They exercise full HTTP flows (login → get token → call endpoints), not isolated units. Mirror this pattern for new tests: connect a `MongoMemoryServer`, bootstrap an admin, then drive endpoints via `supertest`.

## Frontend architecture

React 19 + TypeScript + Vite SPA, routed with `react-router-dom` v7. There is **no global state library and no context**; auth state is just `token` and `user` in `localStorage`.

- `src/App.tsx` — the entire route table. Two role-scoped trees: `/student/*` and `/admin/*`, each wrapped in `<ProtectedRoute allowedRole=...>` + `<Layout role=...>`. Page-level routing decisions (role redirects) read `localStorage` directly.
- `src/pages/{student,admin,auth}/` — one component per screen.
- `src/components/` — shared UI (`Layout`, `Sidebar`, `Navbar`, `ProtectedRoute`, cards).
- `src/services/api.ts` — the single Axios instance. A request interceptor attaches `Authorization: Bearer <token>` from `localStorage`. Make all backend calls through this instance, not raw `fetch`.
- `src/styles/` — one plain CSS file per screen/component; `PremiumTheme.css` is the global theme imported in `App.tsx`. No CSS-in-JS or utility framework.

## Conventions & workflow

- **Branching** (see `CONTRIBUTING.md`): never commit to `main` or `dev`. Features branch off `dev` as `feature/*` or `fix/*` in Spanish kebab-case; PRs target `dev`, not `main`. `dev → main` only at sprint close.
- **Commits**: Conventional Commits in Spanish, present tense, no trailing period — `feat: agrega pantalla de login`, `fix: corrige cálculo de correlatividades`.
- **Architecture decisions** go in `docs/arquitectura.md` (lightweight ADRs).
- **`AGENTS.md` is the living plan/backlog** — the per-TP-point checklist and the agent activity log. After completing meaningful work, update `AGENTS.md` to reflect the real state (per its "RULE 0"). It is the source of truth for what's done vs. pending across sprints (currently through Sprint 5).
