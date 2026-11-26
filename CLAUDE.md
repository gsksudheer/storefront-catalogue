# Agent instructions (storefront-catalogue)

Product catalogue PoC: React + TS UI (`ui/`), Node + TS + Express API (`api/`).
It is a foundation that will keep growing, so keep boundaries clean and code simple.

## Architecture rules
- API is a **modular monolith**: feature modules in `api/src/modules/<feature>/`.
  - A module exposes only `index.ts` (a `createXModule(deps)` factory + public types).
  - Never import another module's internals; ESLint `no-restricted-imports` enforces this.
  - Cross-module needs are expressed as a **port** (interface) in the consuming module
    and wired in `api/src/server.ts` (the composition root).
  - External systems (Fake Store, SMTP) live behind ports in `adapters/`. Services never
    import an adapter directly.
- `api/src/shared/` is infrastructure only (config, errors, logger, middleware), with no business logic.
- The UI never calls Fake Store; all data goes through `/api`.
- UI styling uses CSS variables from `ui/src/theme/tokens.css`; no hard-coded colours.

## Conventions
- TypeScript strict. Validate all external input with zod at the edge (routes, env, upstream responses).
- Errors: throw `AppError` (shared/errors.ts); the error middleware formats the JSON shape
  `{ error: { code, message, details? } }`.
- Never commit secrets; add new config to `.env.example` and `shared/config.ts`.
- Tests sit next to code (`*.test.ts`) or in `__tests__/`. Services are tested with in-memory
  fakes of their ports; routes with supertest against `createApp`.
- Before finishing any change, run `npm run lint && npm run typecheck && npm test` in each touched project.
- Keep changes small and focused; don't add dependencies without saying why.
