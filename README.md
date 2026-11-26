# Storefront Catalogue

A product catalogue proof of concept. Customers browse and search products and send an enquiry, which is emailed to the sales inbox. It's built as a **foundation that can keep growing**: the product data source, the look and feel, and the email provider can each be swapped without rewriting the app.

- **UI:** React + TypeScript (Vite)
- **API:** Node.js + TypeScript (Express), a modular monolith
- **Local email:** [Mailpit](https://mailpit.axllent.org/) catches every email, so no account is needed

> Decisions and assumptions: [DECISIONS.md](./DECISIONS.md) · AI usage: [AI_USAGE.md](./AI_USAGE.md) · Plan: [docs/PLAN.md](./docs/PLAN.md)

---

## Run it (about 2 minutes)

**Requirements:** Docker with Docker Compose v2. Nothing else; no accounts or API keys.

```bash
git clone https://github.com/gsksudheer/storefront-catalogue.git
cd storefront-catalogue
docker compose up --build
```

| What | URL |
|---|---|
| **Storefront** | http://localhost:8080 |
| **Sales inbox** (Mailpit): enquiry emails land here | http://localhost:8025 |
| API health | http://localhost:4000/health |

**Try the whole journey:** open a product → **Enquire about this product** → submit → see the "Thank you" message → open http://localhost:8025 to see the email.

Configuration is optional. Sensible defaults are built in. To change anything (sales inbox address, rate limits, SMTP), run `cp .env.example .env` and edit it. Every setting is documented in [`.env.example`](./.env.example). Don't commit `.env`.

> Product data comes from the public [Fake Store API](https://fakestoreapi.com), so the API container needs internet access.

### Without Docker (for development)

Requires Node.js 20+.

```bash
docker compose up -d mailpit           # optional: only needed to send enquiries
(cd api && npm ci && npm run dev)      # http://localhost:4000
(cd ui  && npm ci && npm run dev)      # http://localhost:5173  (proxies /api to :4000)
```

### Tests and checks

```bash
cd api && npm test     # 71 tests: services, adapters, routes (Vitest + Supertest)
cd ui  && npm test     # 27 tests: acceptance criteria as user journeys (Vitest + Testing Library)
npm run lint && npm run typecheck   # in either project
```

CI (GitHub Actions) runs lint, typecheck and tests for both projects, then builds the Docker images.

---

## Stack choices and why

| Layer | Choice | Why |
|---|---|---|
| Client | **React + TypeScript** (Vite, React Router) | Preferred in the brief. A web app gives the reviewer the shortest setup (no simulator) and the entrepreneur a link they can share. |
| Backend | **Node.js + TypeScript** (Express 5, zod) | Preferred in the brief. One language end to end means one set of tooling and less context switching. zod validates every boundary (requests, env, upstream responses). |
| Email | **nodemailer over SMTP → Mailpit** | Free, no account needed (constraint 6), and the reviewer can see the email arrive. Production can use any SMTP provider, including Amazon SES, with env changes only. |
| Tests | Vitest, Supertest, Testing Library | Same runner on both sides, and fast. |
| Infra | Docker Compose; nginx serves the UI and proxies `/api` | One command to run. Each container is AWS-ready (ECS/Fargate, or a single EC2 instance). |

## Architecture

```
Browser ──► ui (nginx + React) ──/api──► api (Express)
                                          ├─ modules/catalogue ── ProductSource ──► FakeStoreProductSource (+ TTL cache) ──► Fake Store API
                                          │                    └─ FeaturedProvider ─► config/featured.json
                                          ├─ modules/enquiry ──── Mailer ─────────► SmtpMailer ──► Mailpit / any SMTP
                                          │                    └─ ProductLookup ───► catalogue (in-process)
                                          └─ shared/  (config, errors, logger, middleware: no business logic)
```

- **The browser never calls Fake Store.** All product data goes through `/api` (constraint 2). Product *images* still load from Fake Store's image URLs; see DECISIONS.md.
- **Feature modules with ports and adapters.** Each module exposes only `index.ts`. External systems sit behind interfaces (`ProductSource`, `FeaturedProvider`, `Mailer`), and `api/src/server.ts` is the only file that picks the concrete implementations.
- **Boundaries are enforced, not just agreed.** An ESLint rule fails the build if one module imports another module's internals.
- **Splittable.** Enquiry reaches catalogue through its own `ProductLookup` port. Moving enquiry into a separate service means replacing that one in-process adapter with an HTTP client.

### API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/catalogue/featured` | The 5 hand-picked "top rated" products |
| GET | `/api/catalogue/categories` | Category names |
| GET | `/api/catalogue/categories/:name` | `{ category, topRated, additional }` |
| GET | `/api/catalogue/products?q=term` | Search (1–100 chars) |
| GET | `/api/catalogue/products/:id` | Product details |
| POST | `/api/enquiries` | `{ productId, name, email, phone?, message? }` → `201 { reference }` |
| GET | `/health` | Liveness |

Errors always have the shape `{ "error": { "code", "message", "details?" } }`: `400 VALIDATION_ERROR` (with field details), `404 NOT_FOUND`, `429 RATE_LIMITED`, `502 UPSTREAM_UNAVAILABLE`, `503 ENQUIRY_NOT_SENT`.

### Choosing the "top rated" products

Edit [`api/config/featured.json`](./api/config/featured.json) (product IDs, in display order) and restart the API. In the PoC this file stands in for an admin screen.

## Project layout

```
api/src/modules/catalogue/   featured, categories, search, product details
api/src/modules/enquiry/     enquiry validation, email rendering, delivery
api/src/shared/              config (zod-validated env), errors, logger, middleware
ui/src/features/             catalogue pages, enquiry form
ui/src/components/           layout, product cards, states, breadcrumbs
ui/src/theme/tokens.css      design tokens: the creative team's look & feel goes here
CLAUDE.md                    instructions for AI coding agents working in this repo
```

## Security basics

Input validated with zod on every endpoint · helmet security headers · CORS restricted to one origin · 10kb body limit · enquiry rate limit per IP + honeypot · customer input HTML-escaped in emails, and the email subject contains no customer input · the product title comes from the catalogue, never from the client · the enquiry email address is validated (no CR/LF), so it can't inject headers through Reply-To · upstream calls time out · no stack traces in responses · no secrets in the repo (`.env.example` only) · containers run as a non-root user.

## Time spent

See [AI_USAGE.md](./AI_USAGE.md#time-spent).
