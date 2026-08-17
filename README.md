<div align="center">
  <img src="client/public/images/logo.png" width="100" alt="SMAK Logo" />
  <h1>SMAK</h1>
  <p><b>AI-powered culinary platform with semantic recipe discovery and real-time conversational sous-chef.</b></p>

  <p>
    <a href="https://github.com/alukiank/smak-culinary-platform/releases"><img src="https://img.shields.io/badge/Release-v1.0.0-brightgreen" alt="Release v1.0.0"></a>
    <img src="https://img.shields.io/badge/Frontend-Nuxt_4_%7C_Vue_3-00DC82?logo=nuxt.js&logoColor=white" alt="Nuxt 4">
    <img src="https://img.shields.io/badge/Backend-NestJS_10-E0234E?logo=nestjs&logoColor=white" alt="NestJS">
    <img src="https://img.shields.io/badge/Database-PostgreSQL_%7C_pgvector-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
    <img src="https://img.shields.io/badge/AI-Google_Gemini-8E75B2?logo=google&logoColor=white" alt="Google Gemini">
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue" alt="License: MIT"></a>
  </p>

  <p>
    <b>Language / Мова:</b> &nbsp;
    <b>[English 🇬🇧]</b> &nbsp;|&nbsp;
    <a href="README.uk.md">Українська 🇺🇦</a>
  </p>

  <p align="center">
    <img src="docs/smak-banner.png" width="900" alt="SMAK Platform Banner" />
  </p>

  <p>
    SMAK is an intelligent culinary platform designed to transform everyday cooking into an effortless, personalized experience. Powered by an AI sous-chef that understands dietary preferences, pantry ingredients, and culinary techniques, SMAK helps home cooks discover inspired recipes, adapt meals on the fly, and cook with confidence.
  </p>

</div>

<details>
<summary><b>Table of Contents</b></summary>

- [Overview & Value Proposition](#overview--value-proposition)
- [Product Showcase](#product-showcase)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Monorepo Structure](#monorepo-structure)
- [Quick Start (Docker Compose)](#quick-start-docker-compose)
- [Local Development](#local-development)
- [Technology Stack](#technology-stack)
- [License & Attributions](#license--attributions)

</details>

## Overview & Value Proposition

Traditional recipe websites are cluttered with ads, rigid search forms, and static step lists that cannot adapt to missing ingredients or dietary restrictions. 

**SMAK solves this by combining modern web architecture with agentic AI:**

- **Semantic Discovery:** Find recipes by mood, available ingredients, or dietary preferences without requiring exact keyword matches.
- **Real-Time AI Guidance:** An interactive sous-chef assists with ingredient substitutions, cooking times, and culinary techniques during meal preparation.
- **Automated Quality & Safety:** User-submitted recipes and reviews pass through automated AI moderation queues to keep catalog content reliable and safe.

## Product Showcase

<!-- Replace the video/GIF placeholders below with your actual demo recordings -->

### 1. Recipe Catalog, Semantic Search & Advanced Filtering
Interactive recipe feed with comprehensive faceted filtering, natural language search, and responsive grid exploration.

<!-- Demo Video / GIF: Recipe catalog, filters, and feed navigation -->
<!-- <video src="https://your-domain.com/videos/recipe-catalog-demo.mp4" controls width="100%"></video> -->
> *Demonstrates live recipe browsing, sliding filter panel interactions, multi-diet toggles, and instant catalog updates.*

**Core Page Capabilities:**
- **Faceted Dietary & Allergen Switches:** One-click toggles for Vegan, Vegetarian, Gluten-Free, Lactose-Free, Nut-Free, Halal, and Kosher diets with automated profile synchronization.
- **Granular Culinary Parameters:** Filter by dish category, world cuisines (multi-select), cooking difficulty (Easy, Medium, Hard), cooking speeds (Fast, Medium, Slow), and minimum review ratings (3+, 4+, 4.5+).
- **Interactive Slider Controls:** Reactive range sliders for maximum cooking time (5 to 180+ min) and minimum healthiness index (0 to 100%).
- **Hybrid Semantic Search:** Real-time query input combining natural language understanding via vector embeddings (`pgvector`) with relational SQL constraints.
- **Active Filter Pills & Reset:** Visual badge indicators showing all applied criteria with instant one-click removal and full catalog reset.
- **Dynamic Catalog Grid & Pagination:** Smooth responsive recipe cards featuring cook time, difficulty badges, health scores, community ratings, and server-side pagination with item count indicators.

### 2. Conversational AI Sous-Chef & Live Tool Execution
Real-time conversational culinary assistant powered by Google Gemini (`gemini-3.1-flash-lite`), executing multi-turn tool calls and streaming responses via Server-Sent Events (SSE).

<!-- Demo Video / GIF: Conversational AI assistant and live tool execution -->
<!-- <video src="https://your-domain.com/videos/ai-assistant-demo.mp4" controls width="100%"></video> -->
> *The AI assistant processes complex queries in natural Ukrainian, handles dietary exclusions (e.g., "що приготувати без лактози на вечерю"), calls backend database tools, and streams response tokens alongside interactive recipe sliders.*

**Key AI Capabilities:**
- **Natural Language & Context Understanding:** Full support for Ukrainian natural language prompts, dietary nuances, mood-based requests, and conversational multi-turn dialogues.
- **Multi-Turn Tool Calling:** Autonomous execution of backend tools (`search_recipes`, `get_recipe_details`) across multiple reasoning loops to retrieve accurate database recipes.
- **Dynamic UI Card & Slider Injection:** Emits SSE metadata events to inject interactive `ChatRecipeSlider` components, recipe cards, and action buttons directly into the message feed.
- **In-Context Recipe Guidance (Floating Assistant):** Ingests full dish metadata (ingredients, quantities, cooking steps) on recipe detail pages to advise on ingredient substitutions, measurement conversions, and culinary techniques in real time.
- **Automated Dietary & Allergen Safeguards:** Respects user allergen profiles and nutritional requirements (`display_user_diets`, `display_user_allergies`) to guarantee safe recommendations.
- **Platform Navigation & Knowledge:** Guides users through platform features, settings, and workflows via `get_site_documentation`.

### 3. Subscription Plans & Transparent Pricing
Tiered monetization model with feature matrices, AI request quotas, and secure LiqPay payment processing.

<p align="center">
  <img src="docs/tarrifs.png" width="900" alt="SMAK Subscription Tiers and Pricing" />
</p>

**Subscription Tiers Overview:**
- **Automated Billing & Quota Guard:** Embedded LiqPay checkout widget, subscription status tracking, automated renewal schedules, and Redis-backed rate limiting.

## Key Features

- **AI Culinary Assistant**: Conversational assistant powered by Google Gemini (`gemini-3.1-flash-lite`) supporting multi-turn tool calling (recipe searching, dietary constraints) and live Server-Sent Events (SSE) streaming with interactive UI card injection.
- **Hybrid Semantic Search**: Combines PostgreSQL relational filtering (allergens, vegan/vegetarian flags, cooking duration, difficulty) with 768-dimensional vector cosine similarity via `pgvector` and Gemini embeddings.
- **In-Context Recipe Guidance**: Recipe view with ingredient checklists, step-by-step directions, and an integrated floating AI assistant for instant culinary substitutions and advice.
- **Automated Content Moderation**: Asynchronous BullMQ queue worker evaluating submitted recipes and reviews against safety policies via structured Gemini prompts.
- **Subscription Billing**: Monetization pipeline with LiqPay payment processing, subscription tiers (Free, Pro, Premium), and Redis-backed AI usage guards.
- **Production Infrastructure**: Single-entry reverse proxy via Caddy, automated SSL/TLS termination, centralized CORS handling, and multi-stage Docker builds.

## System Architecture

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

## Monorepo Structure

- [**`api/`**](api/README.md) — NestJS 10 backend service handling business logic, vector search, Gemini AI orchestration, and BullMQ background workers.
- [**`client/`**](client/README.md) — Nuxt 4 / Vue 3 frontend application featuring hybrid SSR/CSR, `@nuxt/ui` design system, and live AI chat streaming.
- [**`dataset/`**](https://github.com/alukiank/smak-culinary-platform/releases) — Structured recipe dataset and media assets (hosted via GitHub Releases).

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

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Nuxt 4, Vue 3, TypeScript, `@nuxt/ui` v4, Tailwind CSS, Lucide Icons, Vite |
| **Backend** | NestJS 10, TypeScript, TypeORM, Passport.js, Class-Validator, Swagger / OpenAPI |
| **AI & Search** | Google GenAI SDK (`gemini-3.1-flash-lite`, `gemini-embedding-001`), PostgreSQL `pgvector` |
| **Data & Queues** | PostgreSQL 16, Redis 7, BullMQ, Bull-Board |
| **Third-Party APIs**| Cloudinary CDN (media), LiqPay (payments), Nodemailer / Mailtrap (email) |
| **Infra & DevOps** | Docker, Docker Compose, Caddy Reverse Proxy |

## License & Attributions

- **License**: Open-sourced under the [MIT License](LICENSE).
- **Author**: [Andrii Lukianenko](mailto:a.lukiank@gmail.com)
- **Asset Attributions**: Detailed media origin documentation in [ATTRIBUTIONS.md](client/public/images/ATTRIBUTIONS.md).
