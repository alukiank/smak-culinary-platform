# SMAK — Frontend Client

This directory contains the frontend web application for the SMAK culinary platform. It is built with Nuxt 4 and Vue 3, delivering a modern, responsive user experience with hybrid SSR/CSR rendering, real-time AI assistant chat with streaming responses, and an intuitive recipe management interface.

## Service Overview

The frontend client provides the following core capabilities:

- **AI Chat & Culinary Assistant**: Real-time conversational interface with Google Gemini, featuring Server-Sent Events (SSE) streaming, dynamic recipe cards, and a context-aware floating AI assistant on recipe pages.
- **Hybrid Rendering (SSR + CSR)**: Server-Side Rendering for public recipe catalog pages to optimize SEO and initial load times, paired with Client-Side Rendering for authenticated dashboards, chats, and administrative tools.
- **Recipe Discovery & Filtering**: Faceted search interface supporting semantic queries, dietary filters (vegan, vegetarian, gluten-free, dairy-free), cuisine tags, cooking speeds, and healthiness metrics.
- **Interactive Recipe Experience**: Comprehensive dish view with structured ingredients checklists, step-by-step cooking directions, YouTube video embeds, nutritional passports, and community reviews.
- **Cookbook Collections & Social Features**: Custom user recipe collections, star ratings, and community reviews with threaded comments.
- **Subscription & Billing**: Plan comparison matrix, upgrade workflows, and embedded LiqPay payment widget integration.
- **Admin & Moderation Dashboard**: Comprehensive management interface for reviewing flagged recipes, inspecting user restrictions, and monitoring billing logs.

### Related Documentation
- [Project Overview & Docker Setup](../README.md)
- [Backend API Documentation](../api/README.md)

---

## Table of Contents
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Directory Structure](#directory-structure)
- [Engineering Highlights](#engineering-highlights)
- [Rendering Strategy (SSR vs CSR)](#rendering-strategy-ssr-vs-csr)
- [AI Chat & Streaming Architecture](#ai-chat--streaming-architecture)
- [Environment Configuration](#environment-configuration)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [License](#license)

---

## Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      Nuxt 4 / Vue 3                         │
├──────────────────────────────┬──────────────────────────────┤
│  Public Pages (SSR Enabled)  │  Auth & Dynamic Pages (CSR)  │
│  - Landing (/)               │  - AI Chat (/chats)          │
│  - Catalog (/recipes)        │  - Profile (/profile)        │
│  - Recipe Detail (/:id)      │  - Billing (/billing)        │
│  - Public Profiles           │  - Admin Panel (/admin)      │
├──────────────────────────────┴──────────────────────────────┤
│  State & Logic: Vue 3 Composables (useChat, useRecipes)     │
│  UI Framework: @nuxt/ui v4 + Tailwind CSS + Lucide Icons    │
│  Communication: $fetch API Plugin + SSE Stream Parser       │
└─────────────────────────────────────────────────────────────┘
```

- **Framework**: [Nuxt 4](https://nuxt.com/) (Vue 3 Composition API, Vite engine)
- **UI & Design System**: [@nuxt/ui](https://ui.nuxt.com/) v4, Tailwind CSS, custom color palette
- **Icons**: [@iconify-json/lucide](https://lucide.dev/)
- **Streaming & SSE**: `@microsoft/fetch-event-source`, custom SSE parser (`utils/sse-parser.ts`)
- **Markdown Rendering**: `markdown-it`, `marked` (with syntax highlighting and link sanitization)
- **Image Delivery**: Cloudinary Vue integration with auto-format and responsive quality

---

## Directory Structure

The application source code is structured within `app/`:

```
client/
├── app/
│   ├── assets/              # Global styles and Tailwind design tokens (main.css)
│   ├── components/          # Reusable Vue components
│   │   ├── admin/           # Moderation modals and action timelines
│   │   ├── chat/            # Chat bubbles, recipe sliders, typing indicators
│   │   ├── landing/         # Interactive landing page simulator components
│   │   ├── profile/         # Dietary preference and allergy selectors
│   │   ├── recipe/          # Recipe cards, hero sections, filter panels, review lists, AI FAB
│   │   └── shared/          # Generic modals, search inputs, pagination, uploaders
│   ├── composables/         # Modular state management functions
│   │   ├── useAuth.ts       # Authentication state, login/register, session check
│   │   ├── useBilling.ts    # Subscription tiers, quota checks, LiqPay widget
│   │   ├── useChat.ts       # Chat sessions, streaming message dispatch, tool events
│   │   ├── useCollections.ts# User cookbook collections
│   │   └── useRecipes.ts    # Recipe catalog search, filtering, CRUD operations
│   ├── layouts/             # Page layouts (default, auth, chat, profile, admin)
│   ├── middleware/          # Route guards (auth, admin, verified, owner)
│   ├── pages/               # File-based routing
│   │   ├── admin/           # Moderation, user management, and billing dashboards
│   │   ├── auth/            # Login, registration, email verify, password reset
│   │   ├── billing/         # Subscription plan selection and checkout
│   │   ├── chats/           # AI conversational assistant
│   │   ├── profile/         # User cookbook, recipes, and dietary settings
│   │   ├── recipes/         # Catalog, recipe details, recipe editor
│   │   └── index.vue        # Public landing page
│   ├── plugins/             # Nuxt plugins (01.api.ts HTTP client with token refresh)
│   ├── types/               # TypeScript interface and type declarations
│   └── utils/               # SSE parser, formatting utilities, culinary prompt presets
├── public/                  # Static assets, branding images, site documentation
├── scripts/                 # Build-time utilities (sitemap and site docs generator)
├── nuxt.config.ts           # Nuxt configuration, route rules, runtime config
└── package.json
```

---

## Engineering Highlights

### 1. Unified HTTP Client with Automatic Token Refresh
The custom API plugin ([`app/plugins/01.api.ts`](app/plugins/01.api.ts)) instantiates a tailored `$fetch` wrapper:
- **Base URL Resolution**: Automatically chooses between browser-facing `NUXT_PUBLIC_API_URL` and internal container network `NUXT_API_URL_INTERNAL` during SSR.
- **HttpOnly Cookie Forwarding**: Seamlessly relays authentication cookies between client, SSR server, and backend.
- **Silent 401 Interception**: Intercepts expired session errors, triggers a token refresh request, and retries the failed call without disrupting the user.

### 2. Live SSE Parser for AI Tool-Use Streaming
The conversational interface uses an event-driven parser ([`app/utils/sse-parser.ts`](app/utils/sse-parser.ts)) to handle Server-Sent Events from the NestJS assistant:
- **Incremental Text Streaming**: Emits token deltas for typewriter-style rendering.
- **Dynamic UI Card Injection**: Detects `metadata` events from Gemini function calls (`display_recipes`, `display_user_diets`) and embeds interactive Vue components (`ChatRecipeCard`, `ChatRecipeSlider`) inline within the message flow.

### 3. In-Context Recipe AI Assistant
Each recipe detail page integrates an intelligent culinary assistant ([`RecipeAiChatFab.vue`](app/components/recipe/detail/RecipeAiChatFab.vue)):
- **Context-Aware Assistance**: Automatically receives current recipe ingredients and steps as prompt context.
- **Instant Culinary Guidance**: Provides real-time answers for ingredient substitutions, measurement adjustments, and technique advice directly on the recipe view.

---

## Rendering Strategy (SSR vs CSR)

To balance search engine visibility with reactive application performance, route rendering is configured via `routeRules` in `nuxt.config.ts`:

| Route Pattern | Mode | Rationale |
|---|---|---|
| `/` | **SSR** | Fast first-contentful paint and open-graph indexing for the landing page. |
| `/recipes/**` | **SSR** | Indexable recipe catalog with rich structured data for SEO. |
| `/users/**` | **SSR** | Public creator profiles accessible to crawlers. |
| `/chats/**` | **CSR** (`ssr: false`) | Real-time WebSocket/SSE state requiring client-only execution. |
| `/profile/**` | **CSR** (`ssr: false`) | Private, user-specific data behind authentication. |
| `/billing/**` | **CSR** (`ssr: false`) | Interactive payment widgets and client-bound transaction state. |
| `/admin/**` | **CSR** (`ssr: false`) | Private administrative dashboard. |

---

## AI Chat & Streaming Architecture

```
User Message ──► useChat.ts ──► POST /chat/:id/messages (SSE)
                                          │
    ┌─────────────────────────────────────┴─────────────────────────────────────┐
    ▼                                                                           ▼
event: metadata                                                             event: chunk
data: { recipes: [...] }                                                    data: "To prepare..."
    │                                                                           │
    ▼                                                                           ▼
ChatMessageBubble.vue                                                       ChatMessageBubble.vue
(Renders interactive ChatRecipeSlider)                                      (Appends streamed Markdown text)
```

---

## Environment Configuration

Environment variables are managed via local `.env` files. Descriptions and defaults are documented in:

- [`.env.example`](.env.example) — Template for local frontend development.
- [`.env.prod.example`](.env.prod.example) — Template for containerized production deployment.

### Key Parameters

| Variable | Description |
|---|---|
| `NUXT_PUBLIC_API_URL` | Public backend endpoint accessible from the user's browser (e.g., `http://localhost:4000` or `https://api.yourdomain.com`). |
| `NUXT_API_URL_INTERNAL` | Internal backend endpoint for SSR requests inside Docker (e.g., `http://api:4000`). |
| `NUXT_PUBLIC_LIQPAY_PUBLIC_KEY` | Public key for initializing the client-side LiqPay payment widget. |
| `NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier used for CDN media rendering. |

---

## Getting Started

### Prerequisites
- Node.js `20.x` or `22.x`
- Running backend API instance (on port 4000 or configured in `.env`)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a local `.env` file based on [`.env.example`](.env.example):
```env
NUXT_PUBLIC_API_URL=http://localhost:4000
NUXT_API_URL_INTERNAL=http://localhost:4000
NUXT_PUBLIC_LIQPAY_PUBLIC_KEY=sandbox_your_public_key
NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### 3. Start Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Nuxt development server with hot-module replacement |
| `npm run build` | Builds the application for production deployment (`.output/`) |
| `npm run preview` | Locally previews the compiled production build |
| `npm run generate` | Pre-renders pages as a static HTML deployment |
| `npm run postinstall` | Prepares Nuxt TypeScript type definitions (`nuxt prepare`) |

---

## License

This client application is open-sourced under the [MIT License](../LICENSE).  
Author: **Andrii Lukianenko** (<a.lukiank@gmail.com>)
