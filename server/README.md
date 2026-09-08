# Social Buzz Media CRM - API Documentation

## Overview
CRM API built with Express, PostgreSQL (Sequelize), and Google Drive integration for document management — covering clients, a sales lead pipeline, tasks, team members, meeting notes, a content calendar (with Google Sheets sync), misc creative tasks, and documents (proposals/invoices/reports/brand kit/creatives/strategy/agreements). A shared response cache (Redis or in-process) sits in front of the heaviest-read endpoints — see [Caching](#caching).

**Base URL:** `http://localhost:5000/api` (or the `PORT` set in `.env`)

---

## Authentication

JWT-based. There are exactly two accounts, seeded via `npm run seed:users`:

| Role | Can access |
|------|------------|
| `admin` | Everything |
| `team_member` | Everything **except**: Agency Settings, Invoices (redacted from client records), Agreements, Proposals |

Every route under `/api/*` requires a valid token **except**:
- `POST /auth/login`, `POST /auth/logout`
- `GET /settings/logo-proxy/:fileId` (embedded via plain `<img>` tags, which can't send headers)
- `GET /documents/:id/stream` (embedded via plain `<a>`/`<iframe>`, same reason)

Send the token on every other request:
```
Authorization: Bearer <token>
```

A request with a missing/invalid/expired token gets `401 { "success": false, "message": "Authentication required" }` (or `"Invalid or expired session"`). A request from a valid but under-privileged user gets `403 { "success": false, "message": "Admin access required" }`.

Passwords are stored **encrypted (reversible), not hashed** — the admin needs to be able to view and hand out the team member's password from Settings > Login Access.

---

## Caching

The heaviest-read GET endpoints (`GET /clients`, `GET /team-members`, `GET /tasks`, `GET /documents`, `GET /agreements`) are wrapped with a shared response cache (`src/middleware/cacheRoute.js` + `src/utils/serverCache.js`), independent of and stacked underneath the client's own localStorage cache (see `client/README.md#caching--pagination`).

- **Storage**: Redis (via `ioredis`) when `REDIS_URL` is set — e.g. [Upstash](https://upstash.com)'s free tier — otherwise a transparent in-process `Map` fallback with the same TTL/invalidation semantics. Nothing else in the app needs to change either way; a Redis outage mid-request also falls back to the in-process cache rather than failing the request.
- **Cache key**: `` `${keyPrefix}:${role}:${req.originalUrl}` `` — the requester's role is *always* part of the key, never optional. Several of these routes redact fields by role (`GET /clients` strips `invoices` for non-admins, `GET /documents`/`GET /agreements` hide `agreement`/`proposal` rows entirely) — a role-blind cache key would risk one role's response leaking to another.
- **TTLs**: clients 60s, team members 120s, tasks 30s, documents/agreements 120s (shared prefix, since both read from the same `documents` table).
- **Invalidation**: every create/update/delete route for a cached resource calls `invalidateCache(prefix)` (e.g. `invalidateCache("tasks")`) after the write succeeds, clearing every cached URL variant (different filters/pagination) for that resource in both Redis and the in-process fallback.
- Responses carry an `X-Cache: HIT` or `X-Cache: MISS` header, useful for confirming the cache is actually being hit in a given environment.

### 1. Login
**Endpoint:** `POST /auth/login`

**Request Body:**
| Field | Type | Required |
|-------|------|----------|
| email | string | Yes |
| password | string | Yes |

**Success Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "name": "Admin", "email": "hellosocialbuzzmedia@gmail.com", "role": "admin" }
}
```
Token expires in 7 days.

**Error Responses:**
- `400 Bad Request` - Missing email or password
- `401 Unauthorized` - `{ "success": false, "message": "Invalid credentials" }`

---

### 2. Logout
**Endpoint:** `POST /auth/logout`

Stateless (JWTs aren't tracked server-side) — this just exists as a symmetric endpoint for the client to call. **Response:** `{ "success": true }`

---

### 3. Get Current User
Rehydrates the logged-in user's name/email/role (used on page load/refresh).

**Endpoint:** `GET /auth/me` — requires auth

**Success Response (200 OK):**
```json
{ "success": true, "user": { "id": 1, "name": "Admin", "email": "hellosocialbuzzmedia@gmail.com", "role": "admin" } }
```

**Error Responses:**
- `401 Unauthorized` - Token valid but the user it refers to was deleted

---

### 4. List Users
**Endpoint:** `GET /auth/users` — **admin only**

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Admin", "email": "hellosocialbuzzmedia@gmail.com", "role": "admin" },
    { "id": 2, "name": "Team Member", "email": "team@socialbuzzmedia.com", "role": "team_member" }
  ]
}
```

---

### 5. Reveal a User's Password
Lets the admin view a user's current plaintext password so it can be handed out.

**Endpoint:** `GET /auth/users/:id/password` — **admin only**

**Success Response (200 OK):**
```json
{ "success": true, "password": "ChangeMe123!" }
```

**Error Responses:**
- `404 Not Found` - User with given ID does not exist

---

### 6. Set/Rotate a User's Password
**Endpoint:** `PUT /auth/users/:id/password` — **admin only**

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| password | string | Yes | New password, minimum 6 characters |

**Success Response (200 OK):**
```json
{ "success": true, "message": "Password updated successfully" }
```

**Error Responses:**
- `400 Bad Request` - Password missing or under 6 characters
- `404 Not Found` - User with given ID does not exist

---

## Client Management

All endpoints below require auth. The `invoices` field is stripped from every response for `team_member` users, and silently dropped from create/update request bodies for them (an attempt to set it is ignored rather than erroring).

### 1. Create Client
**Endpoint:** `POST /clients`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Client name |
| logo | string | No | Server-relative logo proxy path (set via the upload-logo endpoint below, not written directly) |
| industry | string | No | Client industry (e.g., Technology, Healthcare, Retail) |
| phoneNumber | string | No | Primary phone number |
| whatsappNumber | string | No | WhatsApp contact number |
| address | string | No | Client address |
| email | string | No | Client email address |
| website | string | No | Client website URL |
| servicesSelected | array or string | No | Services selected (comma-joined on write, array on read) — the Invoice Generator scopes its service line-item dropdown to whatever a client has selected here |
| clientManagedBy | integer | No | ID of the `TeamMember` managing this client |
| clientHealth | integer | No | Client health score (0-100) |
| proposals | array or string | No | Proposal names/refs (legacy plain-text field — real proposal files live in Documents) |
| credentials | array of objects | No | `[{ id, platform, username, password, notes }]` — passwords are AES-256-GCM encrypted at rest and decrypted back on every read |
| campaigns | array or string | No | Campaign names |
| socialMediaAccounts | array or string | No | Social media handles |
| reports | array or string | No | Report names/refs |
| invoices | array or string | No | **Admin only** — silently ignored for `team_member` |
| notes | string | No | Free-text notes |
| renewal | string (ISO 8601) | No | Contract renewal date |
| clientSince | string (YYYY-MM-DD) | No | Editable "became a client" date — distinct from `createdAt` (always "now" at row-insert time), for backdating clients onboarded before this CRM existed. Defaults to `createdAt` if never set |
| contentCalendar | JSON string | No | Dual-purpose: a legacy plain-text field for real entries (which now live in Content Calendar), and the storage for that client's Google Sheet sync config (`{ googleSheetUrl, lastSyncedAt, sheetTabs, lastImportedFile, lastImportedAt }`) — see the Content Calendar section. Not meant to be written directly by API consumers; use the `save-sheet-url`/`sync-google-sheet`/`import-file` endpoints instead |

**Example Request:**
```json
{
  "name": "Acme Corporation",
  "industry": "Technology",
  "phoneNumber": "+1-555-123-4567",
  "email": "contact@acme.com",
  "servicesSelected": ["Social Media Management", "SEO"],
  "clientManagedBy": 1,
  "clientHealth": 85,
  "renewal": "2026-12-31"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "id": 1,
    "name": "Acme Corporation",
    "logo": null,
    "industry": "Technology",
    "phoneNumber": "+1-555-123-4567",
    "whatsappNumber": null,
    "address": null,
    "email": "contact@acme.com",
    "servicesSelected": ["Social Media Management", "SEO"],
    "clientManagedBy": 1,
    "clientHealth": 85,
    "proposals": [],
    "credentials": [],
    "campaigns": [],
    "socialMediaAccounts": [],
    "reports": [],
    "invoices": [],
    "notes": null,
    "renewal": "2026-12-31T00:00:00.000Z",
    "contentCalendar": [],
    "createdAt": "2026-08-19T11:20:30.000Z",
    "updatedAt": "2026-08-19T11:20:30.000Z"
  }
}
```
(`invoices` key is omitted entirely from the response for `team_member`.)

**Error Responses:**
- `400 Bad Request` - Missing required field (name)
- `500 Internal Server Error` - Database or server error

---

### 2. Get All Clients
**Endpoint:** `GET /clients`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 10 | Page size |
| search | string | - | Matches against name, email, industry (case-insensitive) |
| sortBy | string | createdAt | Any Client column |
| sortOrder | string | DESC | `ASC` or `DESC` |
| industry | string | - | Exact match |
| managedBy | integer | - | Filter by `clientManagedBy` |
| healthMin | integer | - | Minimum `clientHealth` |
| healthMax | integer | - | Maximum `clientHealth` |

This route is cached — see [Caching](#caching) (`clients`, 60s TTL).

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [ { "id": 1, "name": "Acme Corporation", "...": "..." } ],
  "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
}
```

---

### 3. Export Clients to CSV
**Endpoint:** `GET /clients/export`

**Query Parameters:** Same filters as "Get All Clients" (`search`, `industry`, `healthMin`, `healthMax`) — no pagination, returns all matches.

**Success Response (200 OK):** `Content-Type: text/csv`, downloadable file. The `Invoices` column is omitted entirely for `team_member`.

---

### 4. Get Client by ID
**Endpoint:** `GET /clients/:id`

**Success Response (200 OK):** Same shape as Create Client's response `data`.

**Error Responses:**
- `404 Not Found` - Client with given ID does not exist

---

### 5. Upload/Replace Client Logo
Uploads an image to the client's Google Drive folder and stores the proxy link on the client record.

**Endpoint:** `POST /clients/:id/upload-logo`
**Content-Type:** `multipart/form-data`

**Form Body:**
| Field | Type | Description |
|-------|------|-------------|
| logo | file | Image, max 5MB |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logo uploaded successfully",
  "data": { "id": 1, "logo": "/api/settings/logo-proxy/1abc...", "...": "..." }
}
```
`logo` is a server-relative path — prefix it with the API host before using it in an `<img src>` (see `client/src/services/apiClient.js`'s `getAssetUrl`).

**Error Responses:**
- `400 Bad Request` - No file provided or file exceeds 5MB
- `404 Not Found` - Client with given ID does not exist

---

### 6. Update Client
**Endpoint:** `PUT /clients/:id`

**Request Body:** Same fields as Create Client, all optional. `invoices` is silently ignored for `team_member`.

**Success Response (200 OK):** Same shape as Create Client's response.

**Error Responses:**
- `404 Not Found` - Client with given ID does not exist

---

### 7. Delete Client
**Endpoint:** `DELETE /clients/:id`

**Success Response (200 OK):**
```json
{ "success": true, "message": "Client deleted successfully" }
```

**Error Responses:**
- `404 Not Found` - Client with given ID does not exist

---

## Team Member Management

All endpoints require auth (no admin restriction).

### 1. Create Team Member
**Endpoint:** `POST /team-members`

**Request Body:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | string | Yes | - | Team member full name |
| email | string | No | null | Contact email address |
| number / phoneNumber | string | No | null | Primary phone number |
| whatsappNumber / whatsapp_number | string | No | null | WhatsApp contact number |
| address | string | No | null | Physical address |
| aadharNumber / aadhar_number | string | No | null | Aadhar / ID number |
| avatar / profileImage / profile_image | string | No | null | Avatar image URL |
| resume | string | No | null | Resume file URL |
| bankDetails / bank_details | object/array/string | No | null | Bank details (stored as JSON text) |
| designation | string | No | null | Job title |
| department | string | No | designation | Department name (defaults to designation) |
| employmentType / type_of_employment | string | No | null | `full-time`, `internship`, `freelance` |
| hireDate / hire_date | string (YYYY-MM-DD) | No | null | Date of hire |
| managerReportTo / manager_report_to | string | No | null | Manager name |
| status | string | No | null | `active` / `inactive` / null |
| assignedWorks / assigned_works | array/string | No | null | Assigned work items (JSON text) |
| clientHandling / client_handling | array/string | No | null | Managed client names/IDs (JSON text) |

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Team member added successfully",
  "data": {
    "id": 1,
    "name": "Sarah Connor",
    "email": "sarah.connor@example.com",
    "designation": "Senior Frontend Developer",
    "department": "Engineering",
    "employmentType": "full-time",
    "status": null,
    "assignedWorks": "[\"UI Refactoring\",\"Design System\"]",
    "createdAt": "2026-08-20T12:00:00.000Z",
    "updatedAt": "2026-08-20T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing required field (name)

---

### 2. Get All Team Members
**Endpoint:** `GET /team-members`

This route is cached — see [Caching](#caching) (`team`, 120s TTL).

**Success Response (200 OK):** `{ "success": true, "data": [ {...full team member...} ] }`

---

### 3. Get Team Member by ID
**Endpoint:** `GET /team-members/:id`

**Error Responses:** `404 Not Found`

---

### 4. Update Team Member
**Endpoint:** `PUT /team-members/:id`

**Request Body:** Same fields as Create, all optional.

**Error Responses:** `404 Not Found`

---

### 5. Delete Team Member
**Endpoint:** `DELETE /team-members/:id`

**Error Responses:** `404 Not Found`

---

## Task Management

All endpoints require auth. Assigning/unassigning a team member automatically adds/removes the task title from that member's `assignedWorks` list.

`assignees` is accepted and returned as a plain array of `TeamMember` IDs, same as always, but is no longer backed by the `tasks.assignees` TEXT column under the hood — it's now a real `task_assignees` join table (see `TaskAssignee` in Data Models), migrated via `scripts/migrate-task-assignees.js`. The old column is kept only as a rollback reference and is never read or written by the app.

### 1. Create Task
**Endpoint:** `POST /tasks`

**Request Body:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| title | string | Yes | - | Task title |
| description | string | No | null | Task description |
| status | string | No | todo | `todo`, `in_progress`, `review`, `completed` |
| priority | string | No | medium | `urgent`, `high`, `medium`, `low` |
| clientId | integer | No | null | Associated client |
| assignees | array of integers | No | null | `TeamMember` IDs — validated to exist |
| dueDate | string (ISO 8601) | No | null | Due date |

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": 1, "title": "Design homepage mockup", "description": null,
    "status": "todo", "priority": "high", "clientId": 1,
    "assignees": [2, 3], "dueDate": "2026-09-01T00:00:00.000Z",
    "completedAt": null, "createdAt": "2026-08-20T12:00:00.000Z", "updatedAt": "2026-08-20T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing title, or one or more assignee IDs are invalid

---

### 2. Get All Tasks
**Endpoint:** `GET /tasks`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 50 | Page size |
| search | string | - | Matches title or description |
| status | string | - | Filter by status (`all` = no filter) |
| priority | string | - | Filter by priority (`all` = no filter) |
| clientId | integer | - | Filter by client (`all` = no filter) |
| assigneeId | integer | - | Filter by assignee (`all` = no filter) |
| month | string (YYYY-MM) | - | Filter to tasks whose `dueDate` falls in this month |

This route is cached — see [Caching](#caching) (`tasks`, 30s TTL).

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1, "title": "Design homepage mockup", "status": "todo", "priority": "high",
      "clientId": 1, "assignees": [2], "assigneeDetails": [{ "id": 2, "name": "Sarah Connor" }],
      "clientName": "Acme Corporation"
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 50, "totalPages": 1 }
}
```

---

### 3. Get Task by ID
**Endpoint:** `GET /tasks/:id`

**Success Response (200 OK):** Task record enriched with full `assigneeDetails` (`id`, `name`, `designation`, `department`) and `client` (`id`, `name`, `industry`).

**Error Responses:** `404 Not Found`

---

### 4. Update Task
**Endpoint:** `PUT /tasks/:id`

**Request Body:** Same fields as Create, all optional, plus:
| Field | Type | Description |
|-------|------|-------------|
| completedAt | string (ISO 8601) | Set explicitly, or auto-set to now when `status` transitions to `completed` (and cleared when it transitions away) |

**Error Responses:** `404 Not Found`

---

### 5. Delete Task
**Endpoint:** `DELETE /tasks/:id`

Also removes the task title from every assignee's `assignedWorks`.

**Error Responses:** `404 Not Found`

---

## Leads (Sales Pipeline)

A separate pre-client pipeline — distinct from `Client`. All endpoints require auth (no admin restriction). Not response-cached.

### 1. List Leads
**Endpoint:** `GET /leads`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 10 | Page size |
| search | string | - | Matches `companyName`, `contactName`, or `email` |
| status | string | - | One of `new`, `contacted`, `qualified`, `hot`, `lost` |
| source | string | - | Exact match (free-text field — no fixed list) |
| sortBy | string | createdAt | Any Lead column |
| sortOrder | string | DESC | `ASC` or `DESC` |

**Success Response (200 OK):** `{ "success": true, "data": [...], "pagination": { "total", "page", "limit", "totalPages" } }`

---

### 2. Pipeline Metrics
Summary counts for the Leads page's overview cards.

**Endpoint:** `GET /leads/metrics`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalLeads": 42,
    "hotProspects": 5,
    "followUpDue": 3,
    "lostThisMonth": 1,
    "newThisMonth": 8
  }
}
```
`followUpDue` counts leads with `nextFollowUpAt` on or before end-of-today, excluding `lost`.

---

### 3. Create Lead
**Endpoint:** `POST /leads`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| companyName | string | Yes | — |
| contactName | string | No | — |
| email | string | No | — |
| phone | string | No | — |
| source | string | No | Free text (e.g. "Referral", "Website") |
| status | string | No | Defaults to `new` if omitted/invalid |
| notes | string | No | — |
| lastContactAt | string (ISO 8601) | No | — |
| nextFollowUpAt | string (ISO 8601) | No | — |

**Error Responses:** `400 Bad Request` - Missing `companyName`

---

### 4. Update Lead
**Endpoint:** `PUT /leads/:id`

**Request Body:** Same fields as Create, all optional — a field that's omitted entirely is left untouched (as opposed to `null`, which clears it), so a quick "log a call" request that only sends `{ lastContactAt }` doesn't wipe anything else.

**Error Responses:** `404 Not Found`

---

### 5. Delete Lead
**Endpoint:** `DELETE /leads/:id` — **Error Responses:** `404 Not Found`

---

### 6. Convert Lead to Client
Creates a real `Client` from the lead's `companyName`/`email`/`phone`/`notes`, then deletes the lead (it's no longer a "potential" client).

**Endpoint:** `POST /leads/:id/convert`

**Success Response (201 Created):** `{ "success": true, "message": "Lead converted to client successfully", "data": { ...new Client... } }`

**Error Responses:** `404 Not Found`

---

## Meeting Notes

All endpoints require auth.

### 1. Create Meeting Note
**Endpoint:** `POST /meeting-notes`

**Request Body:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| title | string | Yes | - | Note title |
| description | string | No | null | Free text |
| meetingDate | string (YYYY-MM-DD) | No | null | Date of the meeting |
| meetingType | string | No | other | Category |
| attendees | string | No | null | Attendee names |
| actionItems | string | No | null | Follow-up items |
| clientId | integer | No | null | Associated client |
| createdBy | string | No | null | Author name |

**Error Responses:** `400 Bad Request` - Missing title

---

### 2. Get All Meeting Notes
**Endpoint:** `GET /meeting-notes`

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| clientId | Filter by client (`all` = no filter) |
| meetingType | Filter by type (`all` = no filter) |
| search | Matches title or description |

**Success Response (200 OK):** Notes ordered by `meetingDate` DESC, each enriched with `clientName`.

---

### 3. Get Meeting Note by ID
**Endpoint:** `GET /meeting-notes/:id`

Enriched with `client: { id, name }`. **Error Responses:** `404 Not Found`

---

### 4. Update Meeting Note
**Endpoint:** `PUT /meeting-notes/:id` — same fields as Create, all optional. **Error Responses:** `404 Not Found`

---

### 5. Delete Meeting Note
**Endpoint:** `DELETE /meeting-notes/:id` — **Error Responses:** `404 Not Found`

---

## Content Calendar

All endpoints require auth. `status` replaced a legacy boolean `posted` field — `postedAt` is auto-set when `status` transitions to `posted`, and cleared otherwise.

### 1. List Entries
**Endpoint:** `GET /content-calendar`

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| clientId | Filter by client (`all` = no filter) |
| from / to | Filter by `date` range (YYYY-MM-DD, inclusive) |
| status | `pending`, `scheduled`, or `posted` |
| platform | Filter to entries whose `platforms` array includes this value |
| page / limit | Optional pagination — omitted entirely (or ignored) whenever `platform` is set, since that filter runs in JS *after* the SQL query (platforms are a JSON-serialized column), and paginating before it would make `total`/`totalPages` wrong |

**Success Response (200 OK):** Entries ordered by `date` ASC, each enriched with `clientName`, `platforms` and `creatives` parsed to arrays. Includes `pagination` only when `page`/`limit` were honored (see above).

---

### 2. Get Entry by ID
**Endpoint:** `GET /content-calendar/:id` — **Error Responses:** `404 Not Found`

---

### 3. Create Entry
**Endpoint:** `POST /content-calendar`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| clientId | integer | Yes | Associated client |
| date | string (YYYY-MM-DD) | Yes | Scheduled date |
| holiday | string | No | Holiday/occasion label |
| postTitle | string | No | Post title |
| content | string | No | Post body |
| caption | string | No | Caption text |
| hashtags | string | No | Hashtags |
| platforms | array of strings | No | e.g. `["facebook","instagram"]` |
| status | string | No | `pending` (default), `scheduled`, `posted` |

**Error Responses:** `400 Bad Request` - Missing `clientId` or `date`

---

### 4. Update Entry
**Endpoint:** `PUT /content-calendar/:id` — same fields as Create, all optional. **Error Responses:** `404 Not Found`

---

### 5. Delete Entry
**Endpoint:** `DELETE /content-calendar/:id`

Also deletes every attached creative from Google Drive. **Error Responses:** `404 Not Found`

---

### 6. Upload Creatives
Uploads up to 10 images/videos to `Content Calendar Creatives/` in the client's Drive folder.

**Endpoint:** `POST /content-calendar/:id/creatives`
**Content-Type:** `multipart/form-data`

**Form Body:**
| Field | Type | Description |
|-------|------|-------------|
| files | file[] | Up to 10 images/videos, 50MB each |

**Success Response (201 Created):** Entry with the new items appended to `creatives`, each `{ fileId, fileName, mimeType, driveLink, webViewLink, thumbnailLink, folderId, uploadedAt }`.

**Error Responses:**
- `400 Bad Request` - No files provided
- `404 Not Found` - Entry not found

---

### 7. Delete a Creative
**Endpoint:** `DELETE /content-calendar/:id/creatives/:fileId`

Removes the file from the entry's `creatives` list and deletes it from Google Drive. **Error Responses:** `404 Not Found`

---

### Google Sheets Sync / File Import

A client's content calendar can also be driven from an external spreadsheet instead of (or alongside) manually-created entries. The sheet/file must have recognizable headers (Date, Title, Caption, etc. — see `src/utils/sheetParser.js`); each tab is treated as a separate month/batch. All of these persist bookkeeping (`googleSheetUrl`, `sheetTabs`, `lastSyncedAt`/`lastImportedAt`/`lastImportedFile`) into the client's `contentCalendar` JSON column (see the `Client` model).

#### 8. Live Sheet View (read-only, not persisted)
Fetches and parses a Google Sheet on demand — the last 4 month-tabs — without writing any `ContentCalendarEntry` rows. Used for previewing a connected sheet's content directly, live.

**Endpoint:** `GET /content-calendar/live/:clientId`

**Query Parameters:** `sheetUrl` (optional — falls back to the client's previously-saved sheet URL if omitted)

**Success Response (200 OK):** `{ success, isLive, sheetUrl, title, tabs, months, entries, totalEntries }`. If no sheet URL is available (neither passed nor previously saved), returns `{ success: true, isLive: false, entries: [], message: "..." }` rather than an error.

---

#### 9. Save a Client's Sheet URL
Just stores/clears the URL in the client's `contentCalendar` config — does not fetch or sync anything.

**Endpoint:** `POST /content-calendar/save-sheet-url`

**Request Body:** `{ "clientId": 1, "sheetUrl": "https://docs.google.com/spreadsheets/..." }` (omit/empty `sheetUrl` to remove it)

**Error Responses:** `400 Bad Request` - Missing `clientId`; `404 Not Found` - Client not found

---

#### 10. Sync a Google Sheet into Real Entries
Fetches the sheet, parses every tab, and **persists** the rows as real `ContentCalendarEntry` records (unlike the read-only Live Sheet View above).

**Endpoint:** `POST /content-calendar/sync-google-sheet`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| clientId | integer | Yes | — |
| sheetUrl | string | Yes | Google Sheets URL |
| clearExisting | boolean | No | If true, deletes this client's existing entries before inserting the synced ones |

**Success Response (200 OK):** `{ success, message, data: { title, sheetId, tabs, totalEntries } }`

**Error Responses:**
- `400 Bad Request` - Missing `clientId`/`sheetUrl`, or the sheet had no recognizable rows
- `404 Not Found` - Client not found

---

#### 11. Import an Uploaded Excel/CSV File
Same as syncing a Google Sheet, but the source is an uploaded workbook instead of a live Sheets URL.

**Endpoint:** `POST /content-calendar/import-file`
**Content-Type:** `multipart/form-data`

**Form Body:** `file` (`.xlsx`/`.csv`, max 20MB), `clientId`, `clearExisting` (optional)

**Success Response (200 OK):** `{ success, message, data: { fileName, tabs, totalEntries } }`

**Error Responses:** `400 Bad Request` - Missing `clientId`/file, or no recognizable rows; `404 Not Found` - Client not found

---

#### 12. Client Months/Tabs Summary
Returns a per-month entry-count breakdown for a client (used to populate a month picker), plus that client's saved sheet-sync config.

**Endpoint:** `GET /content-calendar/client-months/:clientId`

**Success Response (200 OK):** `{ success, data: { months: [{ key, label, count }], savedConfig } }`

---

## Miscellaneous Tasks

Tracked one-off creative tasks (banners, videos, OOH, etc.) — separate from the general Task Management feature. All endpoints require auth.

### 1. List Tasks
**Endpoint:** `GET /misc-tasks`

**Query Parameters:** `clientId`, `status` (`pending`/`progress`/`delivered`), `assignedTo` (TeamMember id), `typeOfWork` (`banner`/`video`/`social_media_banner`/`ooh`), `page`/`limit` (optional — omitting them returns everything, unpaginated, for existing callers)

---

### 2. Create or Update (with optional file)
**Endpoint:** `POST /misc-tasks/upload`
**Content-Type:** `multipart/form-data`

**Form Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | integer | No | If present, updates that task instead of creating a new one |
| clientId | integer | Yes (on create) | Associated client |
| typeOfWork | string | Yes (on create) | `banner`, `video`, `social_media_banner`, `ooh` |
| assignedDate | string (YYYY-MM-DD) | No | Date assigned |
| deliveryDate | string (YYYY-MM-DD) | No | Delivery deadline |
| status | string | No | `pending` (default), `progress`, `delivered` |
| assignedTo | integer | No | `TeamMember` id |
| notes | string | No | Free-text notes |
| file | file | No | Image/video/PDF, max 15MB — uploaded to `Miscellaneous/` in the client's Drive folder |

**Error Responses:**
- `400 Bad Request` - Invalid `typeOfWork`/`status`, or missing `clientId`/`typeOfWork` on create
- `404 Not Found` - `id` given but no matching task, or client not found

---

### 3. Update Metadata (no file change)
**Endpoint:** `PUT /misc-tasks/:id` — same fields as above minus `file`/`id`. **Error Responses:** `404 Not Found`

---

### 4. Delete Task
**Endpoint:** `DELETE /misc-tasks/:id` — **Error Responses:** `404 Not Found`

---

## Documents (Proposals, Invoices, Reports, Brand Kit, Creatives, Strategy, Agreements)

A single `documents` table backs several features via `documentType` (`agreement`, `proposal`, `invoice`, `report`, `content_calendar`, `brand_kit`, `creative`, `strategy`, `other`). All endpoints require auth. **`agreement` and `proposal` types are admin-only** — for `team_member`, listing filters them out, and get/upload/delete on them return `403`. `GET /documents` and `GET /agreements` are response-cached — see [Caching](#caching).

`brand_kit`, `creative`, and `strategy` files (client profile's Brand Kit/Creatives/Strategy tabs) land in a `Brand Kit` / `Creatives` / `Strategy` subfolder (respectively) of the client's Drive folder — anything else falls back to an `Other` subfolder.

### 1. Upload a PDF Document (proposal / invoice / report / content_calendar / other)
**Endpoint:** `POST /documents/upload`
**Content-Type:** `multipart/form-data`

**Form Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | PDF only, max 2MB |
| clientId | integer | No | Uploads into that client's Drive folder, in a subfolder named for the type (`Proposals`, `Invoices`, `Reports`, `Content Calendar`, or `Other`) |
| description | string | No | Free-text label |
| documentType | string | No | `proposal`, `invoice`, `report`, `content_calendar`, or `other` (default) |

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": 1, "fileName": "proposal.pdf", "fileType": "application/pdf", "fileSize": 102400,
    "fileId": "1abc...", "driveLink": "...", "webViewLink": "...", "googleUserContentLink": "...",
    "folderId": "...", "clientId": 1, "description": "Q4 proposal", "documentType": "proposal",
    "createdAt": "2026-08-20T12:00:00.000Z", "updatedAt": "2026-08-20T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - No file provided
- `403 Forbidden` - `documentType` is `agreement`/`proposal` and the caller isn't admin

---

### 2. Upload a Media Document (Brand Kit / Creatives / Strategy)
Any file type/size these features want to store — no MIME filter, since Brand Kit accepts logos, PDFs, video, fonts, zipped asset packs, whatever the client hands over.

**Endpoint:** `POST /documents/upload-media`
**Content-Type:** `multipart/form-data`

**Form Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | Any type, max 200MB |
| clientId | integer | Yes | Uploads into `Brand Kit/`, `Creatives/`, `Strategy/`, or `Other/` in the client's Drive folder, based on `documentType` |
| description | string | No | Free-text label |
| documentType | string | No | `brand_kit`, `creative`, `strategy`, or `other` |

**Error Responses:**
- `400 Bad Request` - No file, or no `clientId`
- `404 Not Found` - Client not found

---

### 3. Bulk Upload Media Documents
Same as above, but accepts several files in one request (e.g. selecting a whole batch of brand assets at once). Files are uploaded one at a time server-side (not in parallel, to avoid bursting the Drive API) — a per-file failure is recorded and skipped rather than aborting files that already succeeded.

**Endpoint:** `POST /documents/upload-media-bulk`
**Content-Type:** `multipart/form-data`

**Form Body:** `files` (file[], up to 20, any type, 200MB each), `clientId`, `description`, `documentType` — same meaning as above.

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "3 file(s) uploaded, 1 failed",
  "data": [ { "...uploaded Document...": "" } ],
  "failed": [ { "fileName": "bad-file.xyz", "error": "..." } ]
}
```

**Error Responses:** `400 Bad Request` - No files, or no `clientId`; `404 Not Found` - Client not found

---

### 4. List Documents
**Endpoint:** `GET /documents`

**Query Parameters:** `clientId`, `documentType`, `page`/`limit` (optional — omitted returns everything, unpaginated)

This route is cached — see [Caching](#caching) (`documents`, 120s TTL).

**Success Response (200 OK):** Documents ordered by `createdAt` DESC. `agreement`/`proposal` rows are excluded for `team_member`. Includes `pagination` only when `page`/`limit` were passed.

---

### 5. Get Document by ID
**Endpoint:** `GET /documents/:id`

**Error Responses:**
- `404 Not Found`
- `403 Forbidden` - Document is `agreement`/`proposal` and caller isn't admin

---

### 6. Delete Document
**Endpoint:** `DELETE /documents/:id`

Only removes the database row — does **not** delete the underlying Drive file.

**Error Responses:**
- `404 Not Found`
- `403 Forbidden` - Document is `agreement`/`proposal` and caller isn't admin

---

### 7. Stream Document (view inline)
Streams the file from Google Drive (cached in-process by `fileId` after the first fetch — see `src/utils/fileCache.js`) with `Content-Disposition: inline`, for embedding in an `<iframe>`/`<a>`/`<img>` without exposing the raw Drive URL. Content-Type is taken from the document's own recorded `fileType` (falling back to Drive's reported type) so non-PDF files (e.g. Brand Kit images) render correctly rather than being forced to `application/pdf`. **Not gated by document type or role** (no Authorization header reaches this route — see the Authentication section).

**Endpoint:** `GET /documents/:id/stream`

**Error Responses:** `404 Not Found`, `500 Internal Server Error` (Drive fetch failed)

---

### 8. Email a Document
Emails the document to a given address with the actual file attached (not just a link) — used by the Invoice Generator's "Send Email" action. Requires `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` to be configured (see Environment Variables) — returns an error otherwise.

**Endpoint:** `POST /documents/:id/email`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| to | string | Yes | Recipient email address |
| subject | string | No | Email subject |
| text | string | No | Email body |

**Error Responses:**
- `400 Bad Request` - Missing `to`
- `404 Not Found` - Document not found
- `403 Forbidden` - Document is `agreement`/`proposal` and caller isn't admin

---

### 9. Upload Agreement
**Endpoint:** `POST /agreements/upload` — **admin only**
**Content-Type:** `multipart/form-data`

**Form Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes (unless `id` given and only updating metadata) | PDF, max 2MB |
| id | integer | No | If present, updates that agreement instead of creating a new one |
| clientId | integer | No | Uploads into `Agreements/` in the client's Drive folder |
| description | string | No | Free-text label |
| issuedDate | string (YYYY-MM-DD) | No | Issue date |
| expiryDate | string (YYYY-MM-DD) | No | Expiry date |
| status | string | No | `active` (default), `pending_signature`, `expired` |

**Error Responses:**
- `403 Forbidden` - Caller isn't admin
- `400 Bad Request` - No PDF provided (on create)
- `404 Not Found` - `id` given but no matching agreement

---

### 10. List Agreements
**Endpoint:** `GET /agreements` — **admin only**

**Query Parameters:** `clientId`, `status`, `page`/`limit` (optional — omitted returns everything, unpaginated)

This route is cached — see [Caching](#caching) (shares the `documents` prefix/TTL, 120s).

**Success Response (200 OK):** Includes `pagination` only when `page`/`limit` were passed.

---

### 11. Get Agreement by ID
**Endpoint:** `GET /agreements/:id` — **admin only** — **Error Responses:** `404 Not Found`

---

### 12. Update Agreement
**Endpoint:** `PUT /agreements/:id` — **admin only**

**Request Body:** `issuedDate`, `expiryDate`, `status`, `description`. Transitioning `status` from `pending_signature` to `active` auto-sets `signedAt`.

**Error Responses:** `404 Not Found`

---

### 13. Delete Agreement
**Endpoint:** `DELETE /agreements/:id` — **admin only** — **Error Responses:** `404 Not Found`

---

## Agency General Settings Management

**All endpoints in this section are admin only** (`403 Forbidden` for `team_member`). The `email`/`password` fields double as the admin's real login credentials — saving them here also updates the `admin` row in the `users` table, so only the admin may set them (a non-admin's attempt would otherwise be able to hijack the login).

### 1. Get Agency Settings
**Endpoint:** `GET /settings` or `GET /settings/general`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "logo": "/api/settings/logo-proxy/1abc...",
    "name": "Social Buzz Media Agency",
    "email": "hellosocialbuzzmedia@gmail.com",
    "website": "https://socialbuzz.com",
    "address": "456 Media Avenue, New York, NY",
    "gstNumber": "22AAAAA0000A1Z5",
    "password": "XrXkgyR|9?mwN,6+",
    "createdAt": "2026-08-20T12:00:00.000Z",
    "updatedAt": "2026-08-20T12:00:00.000Z"
  }
}
```

---

### 2. Update Agency Settings
**Endpoint:** `PUT /settings`, `PUT /settings/general`, `POST /settings`, `POST /settings/general`

**Request Body:**
| Field | Type | Description |
|-------|------|-------------|
| logo | string | Agency logo path (set via upload-logo, not written directly) |
| name | string | Agency name |
| email | string | Admin login email — also updates `users` |
| website | string | Agency website URL |
| address | string | Agency physical address |
| gstNumber / gst_number | string | Agency GST registration number |
| password | string | Admin login password — also updates `users` (encrypted both places) |

**Success Response (200 OK):** Same shape as Get Agency Settings.

---

### 3. Upload Agency Logo
**Endpoint:** `POST /settings/upload-logo` (or `/settings/upload-logo/file`)
**Content-Type:** `multipart/form-data`

**Form Body:**
| Field | Type | Description |
|-------|------|-------------|
| logo (or `file` on the `/file` variant) | file | Image, max 5MB |

**Success Response (200 OK):**
```json
{ "success": true, "message": "Logo uploaded to Google Drive successfully", "data": { "...": "full settings record" } }
```

**Error Responses:** `400 Bad Request` - No file provided or exceeds 5MB

---

### 4. Verify Password
**Endpoint:** `POST /settings/verify-password`

**Request Body:** `{ "password": "PasswordToTest" }`

**Success Response (200 OK):** `{ "success": true, "isMatch": true, "message": "Password matches successfully" }`

**Error Responses:** `401 Unauthorized` - `{ "success": false, "isMatch": false, "message": "Password does not match" }`

---

### 5. Google Drive Logo Stream Proxy
Proxies a Google Drive file stream so `<img>` tags can render it without CORS/auth issues. Used for both the agency logo and client logos. **Public — not gated by auth or role** (can't be, since `<img src>` can't send an Authorization header).

**Endpoint:** `GET /settings/logo-proxy/:fileId`

---

## Data Models

### User
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| name | STRING | NOT NULL | Display name |
| email | STRING | NOT NULL, UNIQUE | Login email |
| password | TEXT | NOT NULL | Reversibly encrypted (`enc:v1:...`) via `utils/encryption.js` |
| role | ENUM | NOT NULL, DEFAULT `team_member` | `admin` or `team_member` |
| createdAt / updatedAt | TIMESTAMP | DEFAULT NOW() | — |

**Table Name:** `users`

---

### Agency Setting
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Settings record ID |
| logo | STRING | NULLABLE | Agency logo path |
| name | STRING | NULLABLE | Agency name |
| email | STRING | NULLABLE | Doubles as the admin's login email |
| website | STRING | NULLABLE | Agency website URL |
| address | STRING | NULLABLE | Agency physical address |
| gstNumber | STRING | NULLABLE | Agency GST number |
| password | STRING | NULLABLE | Doubles as the admin's login password (AES-256-CBC, `utils/password.js`) |
| createdAt / updatedAt | TIMESTAMP | DEFAULT NOW() | — |

**Table Name:** `agency_settings`

---

### Team Member
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| name | STRING | NOT NULL | Member full name |
| email | STRING | NULLABLE | Contact email address |
| number | STRING | NULLABLE | Primary phone number |
| whatsappNumber | STRING | NULLABLE | WhatsApp contact number |
| address | STRING | NULLABLE | Physical address |
| aadharNumber | STRING | NULLABLE | ID number |
| avatar | TEXT | NULLABLE | Avatar image URL |
| resume | TEXT | NULLABLE | Resume file URL |
| bankDetails | TEXT | NULLABLE | Bank details (JSON text) |
| designation | STRING | NULLABLE | Job title |
| department | STRING | NULLABLE | Department (defaults to designation) |
| employmentType | STRING | NULLABLE | `full-time`, `internship`, `freelance` |
| hireDate | DATEONLY | NULLABLE | Hiring date |
| managerReportTo | STRING | NULLABLE | Manager name |
| status | STRING | NULLABLE | `active` or not, default null |
| assignedWorks | TEXT | NULLABLE | Assigned works (JSON text) |
| clientHandling | TEXT | NULLABLE | Handled clients (JSON text) |
| createdAt / updatedAt | TIMESTAMP | DEFAULT NOW() | — |

**Table Name:** `team_members`

---

### Client
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| name | STRING | NOT NULL | Client name |
| logo | TEXT | NULLABLE | Server-relative logo proxy path |
| industry | STRING | NULLABLE | Client industry |
| phoneNumber | STRING | NULLABLE | Primary phone number |
| whatsappNumber | STRING | NULLABLE | WhatsApp contact number |
| address | STRING | NULLABLE | Client address |
| email | STRING | NULLABLE | Client email address |
| website | STRING | NULLABLE | Client website URL |
| servicesSelected | TEXT | NULLABLE | Comma-separated |
| clientManagedBy | INTEGER | NULLABLE | References `TeamMember.id` (not FK-enforced) |
| clientHealth | INTEGER | NULLABLE, 0-100 | Client health score |
| proposals | TEXT | NULLABLE | Legacy comma-separated field |
| credentials | TEXT | NULLABLE | JSON array, passwords AES-256-GCM encrypted |
| campaigns | TEXT | NULLABLE | Comma-separated |
| socialMediaAccounts | TEXT | NULLABLE | Comma-separated |
| reports | TEXT | NULLABLE | Comma-separated |
| invoices | TEXT | NULLABLE | Comma-separated — **admin only** |
| notes | TEXT | NULLABLE | Free-text notes |
| renewal | DATE | NULLABLE | Contract renewal date |
| clientSince | DATEONLY | NULLABLE | Editable "became a client" date, defaults to `createdAt` if unset |
| contentCalendar | TEXT | NULLABLE | Legacy comma-separated field **and** JSON-serialized Google Sheet sync config (`googleSheetUrl`, `sheetTabs`, `lastSyncedAt`, etc.) — see Content Calendar |
| createdAt / updatedAt | TIMESTAMP | DEFAULT NOW() | — |

**Table Name:** `clients`

---

### Task
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| title | STRING | NOT NULL | Task title |
| description | TEXT | NULLABLE | Task description |
| status | STRING | DEFAULT `todo` | `todo`, `in_progress`, `review`, `completed` |
| priority | STRING | DEFAULT `medium` | `urgent`, `high`, `medium`, `low` |
| clientId | INTEGER | NULLABLE | Associated client |
| assignees | TEXT | NULLABLE, **deprecated** | Legacy JSON array of `TeamMember` IDs — no longer read/written; superseded by the `TaskAssignee` join table below (kept only as a rollback reference) |
| dueDate | DATE | NULLABLE | Due date |
| completedAt | DATE | NULLABLE | Set when status becomes `completed` |
| createdAt / updatedAt | TIMESTAMP | DEFAULT NOW() | — |

**Table Name:** `tasks`

---

### Task Assignee
Join table for `Task` ↔ `TeamMember` (many-to-many). Replaced the old `tasks.assignees` JSON-in-TEXT column, which had to be filtered with fragile `OR`'d `LIKE` patterns and could never use an index. Backfilled from that column via `scripts/migrate-task-assignees.js`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| taskId | INTEGER | PK (composite), FK → `tasks.id` | — |
| teamMemberId | INTEGER | PK (composite), FK → `team_members.id` | — |

No `createdAt`/`updatedAt` (`timestamps: false`). **Table Name:** `task_assignees`

---

### Lead
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| companyName | STRING | NOT NULL | — |
| contactName | STRING | NULLABLE | — |
| email | STRING | NULLABLE | — |
| phone | STRING | NULLABLE | — |
| source | STRING | NULLABLE | Free text (no fixed list — a new source needs no migration) |
| status | STRING | NOT NULL, DEFAULT `new` | `new`, `contacted`, `qualified`, `hot`, `lost` (app-level `isIn` validation, not a Postgres ENUM — adding a status is a code change, not a migration) |
| notes | TEXT | NULLABLE | Free-text notes |
| lastContactAt | DATE | NULLABLE | — |
| nextFollowUpAt | DATE | NULLABLE | Drives the `followUpDue` pipeline metric |
| createdAt / updatedAt | TIMESTAMP | DEFAULT NOW() | — |

**Table Name:** `leads`

---

### Meeting Note
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| title | STRING | NOT NULL | Note title |
| description | TEXT | NULLABLE | Free text |
| meetingDate | DATEONLY | NULLABLE | Date of meeting |
| meetingType | STRING | DEFAULT `other` | Category |
| attendees | TEXT | NULLABLE | Attendee names |
| actionItems | TEXT | NULLABLE | Follow-up items |
| clientId | INTEGER | NULLABLE | Associated client |
| createdBy | STRING | NULLABLE | Author name |
| createdAt / updatedAt | TIMESTAMP | DEFAULT NOW() | — |

**Table Name:** `meeting_notes`

---

### Content Calendar Entry
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| clientId | INTEGER | NOT NULL | Associated client |
| date | DATEONLY | NOT NULL | Scheduled date |
| holiday | STRING | NULLABLE | Holiday/occasion label |
| postTitle | STRING | NULLABLE | Post title |
| content | TEXT | NULLABLE | Post body |
| caption | TEXT | NULLABLE | Caption text |
| hashtags | TEXT | NULLABLE | Hashtags |
| platforms | TEXT | NULLABLE | JSON array, e.g. `["facebook","instagram"]` |
| status | ENUM | NOT NULL, DEFAULT `pending` | `pending`, `scheduled`, `posted` |
| postedAt | DATE | NULLABLE | Auto-set when status becomes `posted` |
| creatives | TEXT | NULLABLE | JSON array of `{ fileId, fileName, mimeType, driveLink, webViewLink, thumbnailLink, folderId, uploadedAt }` |
| createdAt / updatedAt | TIMESTAMP | DEFAULT NOW() | — |

**Table Name:** `content_calendar_entries`

---

### Misc Task
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| clientId | INTEGER | NOT NULL | Associated client |
| typeOfWork | ENUM | NOT NULL | `banner`, `video`, `social_media_banner`, `ooh` |
| assignedDate | DATEONLY | NULLABLE | Date assigned |
| deliveryDate | DATEONLY | NULLABLE | Delivery deadline |
| status | ENUM | NOT NULL, DEFAULT `pending` | `pending`, `progress`, `delivered` |
| assignedTo | INTEGER | NULLABLE | References `TeamMember.id` |
| notes | TEXT | NULLABLE | Free-text notes |
| fileName / fileType / fileSize | STRING/STRING/INTEGER | NULLABLE | Uploaded file metadata |
| fileId / driveLink / webViewLink / googleUserContentLink / folderId | STRING | NULLABLE | Google Drive references |
| createdAt / updatedAt | TIMESTAMP | DEFAULT NOW() | — |

**Table Name:** `misc_tasks`

---

### Document
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| fileName | STRING | NOT NULL | Original file name |
| fileType | STRING | NULLABLE | MIME type |
| fileSize | INTEGER | NULLABLE | Bytes |
| fileId | STRING | NOT NULL | Google Drive file ID |
| driveLink / webViewLink / googleUserContentLink | STRING | NULLABLE | Google Drive references |
| folderId | STRING | NULLABLE | Google Drive parent folder ID |
| clientId | INTEGER | NULLABLE | Associated client |
| uploadedBy | STRING | NULLABLE | Uploader name (not currently populated) |
| description | TEXT | NULLABLE | Free-text label |
| documentType | ENUM | DEFAULT `other` | `agreement`, `proposal`, `invoice`, `report`, `content_calendar`, `brand_kit`, `creative`, `strategy`, `other` |
| issuedDate / expiryDate | DATEONLY | NULLABLE | Agreement-specific |
| status | ENUM | DEFAULT `active` | Agreement-specific: `active`, `pending_signature`, `expired` |
| signedAt | DATE | NULLABLE | Agreement-specific, auto-set on activation |
| signedBy | STRING | NULLABLE | Agreement-specific (not currently populated) |
| createdAt / updatedAt | TIMESTAMP | DEFAULT NOW() | — |

**Table Name:** `documents`

---

## Important Notes

1. **`clientManagedBy`** references `TeamMember.id` (not a DB-level FK constraint) — this is unrelated to the `User` login table.

2. **Timestamps:** `createdAt` and `updatedAt` are automatically managed by Sequelize.

3. **Date Format:** Date fields accept and return ISO 8601 (e.g., `2026-12-31` or `2026-12-31T00:00:00.000Z`).

4. **Client Health:** The `clientHealth` field is validated to be between 0 and 100.

5. **Text/JSON Fields:** Many Client fields (`servicesSelected`, `proposals`, `campaigns`, `socialMediaAccounts`, `reports`, `invoices`) are stored as comma-separated TEXT and returned as arrays. `contentCalendar` is a JSON-serialized config object (see the Content Calendar section), not comma-separated. `credentials` is a genuine JSON array.

6. **Soft Deletes:** Not implemented. `DELETE` permanently removes the record (deleting a Document row does **not** delete the underlying Google Drive file).

7. **Schema changes:** `server/index.js` runs a non-destructive `sequelize.sync()` on every boot (creates missing tables, never alters existing columns). There are two ways to apply a real schema change:
   - **Preferred, for a live/shared database:** write a small idempotent script under `server/scripts/` (see `add-misc-task-notes-column.js` or `add-document-type-values.js` for the pattern — `ADD COLUMN IF NOT EXISTS` / `ADD VALUE IF NOT EXISTS`, safe to re-run), wire it up as an `npm run migrate:*` script in `package.json`, and run it deliberately. This never touches unrelated columns/data.
   - **Only when you can afford to, on a database you fully control:** `npm run db:sync` runs a destructive `sequelize.sync({ alter: true })`, which can drop/rewrite columns based on whatever the current models say — never run this against a database with data you care about without a backup.

8. **Rate Limiting:** Not implemented anywhere, including auth (`POST /auth/login`) and the newer Leads/Content-Calendar-sync endpoints. Consider adding for production.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment (`development` enables verbose SQL logging and dev-only behavior) | development |
| DATABASE_URL | Full Postgres connection string (preferred — used for Neon/managed hosts, auto-enables SSL) | - |
| DB_HOST / DB_PORT / DB_DATABASE / DB_USER / DB_PASS | Discrete Postgres connection params (used if `DATABASE_URL` isn't set) | - |
| DB_SSL | Force SSL on even when the host doesn't match the auto-detected managed-Postgres patterns (`neon.tech`, `supabase.co`, etc.) | auto-detected |
| SESSION_SECRET | Legacy secret used by `utils/password.js` (agency settings password encryption) | - |
| JWT_SECRET | Signs login JWTs. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | dev fallback (change in production) |
| CREDENTIALS_ENCRYPTION_KEY | Encrypts client social media credentials and user login passwords at rest. Generate the same way as `JWT_SECRET` | - (required — throws if unset) |
| REDIS_URL | Connection string for the shared server-side response cache (see [Caching](#caching)) — e.g. an [Upstash](https://upstash.com) free-tier URL. Omit to use the in-process fallback (fine for a single server instance) | - (falls back to in-process cache) |
| GOOGLE_DRIVE_CLIENT_ID | Google Drive API OAuth client ID | - |
| GOOGLE_DRIVE_CLIENT_SECRET | Google Drive API OAuth client secret | - |
| GOOGLE_DRIVE_REFRESH_TOKEN | Google Drive OAuth refresh token. Also used for Google Sheets API access (Content Calendar sync) | - |
| GOOGLE_DRIVE_FOLDER_ID | Root Drive folder new client/agency folders are created under | - |
| SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS | SMTP credentials for `POST /documents/:id/email` (e.g. the Invoice Generator's "Send Email" action). Emailing fails with a descriptive error if unset — everything else works without it | - |
| SMTP_SECURE | `true` for implicit TLS (port 465), `false`/unset for STARTTLS (port 587) | false |
| MAIL_FROM | From-address for outgoing mail | `SMTP_USER` |
| RENDER_EXTERNAL_URL | Set automatically by Render on every web service — enables a self-ping every 10 minutes (`src/utils/keepAlive.js`) so Render's free tier doesn't idle the service down and pay a 30-60s cold start on the next request | - (set by Render) |
| KEEP_ALIVE_URL | Manual override/equivalent to `RENDER_EXTERNAL_URL` for self-pinging on a non-Render host | - |
| SEED_ADMIN_NAME / SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD | Overrides for the admin account created by `npm run seed:users` | Admin / hellosocialbuzzmedia@gmail.com / (see script) |
| SEED_TEAM_NAME / SEED_TEAM_EMAIL / SEED_TEAM_PASSWORD | Overrides for the team_member account created by `npm run seed:users` | Team Member / team@socialbuzzmedia.com / (see script) |

> `CORS_ORIGIN` is **not** currently read anywhere in the code — `index.js` calls `cors()` with no options, which allows all origins unconditionally. Wire up an env-driven origin allowlist before relying on CORS as a boundary in production.

---

## Getting Started

```bash
# Install dependencies
cd server && npm install

# Create the admin and team_member login accounts (run once)
npm run seed:users

# Start development server
npm run dev

# Start production server
npm start
```

Server will run on `http://localhost:5000` (or `PORT` from `.env`). Log in via `POST /api/auth/login` with the seeded (or `SEED_*`-overridden) credentials, then use the returned token as a `Bearer` token on every other request.

To apply a real schema change, prefer writing a new `server/scripts/*.js` migration and an `npm run migrate:*` script for it (see note 7 above and the existing `migrate:*` scripts in `package.json`); reach for `npm run db:sync` only when you can afford a destructive `alter: true` against the target database.

Optional integrations that degrade gracefully when unconfigured: `REDIS_URL` (server response cache — falls back to in-process), `SMTP_*` (document/invoice emailing — fails with a clear error if unset, doesn't block anything else).

---

## Future Enhancements

- [x] User authentication & authorization (JWT, admin/team_member roles)
- [x] Shared response caching (Redis-or-in-memory) for the heaviest list endpoints
- [x] Pagination for Clients/Tasks/Leads/Agreements/Misc Tasks/Documents
- [ ] Fine-grained permissions beyond the current two roles
- [ ] Soft deletes
- [ ] Search & filtering for more list endpoints (e.g. Content Calendar has no free-text search)
- [ ] Input validation middleware (currently ad hoc per-route)
- [ ] Rate limiting
- [ ] Audit logging
- [ ] API versioning
- [ ] Proper Sequelize migrations instead of ad hoc `scripts/*.js` + `sync({ alter: true })`
- [ ] An env-driven `CORS_ORIGIN` allowlist (currently `cors()` allows all origins unconditionally)
