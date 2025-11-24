### CaseFlow (Skyclad Assignment)

CaseFlow is a small, production‑minded app that lets operators import, view, and work through “cases” quickly. It’s built to feel fast with big datasets, be easy to run locally, and be deployable to AWS with guardrails.

— If you just want to run it locally, jump to “TL;DR Quick Start”.

## TL;DR Quick Start

```powershell
# Start everything
docker compose up -d --build

# Apply schema + seed demo users
docker compose exec backend npm run prisma:deploy
docker compose exec backend npm run prisma:seed
```

- App: http://localhost:5173
- API: http://localhost:3001/api (health: /api/health)
- Demo login (local only): `operator@caseflow.com` / `operator123`

## Architecture (1‑minute tour)

```mermaid
flowchart LR
	U[User / Browser] -->|HTTP :80/3000| ALB[ALB]
	ALB --> FE[ECS Fargate - Frontend]
	ALB --> BE[ECS Fargate - Backend]
	BE --> PG[(RDS PostgreSQL 15)]
	CI[GitHub Actions] -->|Build + Push| ECR[(ECR)]
	CI -->|Update Services| ECS[ECS]
```

- Frontend: React + Vite + TanStack (Query/Table) + Tailwind.
- Backend: NestJS + Prisma + PostgreSQL, JWT auth, CSV import/validation.
- Infra: AWS ECS Fargate behind an ALB, RDS Postgres, images in ECR, CDK in `infrastructure/`.
- CI/CD: GitHub Actions → tests → build/push images → update ECS services.

## Run Locally

Prefer Docker? One command does the trick (first run will take longer):

```powershell
docker compose up -d --build
docker compose exec backend npm run prisma:deploy
docker compose exec backend npm run prisma:seed
```

No Docker today? Here’s a lightweight path:

```powershell
# Backend
cd app/backend
npm ci
npm run prisma:generate
set DATABASE_URL=postgresql://caseflow:caseflow_dev_password@localhost:5432/caseflow
npm run prisma:deploy
npm run start:dev

# Frontend (new terminal)
cd app/frontend
npm ci
set VITE_API_URL=http://localhost:3001/api
npm run dev -- --host
```

## Design Decisions (in plain English)

- The grid is TanStack Table + React Virtual: proven, fast, accessible, customizable without reinventing a grid.
- State is `zustand`: tiny and clear over ceremony. Great for feature‑sized stores.
- Data fetching is TanStack Query: caching, retries, invalidation, and nice dev UX.
- Schema first via Prisma: DTOs validate inputs; CSV mapped/validated server‑side.
- E2E stability: label/role locators + `data-testid`, with a global “logged‑in” state to speed up suites.

## Performance Notes (50k rows)

- Only render what’s on screen (virtualized rows).
- Debounced search/filter to avoid doing too much work per keystroke.
- CSV import streams and batches writes; Prisma transactions keep things safe.
- Pagination + server‑side filtering to avoid over‑fetching.

## Security Notes (what we do by default)

- JWT access + refresh tokens; refresh rotates credentials.
- DTO validation (class‑validator) and file checks for CSV uploads.
- Helmet security headers; CORS restricted by origin.
- Prisma uses parameterized queries; no string‑concat SQL.

## Testing Strategy

- Backend: Jest unit tests (coverage in CI).
- Frontend: Vitest component tests (coverage in CI).
- E2E: Playwright; CI runs Chromium for determinism (Firefox/WebKit locally if you like).

Common commands:

```powershell
# Frontend
cd app/frontend
npm run test:coverage
npx playwright test --project=chromium

# Backend
cd app/backend
npm run test:cov
```

## Deploying (AWS)

Push to `main` → GitHub Actions runs: tests → E2E → build → deploy. Images land in ECR, ECS services roll forward behind the ALB. Infra lives in `infrastructure/` (CDK).

You’ll need repo secrets:
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

Handy to know:
- ECS Cluster: `caseflow-cluster-dev`
- Services: `caseflow-frontend-service`, `caseflow-backend-service`
- Backend health: `/api/health` (ALB checks this)
- Frontend build arg: `VITE_API_URL` (ALB backend URL in prod)

## Environment Variables

Backend (`app/backend`):
- `PORT` (default 3001)
- `DATABASE_URL`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `CORS_ORIGIN` (comma‑separated)

Frontend (`app/frontend`):
- `VITE_API_URL` (e.g. `http://localhost:3001/api`)

## Troubleshooting

- Getting 503 from the backend in AWS? Make sure the ALB health check path is `/api/health`.
- Empty app locally? Run migrations + seed inside the backend container.
- E2E failing locally? Ensure `VITE_API_URL` is set before `npm run dev`.

–––

If you have 2 more minutes: try importing `sample-cases.csv` from the repo root on the Import page and watch the validations happen. It’s a nice little demo of the end‑to‑end flow.
