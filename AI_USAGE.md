# AI usage

> ✏️ **Draft prepared with the AI from the session record. TODO (me): rewrite in my own words, check every claim, fill in the time section, then delete this note.**

## Tools & models

| Tool | Used for |
|---|---|
| **Claude Code** (CLI), model **Claude Opus 5.5** | Reading the brief, planning, scaffolding, implementation, tests, running the stack, visual review, and drafting the docs |
| _TODO: any other tools (e.g. ChatGPT, Copilot), or delete this row_ | |

## How I worked with it

I treated the AI as a fast pair programmer, and I made the decisions. The loop for each step was:

1. **Plan first.** I had the AI analyse the brief and propose a plan. Then I challenged it (DB or not, architecture) before any code was written.
2. **Small steps, each one verified.** Scaffold → catalogue → enquiry → UI → docs. Each step ended with lint, typecheck and tests, plus a live run, before I committed.
3. **Evidence over trust.** For every step I required proof beyond "tests pass": a live call to the real Fake Store API, an end-to-end run through Docker and Mailpit, **mutation checks** (breaking the code on purpose to prove the tests catch it), and **screenshots of the real UI** in headless Chrome at desktop and mobile sizes.
4. **Commits** on a feature branch, as small conventional commits explaining *why*. Reviewing the diff before each commit.

## Agent instruction files

- [`CLAUDE.md`](./CLAUDE.md): architecture rules (feature modules, ports and adapters, module boundaries, composition root), conventions (zod at boundaries, error shape, no secrets) and the "run lint, typecheck and tests before finishing" rule. I wrote it at the start so every later step followed the same rules.

## Plan / spec

- [`docs/PLAN.md`](./docs/PLAN.md): stack, module and endpoint map, and the step order. Agreed before implementation started.
- _Optional: full session transcript exported with `/export` → `docs/ai-session-transcript.md`_

## Key prompts and moments that shaped the solution

1. **Analyse the brief, produce a plan.** _"go through this and let me know everything: plan, project name, process, git, deployment…"_
   The AI pointed out that the brief scores **judgement**, not features, and that there's a live follow-up where I'd change the code. That set the approach: small, explainable, every decision written down.

2. **I questioned the database.** _"what about db? we don't need that?"_
   This led to a deliberate **no-DB decision**: no criterion needs persistence. We named the real risk (an enquiry can be lost if email fails) and handled it by returning `503` so the UI never shows a false "Thank you". Persisting enquiries became the first "next" item, not a hidden gap. → DECISIONS.md D1, A7.

3. **I set the backend architecture.** _"backend: let's have it as modules, each one feature based, that can be used as microservices"_
   The AI pushed back on *actual* microservices for a 5-page PoC and proposed a **modular monolith**: feature modules, ports and adapters, and enquiry reaching catalogue through its own `ProductLookup` port, so a module can be split into a service by swapping one adapter. I agreed, and asked for the boundary to be **enforced by an ESLint rule** rather than just documented.

4. **Tests from the first commit.** _"what about testing, we have to include that"_
   Test tooling and the first tests went in with the scaffold, before any features. Later, UI tests were written as the five acceptance criteria (GIVEN/WHEN/THEN) driving the real router and API client.

5. **UI quality bar.** _"the UI should be so good, clean, neat and user friendly"_
   Beyond writing the components, I had the AI **look at the running app** (headless Chrome screenshots, desktop and mobile). That found three layout bugs the unit tests couldn't (see below).

6. **Second UI pass.** _"put a logo instead of S, search should be working, add light and dark theme, forms should be clean, show the email option here itself so reviewers can open and view it"_
   I checked search in a real browser first (it worked; the real gap was no way to clear the box, plus no feedback while typing). That led to live suggestions with keyboard support and a clear button. The email request became a **demo-only, config-gated** deep link to the exact email in Mailpit, which helps reviewers without leaking into production builds.

## Where the AI got things wrong, and how they were caught

| # | What the AI got wrong | How it was caught | Fix |
|---|---|---|---|
| 1 | The **module-boundary lint rule** it wrote flagged legitimate imports *inside* a module (`adapters/`, `__tests__/` importing `../ports.js`). The regex assumed every file sits at the module root. | `npm run lint` failed when the first adapter tests were added. | Depth-aware patterns, then **tested the rule itself** with deliberate violations at both depths. Separate commit `7cbca40`. |
| 2 | `vite.config.ts` used `process` without Node types. | **Typecheck** failed even though the UI tests had passed (and the Docker build would have failed). | Added `@types/node` to the UI tsconfig. |
| 3 | **Malformed JSON or oversized requests returned 500** instead of 400 or 413. The error handler only knew about our own `AppError`. | Writing the enquiry route tests. | Body-parser errors mapped to `INVALID_JSON` / `PAYLOAD_TOO_LARGE`. Separate commit `11a14e2`. |
| 4 | **Validation errors exposed zod's internal fields** (`origin`, `inclusive`, …) to API clients, tying the contract to the library. | Reading the **live API output**, not just the test results. | Reduced to `{ field, message }`, with a test. |
| 5 | **Mobile layout:** the Search button ran off the screen at 390px. **Uneven card heights** with tall images. **Broken-image icons** when an image failed to load. | **Screenshots of the real UI** in headless Chrome. The unit tests were green for all three. | Measured the layout instead of guessing: the cause was flexbox `min-width: auto` (the input's default ~20-character width). Fixed with `min-width: 0`; cards with `overflow: hidden` (CSS `aspect-ratio` only holds when content is clipped); images with a `ProductImage` placeholder component and a test. |
| 6 | The AI's own **screenshot script clicked the header's Search button** instead of the enquiry form's submit, which looked like the enquiry flow was broken. | Debugged *before* changing app code: logged the network requests and saw that no enquiry request had been sent. | Fixed the script's selector. The app was fine. Lesson: verify the verifier. |
| 8 | After the redesign, **the 5 top-rated picks wrapped as 4 + 1**, leaving one orphan card. | Screenshot review of the redesigned home page in both themes. | Changed the grid column minimum, then **measured** rows at 1440, 1280 and 1024px instead of eyeballing. |
| 7 | The UI CSS had **5 hard-coded colours**, breaking the rule in our own `CLAUDE.md` ("no hard-coded colours"). | Checking the code against `CLAUDE.md` before the docs commit: `grep` for hex/rgb values outside `tokens.css`. | Moved them into design tokens. Lesson: instruction files guide the AI but don't guarantee compliance, so check against them. |

**One the AI got right because it checked instead of assuming:** before writing the Fake Store adapter it called the live API and found that **unknown IDs return `200` with an empty body**, not `404`. A naive adapter would crash on that. It's handled and has a test.

**How I made sure the tests actually test something:** I broke the code on purpose and checked the right tests failed: search changed from AND to OR (1 test failed), HTML escaping removed (1 failed), email-failure handling swallowed (2 failed), "Thank you" shown on failure (2 UI tests failed). Restoring the code brought everything back to green.

## Time spent

> TODO (me): replace with my actual numbers.

| Phase | Time |
|---|---|
| Reading the brief and planning (incl. challenging the plan with the AI) | _TODO_ |
| Building (scaffold, API modules, UI) | _TODO_ |
| Testing and verification (live checks, Docker E2E, mutation checks, visual review) | _TODO_ |
| Reviewing code and writing docs | _TODO_ |
| **Total** | **_TODO_** (time-box was 2–3 h) |
