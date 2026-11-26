# Decisions & assumptions

The brief rewards judgement over feature count, so this file explains the calls I made and why.

## Assumptions (where the acceptance criteria left gaps)

| # | Criterion | Gap | Assumption |
|---|---|---|---|
| A1 | Home: *"I have chosen 5 products to be top rated"* | Chosen by whom, and how? | The **business owner hand-picks** them; they aren't computed from ratings. They live in `api/config/featured.json` (IDs in display order), behind a `FeaturedProvider` interface so an admin UI or CMS can replace the file later. IDs that no longer exist are skipped and logged, so the home page still loads. |
| A2 | Category: *"top rated products for that category"* | No rule given for which products count as "top rated" in a category | The owner's picks in that category come first, then the highest rated by Fake Store `rating.rate` (ties broken by review count) until there are **3**. Everything else in the category is "additional", with no duplicates. Trade-off: a pick with a low rating (e.g. #14, rated 2.2) appears above a 4.8 product. I chose this because the criteria say the owner *chose* them. If ratings should win instead, the change is one function in `catalogue.service.ts`. |
| A3 | Search: *"products that have text matching that search term"* | Which fields? Exact phrase or words? | Case-insensitive match on **title, description and category**. **Every word must match** (AND), so "mens cotton" finds "Mens Cotton Jacket". Search runs on submit (button click or Enter, as the criterion says); the term is kept in the URL (`/search?q=`) so results can be shared and bookmarked. Blank queries are rejected; the maximum length is 100. |
| A4 | Search runs on the server | Fake Store has no search endpoint | The API searches its cached copy of the catalogue. That's fine for 20 products; a real source would use its own search (DB full-text search, OpenSearch) behind the same `ProductSource` port. |
| A5 | Enquiry: *"complete the form with my contact details"* | Which fields? | **Name and email are required**, phone and message are optional. No account or login. The customer must be able to receive a reply, so email is the one contact detail that has to be there. |
| A6 | Enquiry: *"the sales inbox will receive an email"* | Which inbox? What goes in it? | Set with `SALES_INBOX_EMAIL`. The email contains the product (title and ID, looked up on the server), the customer's details, their message and a **reference**. `Reply-To` is set to the customer, so sales can just hit reply. |
| A7 | Enquiry: *"the customer will see a Thank you message"* | What if sending fails? | "Thank you" is shown **only after the email has actually been accepted** by the mail server. If sending fails, the API returns `503` and the form keeps the input and asks the customer to retry. There's no database (see D1), so showing "Thank you" for an enquiry that was lost would be a silent loss of sales. |
| A8 | Prices | No currency in Fake Store | Shown as USD. Locale and currency become config once the real catalogue exists. |
| A9 | Images | *"Do not call the Fake Store API directly from the client"* | I read this as product **data**. The browser still loads product **images** from the image URLs Fake Store provides, the same way it would load them from a CDN. Proxying them through the API would add load and latency for no PoC benefit. When the real catalogue arrives, images would come from S3 + CloudFront. |
| A11 | *"WHEN I click the search button"* | Is search-as-you-type allowed? | The button (or Enter) still goes to the full results page, exactly as the criterion says. **Live suggestions** are an extra shortcut on top, served by the same backend endpoint (debounced, max 5). Filters and sorting on the results page run client-side because a result set is small; the server stays the source of what matches. |
| A12 | Reviewer experience | How does a reviewer see the email? | The UI shows **demo-only links to the Mailpit inbox**: in the header, and on the Thank you panel a deep link to *that* enquiry's email (`/search?q=<reference>`; the reference is in the subject). It's turned on only by the build-time variable `VITE_DEMO_INBOX_URL` (set in `docker-compose.yml` and `ui/.env.development`). A production build leaves it unset, so nothing renders. This is tested. |
| A13 | Look & feel | The creative work is still in progress | A complete, tasteful base so the PoC is pleasant to use in feedback sessions: light and dark themes driven entirely by tokens, self-hosted variable fonts (Inter, Fraunces; no font CDN calls), a custom SVG logo. Re-skinning means editing `tokens.css` and swapping the logo component. |
| A10 | "Web or mobile" | Which? | **Web.** The entrepreneur gets a link to share, the reviewer needs no simulator, and React can grow into React Native later if mobile is needed. |

## Dropped or simplified (and why)

| # | What | Why |
|---|---|---|
| D1 | **No database** | No acceptance criterion needs persistence: products come from Fake Store, the picks from a config file, and enquiries go by email. A DB would add a container, migrations and an ORM for no PoC value. **Known risk:** an enquiry can be lost if email is down. It's handled honestly in the UI (A7), and persisting enquiries is the first item under "next". |
| D2 | **No auth or admin UI** | Not in the criteria. The featured picks are edited in a JSON file. |
| D3 | **No pagination or sorting** | The catalogue has 20 products. The API response shapes (`{ products: [...] }`) leave room to add `page` and `total` without a breaking change. |
| D4 | **Minimal visual design** | The creative team owns the look and feel. I built a clean, accessible, responsive base on **design tokens** (`ui/src/theme/tokens.css`) so their work can be applied in one place, not scattered through components. |
| D5 | **In-memory cache and rate limiting** | Correct for a single instance. With more than one instance they move to Redis (ElastiCache). Both sit behind small interfaces or middleware, so it's a contained change. |
| D6 | **No end-to-end browser tests in CI** | The criteria are covered by UI journey tests (real router and API client, only `fetch` mocked) plus API route tests. I also ran a manual visual check in headless Chrome. A Playwright suite against `docker compose` is the next testing step. |
| D7 | **No AWS deployment in the submission path** | Not required. The reviewer runs it locally. The containers are ready for AWS (see below). |

## How the design grows beyond the PoC

The brief says the **product data source, look and feel, and email provider** will all change. Each one already has a single place to change it:

| Will change | Where it changes | What stays the same |
|---|---|---|
| Product data source (Fake Store → own DB, Shopify, PIM) | Add a class implementing `ProductSource`, wire it in `server.ts` | Services, routes, API contract, UI |
| Owner's "top rated" picks (file → admin UI) | Add a `FeaturedProvider` implementation | Everything else |
| Email provider (SMTP → SES API, SendGrid, Postmark) | Add a `Mailer` implementation, or just change the SMTP env vars | Enquiry rules, template, UI |
| Email template | `enquiry.email.ts` (separate from delivery) | Mailer, service |
| Look & feel | `ui/src/theme/tokens.css`, then component CSS modules | Behaviour, tests (they query by role and text, not class names) |
| Deployment shape | Feature modules can be split into services; enquiry already reaches catalogue through a `ProductLookup` port, so the change is one adapter swapped for an HTTP client | Module code and tests |

Other things that support growth:
- **Fake Store's shape stops at the adapter.** The rest of the app uses our own `Product` model, and upstream responses are validated, so if Fake Store changes, the error shows up in one place.
- **Module boundaries are enforced by lint**, so the structure can't quietly decay as the team grows.
- **Config is validated at startup** (zod), so a misconfigured deploy fails immediately with a readable error, not on the first request.
- **One error contract** for the whole API, and the UI maps it consistently (field errors next to fields, friendly messages otherwise).

## Next, with another day

1. **Persist enquiries before emailing (outbox pattern).** Save to Postgres (RDS), send asynchronously with retries (SQS), and add an admin view. This removes the risk in D1 and A7.
2. **Playwright end-to-end tests** against `docker compose` in CI, including checking that the email arrives through Mailpit's API.
3. **OpenAPI spec** for the API, with UI types generated from it (today `ui/src/api/types.ts` mirrors the API by hand).
4. **Deploy on AWS** with infrastructure as code (CDK or Terraform): UI on S3 + CloudFront, API on ECS Fargate (or App Runner) behind an ALB, SES for email, Secrets Manager for SMTP credentials, CloudWatch logs and alarms.
5. **Production hardening:** request IDs in logs, structured access logs, Redis for the cache and rate limiter, and a CAPTCHA (e.g. Turnstile) if the honeypot isn't enough.
6. **Product UX:** pagination, sorting and filtering, related products, and an image CDN with responsive sizes.
