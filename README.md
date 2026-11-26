# Storefront Catalogue

A product catalogue proof of concept: browse, search and send an enquiry that is emailed to the sales inbox. Built with React + TypeScript and Node.js + TypeScript.

## 👉 The submission is in [Pull Request #1](https://github.com/gsksudheer/storefront-catalogue/pull/1)

As the challenge asks, the work was built on a feature branch and raised as a pull request into `main`, which is **left open on purpose**. That's why `main` only contains this note.

| | |
|---|---|
| **Pull request** (description, commits, CI) | [#1: Product catalogue PoC](https://github.com/gsksudheer/storefront-catalogue/pull/1) |
| **Code** | [`feat/catalogue-mvp` branch](https://github.com/gsksudheer/storefront-catalogue/tree/feat/catalogue-mvp) |
| **README** (setup and run) | [README.md](https://github.com/gsksudheer/storefront-catalogue/blob/feat/catalogue-mvp/README.md) |
| **Decisions and assumptions** | [DECISIONS.md](https://github.com/gsksudheer/storefront-catalogue/blob/feat/catalogue-mvp/DECISIONS.md) |
| **AI usage** | [AI_USAGE.md](https://github.com/gsksudheer/storefront-catalogue/blob/feat/catalogue-mvp/AI_USAGE.md) |

## Run it

```bash
git clone https://github.com/gsksudheer/storefront-catalogue.git
cd storefront-catalogue
git checkout feat/catalogue-mvp
docker compose up --build
```

Then open http://localhost:8080 (storefront) and http://localhost:8025 (demo sales inbox). No accounts or configuration needed.
