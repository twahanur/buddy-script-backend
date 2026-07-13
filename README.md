# ⚙️ Buddy Script - Social Network Backend

Buddy Script Backend is a high-performance, enterprise-grade Rest API server built using **NestJS**, **Prisma ORM**, and **TypeScript**. It is designed to scale dynamically using client-side **Database Read/Write Splitting (Replication)**, fast **Redis Caching**, asynchronous **BullMQ Background Workers**, and secure JWT authentication.

---

## 📊 Database Replication Architecture (Read/Write Splitting)

To optimize database load and increase read scalability, Buddy Script implements client-side database replication using `@prisma/extension-read-replicas` and `@prisma/adapter-pg`.

### Architectural Design
Writes (mutations) and reads are split cleanly across connection pools:
*   **Write Operations** (`create`, `update`, `delete`, transactions): Sent to the **Primary PostgreSQL Database** connection pool.
*   **Read Operations** (`findMany`, `findFirst`, `findUnique`, counts): Routed to the **Read Replica PostgreSQL Database** connection pool.

Here is the architectural diagram explaining the replication mechanism:

![Database Replication Architecture](readmeImage/ChatGPT%20Image%20Jul%2012%2C%202026%2C%2003_53_28%20PM.png)

*Note: If no replica configuration (`REPLICA_URL`) is supplied, the system automatically falls back to proxying all queries to the Primary connection pool.*

---

## 🚀 Key Architectural Features

*   **⚡ Database Read Replicas**: Implements load-splitting between a primary database write node and replica read nodes, routing traffic via server-side connection pool adapters (`pg` pools).
*   **⚙️ Prisma Multi-file Schemas**: Organizes the database schema using the `prismaSchemaFolder` preview feature, splitting entities logically (`user.prisma`, `post.prisma`, `comment.prisma`, `reply.prisma`).
*   **🐝 BullMQ Asynchronous Queues**: Delegates CPU-intensive and side-effect tasks to background queues powered by Upstash Redis:
    *   `notifications`: Dispatches social notifications without blocking request-response threads.
    *   `image-processing`: Optimizes and compresses uploaded timeline media.
*   **🚀 Redis Cache Manager**: Dedicated `RedisService` client configured with BullMQ-compatible options (`maxRetriesPerRequest: null`) managing session caching and fast TTL storage.
*   **🛡️ Multi-layered Security**:
    *   **Throttler**: API rate-limiting to prevent brute force/DOS attempts.
    *   **JWT & Bcrypt**: Secure token verification and password hashing.
*   **☁️ Cloudreve File Hub**: Integration with Cloudreve APIs for remote media and image management policies.

---

## 🛠️ Technology Stack

| Technology | Purpose |
| :--- | :--- |
| **NestJS 11** | Core modular backend framework |
| **Prisma ORM 7** | Type-safe database client with multi-file support |
| **PostgreSQL** | Primary relational database storage |
| **Redis** | In-memory key-value caching and queue store |
| **BullMQ 5** | Robust queue and background job runner |
| **Pino & Pino-Pretty** | Low-overhead structured JSON logger |

---

## 📁 Directory Structure

```text
prisma/
├── schema/               # Split Prisma entity definitions
│   ├── comment.prisma    # Comment schema & relations
│   ├── post.prisma       # Post schema & media links
│   ├── reply.prisma      # Reply schema & comment links
│   ├── schema.prisma     # Main Prisma configuration
│   └── user.prisma       # User account details
└── seed.ts               # Database seed runner (creates admin user)
src/
├── app.module.ts         # Root AppModule orchestrating registrations
├── main.ts               # App entrypoint (initializes CORS, cookies, validation)
├── prisma.config.ts      # Multi-schema Prisma client configuration
├── config/               # Global config schemas
├── decorators/           # Custom NestJS decorator wrappers
├── filters/              # Global error filters
├── middleware/           # HTTP Request loggers and cookie parsers
├── redis/                # Redis connection and cache management
├── shared/               # Shared utilities
└── modules/              # Sub-modules
    ├── auth/             # Authentication controller & token generation
    ├── comments/         # Comments and replies creation
    ├── health/           # Liveness/Readiness healthchecks
    ├── likes/            # Likes toggling on posts, comments, & replies
    ├── posts/            # Feed post retrieval and cursor-based pagination
    ├── queues/           # BullMQ notifications and image queues
    └── upload/           # Media upload endpoints
```

---

## ⚙️ Environment Variables Config (`.env`)

Configure the following variables in the root `/Backend/.env` file:

```env
# Server Port
PORT=5000

# Security
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=7d

# Databases (PostgreSQL)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"  # Primary (Read & Write)
REPLICA_URL="postgresql://user:pass@host/db?sslmode=require"   # Replica (Read Only)

# Caching & Queue System (Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_TLS=false # Set to true if connecting to secure TLS Redis e.g. Upstash

# CORS Origins
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Cloudreve Integration
CLOUDREVE_URL=https://your-cloudreve-instance.com
CLOUDREVE_EMAIL=admin@your-cloudreve.com
CLOUDREVE_PASSWORD=your_password
CLOUDREVE_POLICY_ID=policy_hash
```

---

## 🛠️ Local Development Setup

### 1. Install Dependencies
```bash
cd Backend
npm install
```

### 2. Prepare Database Schema
Synchronize the PostgreSQL schemas using Prisma:
```bash
npm run prisma:push
npm run prisma:generate
```

### 3. Run Database Seeding
Populate the database with default configurations and an initial admin account:
```bash
npx prisma db seed
```

### 4. Run Server in Development
Start the application with hot-reloading:
```bash
npm run dev
```
The server will start listening on the port configured in `.env` (default is `http://localhost:5000`).

---

## ⚙️ Production Operations

### Compile App
```bash
npm run build
```

### Start Production Build
```bash
npm run start
```
