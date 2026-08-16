# SMAK — Intelligent Culinary Platform

An AI-first culinary and recipe discovery platform. Combines hybrid vector similarity search (`pgvector`), a multi-turn Google Gemini AI assistant with real-time SSE streaming and dynamic tool execution, asynchronous content moderation queues (BullMQ), and subscription billing (LiqPay).

---

## Architecture Overview

```
                                 ┌───────────────────────┐
                                 │   Browser / Client    │
                                 └───────────┬───────────┘
                                             │ HTTP / HTTPS (Ports 80/443)
                                             ▼
                                 ┌───────────────────────┐
                                 │  Caddy Reverse Proxy  │
                                 └───┬───────────────┬───┘
                                     │               │
                    /api/*, /admin/* │               │ /* (All other routes)
                                     ▼               ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  NestJS Backend │     │ Nuxt 4 Frontend │
                        └───┬─────┬─────┬─┘     └─────────────────┘
                            │     │     │
            ┌───────────────┘     │     └───────────────┐
            ▼                     ▼                     ▼
┌───────────────────────┐ ┌───────────────┐ ┌────────────────────────┐
│ PostgreSQL + pgvector │ │ Redis + BullMQ│ │  Google Gemini GenAI   │
│ (Relational & Vectors)│ │(Cache & Queue)│ │ (Embeddings & Assistant│
└───────────────────────┘ └───────────────┘ └────────────────────────┘
```

The repository is organized as a fullstack monorepo:

- [**`api/`**](api/README.md) — NestJS 10 backend service handling business logic, vector search, Gemini AI orchestration, and BullMQ background workers.
- [**`client/`**](client/README.md) — Nuxt 4 / Vue 3 frontend application featuring hybrid SSR/CSR, `@nuxt/ui` design system, and live AI chat streaming.

---

## Core Capabilities

- **AI Culinary Assistant**: Conversational assistant powered by Google Gemini (`gemini-3.1-flash-lite`) supporting multi-turn tool calling (recipe searching, dietary constraints) and live Server-Sent Events (SSE) streaming with interactive UI card injection.
- **Hybrid Semantic Search**: Combines PostgreSQL relational filtering (allergens, vegan/vegetarian flags, cooking duration, difficulty) with 768-dimensional vector cosine similarity via `pgvector` and Gemini embeddings.
- **In-Context Recipe Guidance**: Recipe view with ingredient checklists, step-by-step directions, and an integrated floating AI assistant for instant culinary substitutions and advice.
- **Automated Content Moderation**: Asynchronous BullMQ queue worker evaluating submitted recipes and reviews against safety policies via structured Gemini prompts.
- **Subscription Billing**: Monetization pipeline with LiqPay payment processing, subscription tiers (Free, Pro, Premium), and Redis-backed AI usage guards.
- **Production Infrastructure**: Single-entry reverse proxy via Caddy, automated SSL/TLS termination, centralized CORS handling, and multi-stage Docker builds.

---

## Quick Start (Docker Compose)

The entire platform (Caddy, Nuxt 4 frontend, NestJS API, PostgreSQL with pgvector, and Redis) can be launched using Docker Compose.

### 1. Prerequisites
- [Docker Engine](https://docs.docker.com/engine/install/) `24+` and Docker Compose `v2+`
- Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))
- Cloudinary Account (for media uploads)

### 2. Configure Environment Files
Copy the production environment templates:

```bash
# Root environment
cp .env.prod.example .env.prod

# Backend API environment
cp api/.env.prod.example api/.env.prod

# Frontend Client environment
cp client/.env.prod.example client/.env.prod
```

Edit `api/.env.prod` to provide your `GEMINI_API_KEY`, `CLOUDINARY_*`, and `JWT_*` secrets.

### 3. Build and Start Services
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. Apply Database Migrations
```bash
docker compose -f docker-compose.prod.yml exec api npm run migration:run:prod
```

### 5. (Optional) Seed Recipe Dataset
1. Download `smak-dataset.zip` from the latest [GitHub Release](https://github.com/alukiank/smak-culinary-platform/releases).
2. Unpack it into the root `dataset/` directory.
3. Run the interactive importer:
```bash
docker compose -f docker-compose.prod.yml exec api npm run import:dataset
```

The application will be live at `http://localhost` (or your configured domain via Caddy).

---

## Local Development

To run services independently on your local machine:

### Backend API
```bash
cd api
npm install
npm run migration:run
npm run start:dev
```
*API will run on `http://localhost:4000` (Swagger UI at `/admin/api-docs`).*

### Frontend Client
```bash
cd client
npm install
npm run dev
```
*Frontend will run on `http://localhost:3000`.*

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Nuxt 4, Vue 3, TypeScript, `@nuxt/ui` v4, Tailwind CSS, Lucide Icons, Vite |
| **Backend** | NestJS 10, TypeScript, TypeORM, Passport.js, Class-Validator, Swagger / OpenAPI |
| **AI & Search** | Google GenAI SDK (`gemini-3.1-flash-lite`, `gemini-embedding-001`), PostgreSQL `pgvector` |
| **Data & Queues** | PostgreSQL 16, Redis 7, BullMQ, Bull-Board |
| **Third-Party APIs**| Cloudinary CDN (media), LiqPay (payments), Nodemailer / Mailtrap (email) |
| **Infra & DevOps** | Docker, Docker Compose, Caddy Reverse Proxy |

---

## Documentation Links

- [Backend API Deep Dive (`api/README.md`)](api/README.md)
- [Frontend Client Deep Dive (`client/README.md`)](client/README.md)
- [Image & Asset Attributions](client/public/images/ATTRIBUTIONS.md)

---

## License

This project is licensed under the [MIT License](LICENSE).  
Author: **Andrii Lukianenko** (<a.lukiank@gmail.com>)
