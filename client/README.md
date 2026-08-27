# Social Buzz Media CRM - Client

Frontend for the Agency OS / CRM: a Next.js 16 (App Router) dashboard for managing clients, content calendars, tasks, team members, invoices, agreements, and more, backed by the Express API in `../server`.

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
| `team_member` | Everything except Dashboard, Settings, Invoices (page + the client-profile tab), Agreements, and Proposals (client-profile tab) |

- **`src/app/login/context/AuthContext.jsx`** — the `AuthProvider` wraps the whole app (see `src/app/layout.js`). It owns `login()`/`logout()`, persists the token and user object (`saveToStorage('auth_token' / 'auth_user')`), exposes `{ isAuthenticated, user, role, isAdmin }` via `useAuth()`, and redirects to `/login` whenever there's no token. On mount it also calls `GET /auth/me` to refresh the cached role/name and catch an expired token early.
- **`src/services/apiClient.js`** — the single fetch wrapper every service file goes through. It attaches `Authorization: Bearer <token>` from storage on every request, and on any `401` response clears storage and redirects to `/login`.
- **`src/components/auth/RequireAdmin.jsx`** — wraps admin-only pages (`dashboard`, `invoices`, `agreements`, `settings`). Renders nothing and redirects to `/clients` for a non-admin, so a team member landing on one of these via a stale link or typed URL gets bounced instead of seeing the page.
- Admin-only navigation items are simply filtered out of `src/components/layout/sidebar.js`'s `navItems` (via an `adminOnly` flag) and out of the client-profile tab list in `src/components/clients/ClientDetailContent.js`.
- This is UI-level defense — the API independently enforces the same restrictions server-side (see `../server/README.md`), so hiding a nav item is a UX nicety, not the actual security boundary.

> `src/components/ProtectedRoute.jsx` and `src/app/ProtectedLayout.js` are leftover/unused — `ProtectedLayout` imports `ProtectedRoute` as a named export, but the file only has a default export, so it would throw if ever wired up. Nothing currently imports `ProtectedLayout`. `AuthContext`'s own redirect effect is what actually gates the whole app on "must be logged in."

---

## Architecture Notes

**Data flow** follows one consistent pattern per feature: a `service` function (in `src/services/`) calls the shared `apiClient`, a `createAsyncThunk` in the matching `redux/slices/*Slice.js` calls the service, and components dispatch the thunk and read from `useSelector`. When adding a new feature, follow this chain rather than fetching directly from a component.

**Static export caveat:** production builds use `output: 'export'` (see `next.config.mjs`), so pages cannot fetch data at build time — dynamic routes like `clients/[id]` and `team/[slug]` use `generateStaticParams` purely to pre-render a fixed range of path shells, and the real data is fetched client-side after hydration (see `ClientDetailView.js` for the pattern: loading state → dispatch fetch in `useEffect` → render).

**Google Drive-backed file features** (Proposals, Brand Kit, Content Calendar creatives, Misc Task files, Agreements) all go through the API's Drive integration and return `{ fileId, webViewLink, googleUserContentLink, thumbnailLink, proxyLink }` — use `googleUserContentLink` for inline image thumbnails and `webViewLink` for "open in Drive" links.

---

## Pages / Features

| Route | Page | Notes |
|-------|------|-------|
| `/dashboard` | CEO Dashboard | **Admin only** |
| `/clients` | Clients list | Search, filters, CSV export |
| `/clients/[id]` | Client profile | Tabbed: Overview, Proposal *(admin only)*, Credentials, Brand Kit, Google Ads, Meta Ads, Social, Reports, Invoices *(admin only)*, Notes, Renewal, Content Calendar |
| `/calendar` | Content Calendar | Inline row-editing (add/edit directly in the table), creative file uploads |
| `/tasks` | Task board | Filtering, search, board view |
| `/team` , `/team/[slug]` | Team management | Member profiles, workload |
| `/invoices` | Invoice Generator | **Admin only** — client-side PDF generation, no server persistence |
| `/agreements` | Agreements | **Admin only** — PDF upload/view per client |
| `/notes` | Meeting Notes | — |
| `/miscellaneous` | Misc Tasks | Inline row-editing (same pattern as Content Calendar) |
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
    clients/             Client profile tabs (Overview, Credentials, BrandKit, ProposalTab, ...)
    content-calendar/    Calendar table, row editor, filters
    dashboard/           Dashboard widgets
    layout/              Sidebar, AppLayout
    miscellaneous/       Misc task table, row editor, filters
    settings/            LoginAccessCard (admin password management)
    tasks/, teams/, agreements/, invoices/, meetings/, ui/
  redux/
    slices/              One slice per feature, all createAsyncThunk-based
    store.js
  services/              One file per feature; all route through apiClient
  utils/                 storage.js (localStorage+cookie helper), etc.
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
