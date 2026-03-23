# Stripe Worker + Frontend split

This repository is now prepared to be split into two deployments:

1. **Frontend repository** (deploy to GitHub Pages)
2. **Worker repository** (deploy to Cloudflare Workers)

## What changed

- `src/worker.js` now serves API endpoints only (`/config`, `/create-payment-intent`).
- `wrangler.toml` no longer binds static assets.
- A copy of the frontend is provided in `frontend/` for your GitHub Pages repo.

## Worker repository (this repository)

### Setup

```bash
npm install
cp .env.example .dev.vars
```

Set keys in `.dev.vars`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Run locally

```bash
npm start
```

### Deploy to Cloudflare

```bash
npm run deploy
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_PUBLISHABLE_KEY
```

## Frontend repository (GitHub Pages)

Use files from:

```
frontend/
├── index.html
├── payment.js
└── style.css
```

In `frontend/index.html`, set:

```html
window.STRIPE_API_BASE = 'https://YOUR-WORKER-DOMAIN.workers.dev';
```

Then deploy that folder as your GitHub Pages site.
