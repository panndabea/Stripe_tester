# Stripe Minimal App

A super minimal Stripe payment app built with plain HTML, CSS, and JavaScript on the frontend and a Cloudflare Worker for Stripe server-side calls.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Add your Stripe keys for local Worker development

```bash
cp .env.example .dev.vars
```

Edit `.dev.vars` and paste your keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys).

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Run locally

```bash
npm start
```

Open the local URL shown by Wrangler in your browser.

### 4. Deploy to Cloudflare

```bash
npm run deploy
```

Add production secrets before deploying:

```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_PUBLISHABLE_KEY
```

## Security highlights

| Concern | How it's handled |
|---|---|
| Secret key exposure | Kept server-side in Cloudflare Worker environment; never sent to the browser |
| Runtime isolation | Stripe secret operations run in Worker code, not in frontend JS |
| CORS | Worker allows browser requests for payment setup endpoints |
| Input validation | Amount validated as integer cents (50–99,999,999) |
| Stripe.js | Loaded from Stripe's own CDN as required by Stripe |
| PCI scope | Card data goes directly to Stripe's iframe — never touches your Worker |

## Project structure

```
.
├── public/
│   ├── index.html   # Payment form
│   ├── style.css    # Minimal styles
│   └── payment.js   # Frontend Stripe logic
├── src/worker.js    # Cloudflare Worker (PaymentIntent creation, config endpoint)
├── wrangler.toml    # Worker configuration + static asset binding
├── package.json
├── .env.example     # Environment variable template for Worker secrets
└── .gitignore       # Excludes env and dependencies
```
