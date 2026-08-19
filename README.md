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
| category | string | No | Client category (e.g., Enterprise, SMB, Individual) |
| responsibleUserId | integer | No | ID of user responsible for this client |
| renewalDate | string (ISO 8601) | No | Contract renewal date |
| invoiceNumber | string | No | Invoice reference number |

**Example Request:**
```json
{
  "name": "Acme Corporation",
  "category": "Enterprise",
  "responsibleUserId": 1,
  "renewalDate": "2026-12-31",
  "invoiceNumber": "INV-2026-001"
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
    "category": "Enterprise",
    "responsibleUserId": 1,
    "renewalDate": "2026-12-31T00:00:00.000Z",
    "invoiceNumber": "INV-2026-001",
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
      "category": "Enterprise",
      "responsibleUserId": 1,
      "renewalDate": "2026-12-31T00:00:00.000Z",
      "invoiceNumber": "INV-2026-001",
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
    "category": "Enterprise",
    "responsibleUserId": 1,
    "renewalDate": "2026-12-31T00:00:00.000Z",
    "invoiceNumber": "INV-2026-001",
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
| category | string | Client category |
| responsibleUserId | integer | Responsible user ID |
| renewalDate | string (ISO 8601) | Contract renewal date |
| invoiceNumber | string | Invoice reference number |

**Example Request:**
```json
{
  "category": "SMB",
  "renewalDate": "2027-06-30"
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
    "category": "SMB",
    "responsibleUserId": 1,
    "renewalDate": "2027-06-30T00:00:00.000Z",
    "invoiceNumber": "INV-2026-001",
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

## Data Model: Client

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| name | STRING | NOT NULL | Client name |
| category | STRING | NULLABLE | Client category |
| responsibleUserId | INTEGER | NULLABLE | References User.id (FK - not enforced) |
| renewalDate | DATE | NULLABLE | Contract renewal date |
| invoiceNumber | STRING | NULLABLE | Invoice reference |
| createdAt | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Table Name:** `clients`

---

## Important Notes

1. **Foreign Key Constraint:** The `responsibleUserId` field references a `User` table that doesn't exist yet. The FK constraint is defined in the model but not enforced at DB level until User model is created.

2. **Timestamps:** `createdAt` and `updatedAt` are automatically managed by Sequelize.

3. **Date Format:** All date fields accept and return ISO 8601 format (e.g., `2026-12-31` or `2026-12-31T00:00:00.000Z`).

4. **Soft Deletes:** Not implemented. `DELETE` permanently removes the record.

5. **Validation:** Only `name` is validated as required. Add more validation as needed.

6. **Pagination:** Not implemented for `GET /clients`. Will be added when dataset grows.

7. **Rate Limiting:** Not implemented. Consider adding for production.

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