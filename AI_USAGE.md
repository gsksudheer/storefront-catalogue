# AI usage

## Tools and models

I used one tool for this challenge: **Claude Code** (the command-line agent), with the **Claude Opus 5.5** model.

I used it for reading the brief, planning, writing code and tests, running the app, checking the UI in a headless browser, and drafting the docs. I reviewed everything it produced before committing, and I rewrote the docs in my own words.

## How I worked with the AI

I treated the AI like a fast pair programmer. It typed most of the code. I made the decisions and checked the results.

My loop for each step:

1. **Plan before code.** I asked for a plan first, then pushed back on parts of it (the database, the backend structure) before any code was written.
2. **Small steps.** Scaffold, then catalogue API, then enquiry API, then UI, then docs. Every step ended with lint, typecheck and tests, and a commit.
3. **Don't trust "tests pass".** For each step I wanted extra proof:
   - calls to the real Fake Store API, not just mocks
   - a full run through Docker, checking that the email really arrived in Mailpit
   - breaking the code on purpose to make sure the tests fail (mutation checks)
   - screenshots of the real UI, desktop and mobile, light and dark
4. **Read the diff before every commit.** I used small commits with clear messages so the history is easy to follow.

## Agent instruction file

- [`CLAUDE.md`](./CLAUDE.md) holds the rules I wanted the AI to follow every time: feature modules, ports and adapters, no imports across module internals, zod validation at the edges, one error format, design tokens only, no secrets, and "run lint, typecheck and tests before you finish". I wrote it at the start so later steps stayed consistent.

## Plan

- [`docs/PLAN.md`](./docs/PLAN.md): the stack, the modules and endpoints, and the order of the work. We agreed on it before building.

## Key prompts and moments

**1. Understanding the brief**

> "go through this and let me know everything: plan, project name, process, git, deployment"

The useful thing here was the AI pointing out that the brief scores **judgement**, not number of features, and that there's a live session where I'd have to change the code. So I aimed for something small and explainable, with every decision written down.

**2. Questioning the database**

> "what about db? we don't need that?"

We decided not to use a database, because none of the acceptance criteria need one. We were honest about the risk: if email is down, an enquiry could be lost. So the API returns an error and the UI never shows "Thank you" unless the email was really sent. Saving enquiries is the first item in "next steps". (DECISIONS.md D1 and A7.)

**3. Choosing the backend structure**

> "backend: let's have it as modules, each one feature based, that can be used as microservices"

This was my idea. The AI advised against real microservices for a 5-page PoC and suggested a **modular monolith** instead: one deployable app, split into feature modules with clear interfaces. The enquiry module talks to the catalogue module through its own small interface, so it could become a separate service later by swapping one adapter. I agreed, and asked for the module boundaries to be **enforced by a lint rule**, not just written in a doc.

**4. Tests from day one**

> "what about testing, we have to include that"

Testing tools and the first tests went in with the very first scaffold, before any features. The UI tests follow the five acceptance criteria (GIVEN / WHEN / THEN) and run the real router and API client. Only the network is mocked.

**5. Raising the UI quality bar**

> "the UI should be so good, clean, neat and user friendly"

Writing components wasn't enough, so I had the AI open the running app in headless Chrome and take screenshots. That found layout bugs the unit tests couldn't see (see the table below).

**6. Second UI pass**

> "put a logo instead of S, search should be working, add light and dark theme, forms should be clean, show the email option here itself so reviewers can open and view it"

Before changing anything, I checked search in a real browser. It worked. The real problems were that there was no way to clear the box and nothing happened while typing. So we added live suggestions, keyboard support and a clear button. For the email, we added a link that opens **the exact email** in Mailpit. It only shows when a demo setting is on, so a production build never links to an internal inbox.

## Where the AI got things wrong, and how I caught it

| # | What went wrong | How I caught it | How it was fixed |
|---|---|---|---|
| 1 | The lint rule for module boundaries was wrong. It blocked normal imports *inside* a module, because it assumed every file sits at the top of its module folder. | Lint failed as soon as the first adapter tests were added. | Rewrote the rule to depend on how deep the importing file is, then tested the rule itself with deliberate bad imports. (Commit `7cbca40`.) |
| 2 | `vite.config.ts` used `process` without Node types. | Typecheck failed, even though the UI tests passed. The Docker build would have failed too. | Added Node types to the UI config. |
| 3 | A request with broken JSON or a huge body returned **500** instead of 400 or 413. | Writing the enquiry tests. | The error handler now returns clear 400 and 413 errors. (Commit `11a14e2`.) |
| 4 | Validation errors exposed internal fields from the zod library to API users. | Reading the real API output, not just the test results. | Errors are now just `{ field, message }`, with a test. |
| 5 | On mobile, the Search button was pushed off the screen. Card heights didn't line up with tall images. Broken images showed the browser's broken-image icon. | Screenshots of the real UI. All unit tests were green. | Measured the layout instead of guessing. The cause was the search input's default width stopping the form from shrinking; one CSS line fixed it. Also fixed the card image box, and added a clean "Image unavailable" placeholder with a test. |
| 6 | The AI's own screenshot script clicked the header's Search button instead of the form's Submit button, so it looked like the enquiry form was broken. | I checked the network requests before touching the app and saw no enquiry had been sent. | Fixed the script. The app was fine. Lesson: check the checker too. |
| 7 | The CSS had 5 hard-coded colours, breaking our own rule in `CLAUDE.md`. | I compared the code against `CLAUDE.md` before committing the docs (a quick search for colour values outside the tokens file). | Moved them into design tokens. An instruction file guides the AI, but you still have to check it was followed. |
| 8 | After the redesign, the 5 top-rated products showed as 4 + 1, with one card alone on a second row. | Screenshot review of the new home page. | Changed the grid, then measured the rows at three screen widths instead of eyeballing it. |

**Something the AI got right because it checked first:** before writing the Fake Store code, it called the real API and found that an unknown product ID returns **200 with an empty body**, not 404. Code written from assumptions would have crashed on that. It's handled and tested.

**Making sure the tests are real:** I broke the code on purpose and checked that the right tests failed:

- search changed from "all words" to "any word" → 1 test failed
- HTML escaping removed from the email → 1 test failed
- email errors silently ignored → 2 tests failed
- "Thank you" shown even when sending failed → 2 UI tests failed

Then I restored the code and everything went green again.

## Time spent

I worked in two sessions on the same day. These times come from my commit history.

| Phase | Time |
|---|---|
| Planning: reading the brief, agreeing the plan, the database and architecture decisions | 20 min |
| Building the critical path: scaffold, catalogue API, enquiry API, first UI | 45 min |
| Testing and checks: live API checks, Docker and email end to end, mutation checks, screenshot review | 25 min |
| Docs: README, DECISIONS.md, this file | 25 min |
| UI polish (after the critical path): logo, light/dark theme, live search, enquiry side panel | 35 min |
| **Total** | **about 2 hours 30 minutes** |

All five acceptance criteria were working and tested about **1.5 hours** in. The UI polish came after that, as a deliberate extra so the client has something pleasant to click through in feedback sessions. It's in separate commits, so it's easy to review apart from the core work.
