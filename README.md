# Mini ERP + CRM Operations Portal Backend (`backendv1`)

A production-grade, highly scalable, and concurrency-safe Mini ERP + CRM Operations Portal backend built with **Node.js (ES Modules)**, **Express.js**, and **PostgreSQL (raw SQL via `pg`)**.

---

## Technical Stack & Architecture

- **Runtime & Language**: Node.js (ES Modules), pure JavaScript (No TypeScript)
- **Framework**: Express.js
- **Database**: PostgreSQL (Official `pg` pool driver - **Strictly No ORM**)
- **Authentication**: JWT Access Token (15m) + Refresh Token Rotation (7d)
- **Validation**: Zod (schema validation for all endpoints, UUID, Phone, Email, GST, Quantity)
- **Security**: Helmet (HTTP headers), CORS, `express-rate-limit`
- **Logging**: Pino structured logger with Request ID tracing (`X-Request-Id`)
- **Testing**: Jest + Supertest (Unit, Integration, and Concurrency Tests)

---

## Directory Architecture

```
backendv1/
├── src/
│   ├── app.js                   # Express application setup (Middleware, Helmet, CORS, Error Handler)
│   ├── server.js                # Server entry point with graceful shutdown
│   ├── config/
│   │   ├── db.js                # PostgreSQL connection pool & transaction helper
│   │   ├── env.js               # Environment variables configuration
│   │   └── logger.js            # Pino structured logger instance
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── rbac.js              # Role-Based Access Control middleware
│   │   ├── validate.js          # Zod request validation middleware
│   │   ├── errorHandler.js      # Centralized error handler returning uniform error envelope
│   │   └── requestId.js         # Unique request ID assignment middleware
│   ├── utils/
│   │   ├── pagination.js        # Pagination & metadata calculation helpers
│   │   ├── response.js          # Standard response envelopes (Success, Collection, Error)
│   │   ├── errors.js            # Custom error hierarchy (AppError, InsufficientStockError, etc.)
│   │   └── challanNumber.js     # PostgreSQL sequence generator (SC-YYYY-000001)
│   ├── modules/
│   │   ├── auth/                # Login, Refresh, Logout, /me
│   │   ├── users/               # Admin user management
│   │   ├── customers/           # Customer management & follow-up history
│   │   ├── followups/           # Sales follow-up tracking
│   │   ├── products/            # Product catalog & stock levels
│   │   ├── inventory/           # Stock adjustments & movement audit log
│   │   ├── challans/            # Concurrency-safe Sales Challan operations
│   │   └── dashboard/           # Summary KPIs & low-stock analytics
│   ├── routes/
│   │   └── index.js             # Central router mounting all modules under /api/v1
│   └── database/
│       ├── schema.sql           # PostgreSQL tables, constraints, and sequences
│       ├── migrate.js          # Schema migration script
│       └── seed.js             # Initial database seed script
├── tests/
│   ├── setup.js                 # Jest setup & teardown
│   ├── auth.test.js             # Auth integration tests
│   ├── rbac.test.js             # RBAC enforcement tests
│   ├── customers.test.js        # Customer CRUD tests
│   ├── products.test.js         # Product CRUD & low-stock filter tests
│   ├── inventory.test.js        # Inventory adjustment tests
│   ├── challans.test.js         # Challan lifecycle tests
│   └── concurrency.test.js      # Concurrency stock deduction tests (SELECT FOR UPDATE)
├── Dockerfile                   # Production Dockerfile
├── docker-compose.yml           # Docker Compose (API + PostgreSQL 16)
├── Postman_Collection.json      # Postman API Collection
├── .env.example                 # Environment variable template
├── .env                         # Local environment settings
└── package.json                 # Project dependencies & scripts
```

---

## Role-Based Access Control (RBAC)

| Role | Access Permissions |
|---|---|
| `ADMIN` | Full access to all endpoints (Users, Customers, Products, Inventory, Challans, Dashboard) |
| `SALES` | Access to Customers, Follow-ups, Product viewing, Draft Challans, Dashboard |
| `WAREHOUSE` | Access to Products management, Stock Adjustments, Movements Log, Challan Confirmations |
| `ACCOUNTS` | Access to Customer read, Challan read & cancellation, Dashboard summary |

---

## Critical Concurrency Safety Strategy

Stock deduction during Sales Challan confirmation uses PostgreSQL explicit transactions and row-level pessimistic locking:

```sql
BEGIN;
-- 1. Lock product row for exclusive update
SELECT id, current_stock FROM products WHERE id = $1 FOR UPDATE;

-- 2. Verify stock availability (current_stock >= quantity)
-- 3. Atomic stock update
UPDATE products 
SET current_stock = current_stock - $1, updated_at = CURRENT_TIMESTAMP 
WHERE id = $2 AND current_stock >= $1;

-- 4. Log stock movement record
INSERT INTO stock_movements (...);

COMMIT;
```

If stock is insufficient, the transaction rolls back immediately and returns HTTP **409 Conflict**:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock"
  }
}
```

---

## Getting Started

### 1. Requirements
- Node.js v18+
- PostgreSQL 14+ (or Docker)

### 2. Installation
```bash
cd backendv1
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and set database credentials:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_erp_db
DB_USER=postgres
DB_PASSWORD=postgres
```

### 4. Database Setup & Seed
```bash
npm run db:migrate
npm run db:seed
```

### 5. Running the Application
```bash
# Development Mode (watch mode)
npm run dev

# Production Mode
npm start
```

### 6. Running Tests
```bash
npm test
```

### 7. Docker Deployment
```bash
docker-compose up --build
```

---

## Seed Account Credentials

| Email | Password | Role |
|---|---|---|
| `admin@crm.com` | `Password123!` | `ADMIN` |
| `sales@crm.com` | `Password123!` | `SALES` |
| `warehouse@crm.com` | `Password123!` | `WAREHOUSE` |
| `accounts@crm.com` | `Password123!` | `ACCOUNTS` |
