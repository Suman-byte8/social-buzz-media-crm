# Social Buzz Media — Agency CRM

A CRM for managing agency clients, a sales lead pipeline, content calendars (with Google Sheets sync), tasks, team members, invoices, agreements, and proposals — a Next.js frontend backed by an Express/PostgreSQL API.

This is a monorepo with two independent projects:

| Folder | What it is | Docs |
|--------|-----------|------|
| [`client/`](client/) | Next.js 16 (App Router) frontend | **[client/README.md](client/README.md)** |
| [`server/`](server/) | Express + Sequelize + PostgreSQL API | **[server/README.md](server/README.md)** |

Each has its own dependencies, environment variables, and scripts — see their individual READMEs for setup, architecture, and (for the server) full API route documentation.

---

## Quick Start

Run both projects side by side in development:

```bash
# Terminal 1 — API (http://localhost:5000)
cd server
npm install
npm run seed:users   # one-time: creates the admin + team_member accounts
npm run dev

# Terminal 2 — frontend (http://localhost:3000)
cd client
npm install
npm run dev
```

The client expects the API URL in `client/.env` (`NEXT_PUBLIC_API_URL`, defaults to `http://localhost:5000/api`); the server expects its own `.env` with database and Google Drive credentials. See [server/README.md](server/README.md#environment-variables) and [client/README.md](client/README.md#environment-variables) for the full variable list of each.

---

## Architecture at a Glance

- **Auth**: JWT-based, two fixed roles (`admin`, `team_member`). Issued by the API on login, verified on every subsequent request. See [server/README.md](server/README.md) for the auth endpoints and [client/README.md](client/README.md#authentication--roles) for how the frontend stores and gates on the token.
- **Database**: PostgreSQL via Sequelize. Client credentials and the admin/team-member login password are stored reversibly encrypted (not hashed) — the admin can view and hand out a team member's password from Settings.
- **Caching**: Two independent layers stacked on top of each other, both keyed/invalidated per-resource. The client caches GET-list responses in localStorage for a few minutes per feature (survives page navigation, not logout); the server additionally caches the same routes' JSON responses in Redis (or an in-process fallback when no Redis is configured) so every browser hitting the API shares one cache instead of hitting Postgres on every request. See [server/README.md](server/README.md#caching) and [client/README.md](client/README.md#caching--pagination).
- **File storage**: Client logos, agreements, proposals, brand kit assets, creatives/strategy files, and content calendar creatives are all stored in Google Drive via a service integration, not on the API's own disk.
- **Frontend/backend split**: The client is a static export (`output: 'export'`) that talks to the API purely over HTTP — there's no server-side rendering in production.

---

## Deployment

- **Client**: built as a static export and deployed to Hostinger via FTP on every push to `main` (see [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).
- **Server**: deployed as a standalone Node service (Render), backed by a managed PostgreSQL database.

The two are deployed independently — a client deploy doesn't touch the API, and vice versa.
