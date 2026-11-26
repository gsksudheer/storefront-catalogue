# Plan

## Stack
- UI: React + TypeScript (Vite, React Router), Vitest + Testing Library
- API: Node + TypeScript (Express 5, zod, nodemailer, pino), Vitest + Supertest
- Local email: Mailpit (no account, inbox UI on :8025)
- Run: `docker compose up --build`; CI: GitHub Actions (lint, typecheck, test, docker build)

## API (modular monolith)
| Module | Endpoints | Ports |
|---|---|---|
| catalogue | `GET /api/catalogue/featured`, `/categories`, `/categories/:name`, `/products?q=`, `/products/:id` | `ProductSource`, `FeaturedProvider` |
| enquiry | `POST /api/enquiries` | `Mailer`, `ProductLookup` |

## Steps
1. Scaffold: structure, tooling, tests, Docker, CI ✅
2. Catalogue: FakeStore adapter (+ TTL cache, response validation), featured provider, service, routes, tests
3. Enquiry: schema, service, SMTP mailer, rate limit + honeypot, routes, tests
4. UI: layout (search + categories), home, category, search, product, enquiry form, tests
5. Docs: README, DECISIONS.md, AI_USAGE.md, time spent; open PR
6. Bonus: deploy to a small AWS instance
