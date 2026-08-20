# Social Buzz Media CRM - API Documentation

## Overview
CRM API built with Express, PostgreSQL (Sequelize), and Google Drive integration for document management.

**Base URL:** `http://localhost:3000/api`

---

## Authentication
*Currently not implemented. All routes are public.*

---

## Client Management

### 1. Create Client
Creates a new client record.

**Endpoint:** `POST /clients`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Client name |
| industry | string | No | Client industry (e.g., Technology, Healthcare, Retail) |
| phoneNumber | string | No | Primary phone number |
| whatsappNumber | string | No | WhatsApp contact number |
| address | string | No | Client address |
| email | string | No | Client email address |
| servicesSelected | string | No | Services selected by the client (stored as text/JSON) |
| clientManagedBy | integer | No | ID of user managing this client |
| clientHealth | integer | No | Client health score (0-100) |
| proposals | string | No | Proposals related to the client (stored as text/JSON) |
| credentials | string | No | Client credentials (stored as text/JSON) |
| campaigns | string | No | Campaigns associated with the client (stored as text/JSON) |
| socialMediaAccounts | string | No | Social media accounts for the client (stored as text/JSON) |
| reports | string | No | Reports related to the client (stored as text/JSON) |
| invoices | string | No | Invoices for the client (stored as text/JSON) |
| notes | string | No | Additional notes about the client |
| renewal | string (ISO 8601) | No | Contract renewal date |
| contentCalendar | string | No | Content calendar data (stored as text/JSON) |

**Example Request:**
```json
{
  "name": "Acme Corporation",
  "industry": "Technology",
  "phoneNumber": "+1-555-123-4567",
  "whatsappNumber": "+1-555-123-4567",
  "address": "123 Tech Blvd, San Francisco, CA",
  "email": "contact@acme.com",
  "servicesSelected": "Social Media Management, SEO, PPC",
  "clientManagedBy": 1,
  "clientHealth": 85,
  "proposals": "Q4 Marketing Strategy",
  "campaigns": "Holiday Sale 2026",
  "socialMediaAccounts": "Instagram: @acme, Twitter: @acme_corp",
  "notes": "Key account - priority support",
  "renewal": "2026-12-31",
  "contentCalendar": "Monthly content plan for Aug-Dec 2026"
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
    "industry": "Technology",
    "phoneNumber": "+1-555-123-4567",
    "whatsappNumber": "+1-555-123-4567",
    "address": "123 Tech Blvd, San Francisco, CA",
    "email": "contact@acme.com",
    "servicesSelected": "Social Media Management, SEO, PPC",
    "clientManagedBy": 1,
    "clientHealth": 85,
    "proposals": "Q4 Marketing Strategy",
    "credentials": null,
    "campaigns": "Holiday Sale 2026",
    "socialMediaAccounts": "Instagram: @acme, Twitter: @acme_corp",
    "reports": null,
    "invoices": null,
    "notes": "Key account - priority support",
    "renewal": "2026-12-31T00:00:00.000Z",
    "contentCalendar": "Monthly content plan for Aug-Dec 2026",
    "createdAt": "2026-08-19T11:20:30.000Z",
    "updatedAt": "2026-08-19T11:20:30.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing required field (name)
- `500 Internal Server Error` - Database or server error

---

### 2. Get All Clients
Retrieves all clients ordered by creation date (newest first).

**Endpoint:** `GET /clients`

**Query Parameters:** None

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Acme Corporation",
      "industry": "Technology",
      "phoneNumber": "+1-555-123-4567",
      "whatsappNumber": "+1-555-123-4567",
      "address": "123 Tech Blvd, San Francisco, CA",
      "email": "contact@acme.com",
      "servicesSelected": "Social Media Management, SEO, PPC",
      "clientManagedBy": 1,
      "clientHealth": 85,
      "proposals": "Q4 Marketing Strategy",
      "credentials": null,
      "campaigns": "Holiday Sale 2026",
      "socialMediaAccounts": "Instagram: @acme, Twitter: @acme_corp",
      "reports": null,
      "invoices": null,
      "notes": "Key account - priority support",
      "renewal": "2026-12-31T00:00:00.000Z",
      "contentCalendar": "Monthly content plan for Aug-Dec 2026",
      "createdAt": "2026-08-19T11:20:30.000Z",
      "updatedAt": "2026-08-19T11:20:30.000Z"
    }
  ]
}
```

---

### 3. Get Client by ID
Retrieves a single client by its ID.

**Endpoint:** `GET /clients/:id`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Client ID |

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Acme Corporation",
    "industry": "Technology",
    "phoneNumber": "+1-555-123-4567",
    "whatsappNumber": "+1-555-123-4567",
    "address": "123 Tech Blvd, San Francisco, CA",
    "email": "contact@acme.com",
    "servicesSelected": "Social Media Management, SEO, PPC",
    "clientManagedBy": 1,
    "clientHealth": 85,
    "proposals": "Q4 Marketing Strategy",
    "credentials": null,
    "campaigns": "Holiday Sale 2026",
    "socialMediaAccounts": "Instagram: @acme, Twitter: @acme_corp",
    "reports": null,
    "invoices": null,
    "notes": "Key account - priority support",
    "renewal": "2026-12-31T00:00:00.000Z",
    "contentCalendar": "Monthly content plan for Aug-Dec 2026",
    "createdAt": "2026-08-19T11:20:30.000Z",
    "updatedAt": "2026-08-19T11:20:30.000Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Client with given ID does not exist
- `500 Internal Server Error` - Database or server error

---

### 4. Update Client
Updates an existing client record. All fields are optional.

**Endpoint:** `PUT /clients/:id`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Client ID |

**Request Body:** (All fields optional)
| Field | Type | Description |
|-------|------|-------------|
| name | string | Client name |
| industry | string | Client industry |
| phoneNumber | string | Primary phone number |
| whatsappNumber | string | WhatsApp contact number |
| address | string | Client address |
| email | string | Client email address |
| servicesSelected | string | Services selected by the client |
| clientManagedBy | integer | ID of user managing this client |
| clientHealth | integer | Client health score (0-100) |
| proposals | string | Proposals related to the client |
| credentials | string | Client credentials |
| campaigns | string | Campaigns associated with the client |
| socialMediaAccounts | string | Social media accounts |
| reports | string | Reports related to the client |
| invoices | string | Invoices for the client |
| notes | string | Additional notes |
| renewal | string (ISO 8601) | Contract renewal date |
| contentCalendar | string | Content calendar data |

**Example Request:**
```json
{
  "clientHealth": 92,
  "notes": "Client satisfaction improved after Q3 review",
  "renewal": "2027-06-30",
  "campaigns": "Holiday Sale 2026, New Year Promo"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Client updated successfully",
  "data": {
    "id": 1,
    "name": "Acme Corporation",
    "industry": "Technology",
    "phoneNumber": "+1-555-123-4567",
    "whatsappNumber": "+1-555-123-4567",
    "address": "123 Tech Blvd, San Francisco, CA",
    "email": "contact@acme.com",
    "servicesSelected": "Social Media Management, SEO, PPC",
    "clientManagedBy": 1,
    "clientHealth": 92,
    "proposals": "Q4 Marketing Strategy",
    "credentials": null,
    "campaigns": "Holiday Sale 2026, New Year Promo",
    "socialMediaAccounts": "Instagram: @acme, Twitter: @acme_corp",
    "reports": null,
    "invoices": null,
    "notes": "Client satisfaction improved after Q3 review",
    "renewal": "2027-06-30T00:00:00.000Z",
    "contentCalendar": "Monthly content plan for Aug-Dec 2026",
    "createdAt": "2026-08-19T11:20:30.000Z",
    "updatedAt": "2026-08-19T11:35:45.000Z"
  }
}
```

**Error Responses:**
- `404 Not Found` - Client with given ID does not exist
- `500 Internal Server Error` - Database or server error

---

### 5. Delete Client
Permanently deletes a client record.

**Endpoint:** `DELETE /clients/:id`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Client ID |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Client with given ID does not exist
- `500 Internal Server Error` - Database or server error

---

## Team Member Management

### 1. Create Team Member
Creates a new team member record.

**Endpoint:** `POST /team-members`

**Request Body:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | string | Yes | - | Team member full name |
| email | string | No | null | Contact email address |
| number / phoneNumber | string | No | null | Primary phone number |
| whatsappNumber / whatsapp_number | string | No | null | WhatsApp contact number |
| address | string | No | null | Physical address |
| designation | string | No | null | Job title / designation |
| department | string | No | designation | Department name (defaults to designation) |
| employmentType / type_of_employment | string | No | null | Employment type (`full-time`, `internship`, `freelance`) |
| hireDate / hire_date | string (YYYY-MM-DD) | No | null | Date of hire |
| managerReportTo / manager_report_to | string | No | null | Manager name / reporting manager |
| status | string | No | null | Employment status (e.g. `active`, `inactive`, default: null) |
| assignedWorks / assigned_works | array / string | No | null | Multiple assigned works/tasks (default: null) |
| clientHandling / client_handling | array / string | No | null | Managed client names or IDs (default: null) |

**Example Request:**
```json
{
  "name": "Sarah Connor",
  "email": "sarah.connor@example.com",
  "number": "+1234567890",
  "whatsappNumber": "+1234567890",
  "address": "123 Tech Park, Suite 400, San Francisco, CA",
  "designation": "Senior Frontend Developer",
  "department": "Engineering",
  "employmentType": "full-time",
  "hireDate": "2024-03-15",
  "managerReportTo": "John Doe",
  "status": null,
  "assignedWorks": ["UI Refactoring", "Design System"],
  "clientHandling": null
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Team member added successfully",
  "data": {
    "id": 1,
    "name": "Sarah Connor",
    "email": "sarah.connor@example.com",
    "number": "+1234567890",
    "whatsappNumber": "+1234567890",
    "address": "123 Tech Park, Suite 400, San Francisco, CA",
    "designation": "Senior Frontend Developer",
    "department": "Engineering",
    "employmentType": "full-time",
    "hireDate": "2024-03-15",
    "managerReportTo": "John Doe",
    "status": null,
    "assignedWorks": "[\"UI Refactoring\",\"Design System\"]",
    "clientHandling": null,
    "createdAt": "2026-08-20T12:00:00.000Z",
    "updatedAt": "2026-08-20T12:00:00.000Z"
  }
}
```

---

### 2. Get All Team Members
Retrieves all team members ordered by creation date (newest first).

**Endpoint:** `GET /team-members`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sarah Connor",
      "email": "sarah.connor@example.com",
      "designation": "Senior Frontend Developer",
      "department": "Engineering",
      "employmentType": "full-time",
      "status": null
    }
  ]
}
```

---

### 3. Get Team Member by ID
Retrieves a single team member by ID.

**Endpoint:** `GET /team-members/:id`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Sarah Connor",
    "email": "sarah.connor@example.com",
    "number": "+1234567890",
    "whatsappNumber": "+1234567890",
    "address": "123 Tech Park, Suite 400, San Francisco, CA",
    "designation": "Senior Frontend Developer",
    "department": "Engineering",
    "employmentType": "full-time",
    "hireDate": "2024-03-15",
    "managerReportTo": "John Doe",
    "status": null,
    "assignedWorks": "[\"UI Refactoring\",\"Design System\"]",
    "clientHandling": null
  }
}
```

---

### 4. Update Team Member
Updates an existing team member record.

**Endpoint:** `PUT /team-members/:id`

**Example Request:**
```json
{
  "status": "active",
  "clientHandling": ["Acme Corp", "Global Tech"],
  "assignedWorks": ["UI Refactoring", "API Integration"]
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Team member updated successfully",
  "data": {
    "id": 1,
    "status": "active",
    "clientHandling": "[\"Acme Corp\",\"Global Tech\"]",
    "assignedWorks": "[\"UI Refactoring\",\"API Integration\"]"
  }
}
```

---

### 5. Delete Team Member
Permanently deletes a team member record.

**Endpoint:** `DELETE /team-members/:id`

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Team member deleted successfully"
}
```

---

## Data Model: Team Member

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| name | STRING | NOT NULL | Member full name |
| email | STRING | NULLABLE | Contact email address |
| number | STRING | NULLABLE | Primary phone number |
| whatsappNumber | STRING | NULLABLE | WhatsApp contact number |
| address | STRING | NULLABLE | Physical address |
| designation | STRING | NULLABLE | Job title / designation |
| department | STRING | NULLABLE | Department name (defaults to designation) |
| employmentType | STRING | NULLABLE | Employment type (`full-time`, `internship`, `freelance`) |
| hireDate | DATEONLY | NULLABLE | Hiring date |
| managerReportTo | STRING | NULLABLE | Manager name / ID |
| status | STRING | NULLABLE, DEFAULT null | Status (`active` or not, default null) |
| assignedWorks | TEXT | NULLABLE, DEFAULT null | Assigned works (stored as JSON/text) |
| clientHandling | TEXT | NULLABLE, DEFAULT null | Handled clients (stored as JSON/text) |
| createdAt | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Table Name:** `team_members`

---

## Data Model: Client

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| name | STRING | NOT NULL | Client name |
| industry | STRING | NULLABLE | Client industry |
| phoneNumber | STRING | NULLABLE | Primary phone number |
| whatsappNumber | STRING | NULLABLE | WhatsApp contact number |
| address | STRING | NULLABLE | Client address |
| email | STRING | NULLABLE | Client email address |
| servicesSelected | TEXT | NULLABLE | Services selected (stored as text/JSON) |
| clientManagedBy | INTEGER | NULLABLE | References User.id (FK - not enforced) |
| clientHealth | INTEGER | NULLABLE, 0-100 | Client health score |
| proposals | TEXT | NULLABLE | Proposals (stored as text/JSON) |
| credentials | TEXT | NULLABLE | Credentials (stored as text/JSON) |
| campaigns | TEXT | NULLABLE | Campaigns (stored as text/JSON) |
| socialMediaAccounts | TEXT | NULLABLE | Social media accounts (stored as text/JSON) |
| reports | TEXT | NULLABLE | Reports (stored as text/JSON) |
| invoices | TEXT | NULLABLE | Invoices (stored as text/JSON) |
| notes | TEXT | NULLABLE | Additional notes |
| renewal | DATE | NULLABLE | Contract renewal date |
| contentCalendar | TEXT | NULLABLE | Content calendar (stored as text/JSON) |
| createdAt | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Table Name:** `clients`

---

## Important Notes

1. **Foreign Key Constraint:** The `clientManagedBy` field references a `User` table that doesn't exist yet. The FK constraint is defined in the model but not enforced at DB level until User model is created.

2. **Timestamps:** `createdAt` and `updatedAt` are automatically managed by Sequelize.

3. **Date Format:** All date fields accept and return ISO 8601 format (e.g., `2026-12-31` or `2026-12-31T00:00:00.000Z`).

4. **Client Health:** The `clientHealth` field is validated to be between 0 and 100.

5. **Text/JSON Fields:** Fields like `servicesSelected`, `proposals`, `credentials`, `campaigns`, `socialMediaAccounts`, `reports`, `invoices`, and `contentCalendar` are stored as TEXT but can hold JSON strings for structured data.

6. **Soft Deletes:** Not implemented. `DELETE` permanently removes the record.

7. **Validation:** Only `name` is validated as required. Add more validation as needed.

8. **Pagination:** Not implemented for `GET /clients`. Will be added when dataset grows.

9. **Rate Limiting:** Not implemented. Consider adding for production.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_DATABASE | Database name | social_buzz |
| DB_USER | Database user | postgres |
| DB_PASS | Database password | - |
| GOOGLE_DRIVE_CLIENT_ID | Google Drive API client ID | - |
| GOOGLE_DRIVE_CLIENT_SECRET | Google Drive API client secret | - |
| GOOGLE_DRIVE_REFRESH_TOKEN | Google Drive refresh token | - |

---

## Getting Started

```bash
# Install dependencies
cd server && npm install

# Start development server
npm run dev

# Start production server
npm start
```

Server will run on `http://localhost:3000` (or PORT from .env).

---

## Future Enhancements

- [ ] User authentication & authorization
- [ ] User model and relationship with Client
- [ ] Document management (invoices, reports, notes) with Google Drive
- [ ] Renewal reminders/notifications
- [ ] Search & filtering for clients
- [ ] Pagination for list endpoints
- [ ] Input validation middleware
- [ ] Rate limiting
- [ ] Audit logging
- [ ] API versioning