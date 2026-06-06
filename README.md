# football-social

Social platform for football analysts. Analysts upload reports (Excel or PDF), control which teams inside their company can view them, and consume a personalised feed of shared analyses.

## Services

### `api/`
REST API built with [Fastify](https://fastify.dev) + [Prisma](https://www.prisma.io) + PostgreSQL. Handles authentication, company/team management, analysis uploads, access control, and signed file URLs.

### `web/`
React + Vite single-page application. Renders the feed, analysis detail view (inline PDF/XLSX preview), and admin panel.

## Features

- JWT authentication (register, login, `/auth/me`)
- Company → Team → User hierarchy with server-side access enforcement
- Analysis uploads: `.xlsx` and `.pdf` up to 50 MB
- Signed short-lived URLs for file preview (no client-side auth headers needed)
- Cursor-paginated feed filterable by tag, author, and team
- Soft-delete for analyses

## Prerequisites

- Docker + Docker Compose
- Node 20+ (for local development without Docker)

## Getting started

```bash
cp .env.example .env
# fill in POSTGRES_PASSWORD and JWT_SECRET (min 32 chars)
```

**Start the API** (with database):
```bash
docker compose up -d
```

**Run migrations:**
```bash
docker compose exec api npx prisma migrate deploy
```

**Start the web app** (optional):
```bash
docker compose --profile web up -d web
# available at http://localhost:8080
```

The API is available at `http://localhost:3000`.

## API endpoints

```
POST   /auth/register
POST   /auth/login
GET    /auth/me

GET    /feed                      ?cursor=&limit=20&tag=&author_id=&team_id=
GET    /analyses/:id
POST   /analyses                  multipart: file + { title, description, tags, team_access[] }
PATCH  /analyses/:id/access       { team_access: string[] }
DELETE /analyses/:id

GET    /companies/:id/teams
POST   /admin/companies
POST   /admin/teams
POST   /admin/teams/:id/members
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_DB` | `football` | Database name |
| `POSTGRES_USER` | `football` | Database user |
| `POSTGRES_PASSWORD` | — | **Required** |
| `JWT_SECRET` | — | **Required** — min 32 characters |
| `MAX_UPLOAD_BYTES` | `52428800` | Max file upload size (50 MB) |
| `FILE_URL_TTL_SECONDS` | `600` | Signed URL expiry (10 min) |

## Local development

```bash
# API
cd api && npm install && npx prisma generate
npx tsx src/index.ts

# Web
cd web && npm install
npm run dev   # http://localhost:5173
```
