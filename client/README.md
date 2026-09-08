# Social Buzz Media CRM - Client

Frontend for the Agency OS / CRM: a Next.js 16 (App Router) dashboard for managing clients, a sales lead pipeline, content calendars (including Google Sheets sync), tasks, team members, invoices, agreements, and more, backed by the Express API in `../server`.

---

## Tech Stack

- **Next.js 16.3.0** (App Router, Turbopack, `output: 'export'` static export in production)
- **React 19**
- **Redux Toolkit** (`@reduxjs/toolkit` + `react-redux`) for all server-derived state
- **Tailwind CSS v4** with a semantic design-token theme (see `design.md`)
- **react-icons** for brand/platform icons
- **jspdf** + **html2canvas-pro** for client-side PDF generation (Invoices)
- **js-cookie** for a localStorage+cookie-backed persistence layer

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server (expects the API running — see ../server/README.md)
npm run dev

# Production build (static export)
npm run build

# Serve the exported build
npm start
```

The app runs on `http://localhost:3000` by default. Log in with an account seeded on the API side (`npm run seed:users` in `../server`).

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL of the API, including `/api` | `http://localhost:5000/api` |

Set it in `.env` (or `.env.local`) at the client root. Every server-relative asset URL the API returns (e.g. Google Drive proxy links like `/api/settings/logo-proxy/:fileId`) gets this value's host prefixed via `getAssetUrl()` in `src/services/apiClient.js` before being used in an `<img src>` — the frontend and API are different origins (different ports in dev, likely different domains in production), so a raw relative path would otherwise resolve against the Next.js app itself.

---

## Authentication & Roles

There are exactly two account roles, both issued JWTs by the API on login:

| Role | Access |
|------|--------|
| `admin` | Everything |
| `team_member` | Everything except Dashboard, Settings, Invoices (page + the client-profile tab), Agreements (page + the client-profile "Agreement" tab), and Proposals (client-profile tab) |

- **`src/app/login/context/AuthContext.jsx`** — the `AuthProvider` wraps the whole app (see `src/app/layout.js`). It owns `login()`/`logout()`, persists the token and user object (`saveToStorage('auth_token' / 'auth_user')`), exposes `{ isAuthenticated, user, role, isAdmin }` via `useAuth()`, and redirects to `/login` whenever there's no token. On mount it also calls `GET /auth/me` to refresh the cached role/name and catch an expired token early.
- **`src/services/apiClient.js`** — the single fetch wrapper every service file goes through. It attaches `Authorization: Bearer <token>` from storage on every request, and on any `401` response clears storage and redirects to `/login`.
- **`src/components/auth/RequireAdmin.jsx`** — wraps admin-only pages (`dashboard`, `invoices`, `agreements`, `settings`). Renders nothing and redirects to `/clients` for a non-admin, so a team member landing on one of these via a stale link or typed URL gets bounced instead of seeing the page.
- Admin-only navigation items are simply filtered out of `src/components/layout/sidebar.js`'s `navItems` (via an `adminOnly` flag) and out of the client-profile tab list in `src/components/clients/ClientDetailContent.js`.
- This is UI-level defense — the API independently enforces the same restrictions server-side (see `../server/README.md`), so hiding a nav item is a UX nicety, not the actual security boundary.

> `src/components/ProtectedRoute.jsx` and `src/app/ProtectedLayout.js` are leftover/unused — `ProtectedLayout` imports `ProtectedRoute` as a named export, but the file only has a default export, so it would throw if ever wired up. Nothing currently imports `ProtectedLayout`. `AuthContext`'s own redirect effect is what actually gates the whole app on "must be logged in."
>
> `src/app/meetings/page.js` is also leftover/unused — it's a near-duplicate of `src/app/notes/page.js` (same Meeting Notes components/thunks), but isn't linked from `sidebar.js`'s `navItems`, so nothing routes to `/meetings` in practice. `/notes` is the real, maintained page.

---

## Architecture Notes

**Data flow** follows one consistent pattern per feature: a `service` function (in `src/services/`) calls the shared `apiClient`, a `createAsyncThunk` in the matching `redux/slices/*Slice.js` calls the service, and components dispatch the thunk and read from `useSelector`. When adding a new feature, follow this chain rather than fetching directly from a component.

**Static export caveat:** production builds use `output: 'export'` (see `next.config.mjs`), so pages cannot fetch data at build time — dynamic routes like `clients/[id]` and `team/[slug]` use `generateStaticParams` purely to pre-render a fixed range of path shells, and the real data is fetched client-side after hydration (see `ClientDetailView.js` for the pattern: loading state → dispatch fetch in `useEffect` → render).

**Google Drive-backed file features** (Proposals, Brand Kit, Creatives, Strategy, Content Calendar creatives, Misc Task files, Agreements) all go through the API's Drive integration and return `{ fileId, webViewLink, googleUserContentLink, thumbnailLink, proxyLink }` — use `googleUserContentLink` for inline image thumbnails and `webViewLink` for "open in Drive" links.

---

## Caching & Pagination

**Client-side TTL cache** (`src/utils/cache.js` + `src/redux/cachedThunk.js`): every GET-list thunk (clients, tasks, team members, leads, documents/agreements/brand-kit/creatives/strategy, misc tasks, meeting notes, content calendar) is built with `createCachedThunk(typePrefix, apiFn, { ttlMs })` instead of a plain `createAsyncThunk`. Within the TTL window, a repeat call with the same arguments is served straight from localStorage — the API is never hit — and because the resolved value has the exact same shape either way, every existing `.fulfilled` reducer works unmodified. TTLs are tiered per feature (roughly 1–5 minutes depending on how often that data actually changes). Every mutation thunk (create/update/delete) calls `invalidateCache(typePrefix)` afterward so the next read is forced fresh; `AuthContext`'s `logout()` calls `clearAllCache()` so cached data doesn't leak into a different login on a shared machine. This is a pure client-side optimization and is independent from — and stacks with — the server's own response cache (see [server/README.md#caching](../server/README.md#caching)).

**Optimistic deletes**: several slices (`clientsSlice`, `tasksSlice`, `leadsSlice`, `teamSlice`, `miscTasksSlice`) remove the item from Redux state immediately on the delete thunk's `pending` action (snapshotting `{ item, index }` in a `pendingDeleteSnapshots` map keyed by id) rather than waiting for the network response, then splice it back in on `rejected`. This makes deletes feel instant while still recovering cleanly from a failed request.

**Server-side pagination**: Clients, Tasks, Leads, Agreements, Misc Tasks, and Documents all follow the same convention — request with `page`/`limit`, receive back `{ data, pagination: { total, page, limit, totalPages } }`. The shared `src/components/ui/Pagination.js` component (extracted from the original bespoke Leads pagination bar) renders the page controls for all of them; a page's own `page` state is passed in and updated via `onPageChange`. The Clients page additionally persists its current page to localStorage (`saveToStorage`/`getFromStorage`) and restores it after mount, so navigating away and back doesn't silently reset to page 1.

---

## Pages / Features

| Route | Page | Notes |
|-------|------|-------|
| `/dashboard` | CEO Dashboard | **Admin only** |
| `/clients` | Clients list | Search, filters, CSV export, paginated (page persisted across navigation) |
| `/clients/[id]` | Client profile | Tabbed: Overview, Proposal *(admin only)*, Credentials, Brand Kit, Creatives, Strategy, Google Ads, Meta Ads, Social, Reports, Invoices *(admin only)*, Agreement *(admin only)*, Notes, Renewal, Content Calendar. Every tab has a back button. Brand Kit/Creatives/Strategy support bulk uploads |
| `/leads` | Leads (sales pipeline) | Pipeline metrics cards, search/status/source filters, inline row editing, pagination, convert a lead directly into a Client |
| `/calendar` | Content Calendar | Inline row-editing, creative file uploads, **plus** connecting a client's Google Sheet for live/synced entries or importing an Excel/CSV file |
| `/tasks` | Tasks | Sortable table (title, client, priority, status, due date) — not a kanban board; inline per-row status dropdown, click-to-view full detail modal, full-width layout |
| `/team` , `/team/[slug]` | Team management | Member profiles, workload |
| `/invoices` | Invoice Generator | **Admin only** — client-side PDF generation, no server persistence; service line items are scoped to the selected client's own `servicesSelected` |
| `/agreements` | Agreements | **Admin only** — PDF upload/view per client, paginated |
| `/notes` | Meeting Notes | — (`src/app/meetings/page.js` is a leftover duplicate of this page, not linked from the sidebar — see note below) |
| `/miscellaneous` | Misc Tasks | Inline row-editing (same pattern as Content Calendar), free-text notes field, paginated |
| `/reports` | Reports | — |
| `/settings` | Agency Settings | **Admin only** — agency info; email/password fields double as the admin's own login credentials; includes the "Login Access" panel to view/rotate either account's password |
| `/login` | Login | — |

---

## Project Structure

```
src/
  app/                  Next.js App Router pages (one folder per route)
    login/context/      AuthContext (auth state, login/logout)
  components/
    auth/                RequireAdmin guard
    clients/             Client profile tabs (Overview, Credentials, BrandKit, ClientFilesTab (Creatives/Strategy), ProposalTab, ClientAgreementTab, ...)
    content-calendar/    Calendar table, row editor, filters, Google Sheet sync/import UI
    dashboard/           Dashboard widgets
    layout/              Sidebar, AppLayout
    leads/               Leads table, row editor, filters, metrics cards
    miscellaneous/       Misc task table, row editor, filters
    settings/            LoginAccessCard (admin password management)
    tasks/               TasksTable (sortable table view), TaskViewModal, AddTaskModal
    ui/                  Shared primitives: StatusBadge, Pagination, ...
    teams/, agreements/, invoices/, meetings/
  redux/
    slices/              One slice per feature, all createAsyncThunk-based (GET-list thunks use createCachedThunk — see cachedThunk.js)
    cachedThunk.js        TTL-localStorage-caching wrapper around createAsyncThunk
    store.js
  services/              One file per feature; all route through apiClient
  utils/
    storage.js            localStorage+cookie helper (auth token/user, small persisted UI state)
    cache.js              TTL cache used by cachedThunk.js (separate key space from storage.js)
  lib/                    Small standalone helpers (e.g. clientIndustries.js)
```

---

## Design System

See `design.md` for the full token reference (colors, spacing, typography, corner radii, component conventions). Stick to the semantic Tailwind classes it defines (`bg-surface`, `text-on-surface`, `bg-primary`, etc.) rather than raw Tailwind palette colors, so theme changes stay centralized.

---

## Notes for This Next.js Version

`AGENTS.md`/`CLAUDE.md` at this directory carry a standing note (regenerated by `next dev` on every run — don't remove it from commits): this Next.js version has breaking changes from what most training data assumes. Check `node_modules/next/dist/docs/` before relying on remembered Next.js APIs/conventions.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build (static export) |
| `npm run export` | Explicit static export (usually unnecessary — `build` already exports) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

---

## Future Enhancements

- [ ] Per-viewer permission granularity beyond admin/team_member
- [ ] Replace the dead `ProtectedRoute`/`ProtectedLayout` files (or remove them)
- [ ] Server-persisted invoices (currently client-only PDF generation)
- [ ] Automated tests
