# Stripe Minimal App

A super minimal, secure Stripe payment app built with plain HTML, CSS, and JavaScript on the frontend and a tiny Node.js/Express backend.

## Why a backend?

The Stripe **secret key** must never be exposed to the browser. The backend:
1. Holds the secret key in an environment variable.
2. Creates a `PaymentIntent` and returns only the `client_secret` to the frontend.
3. Serves the **publishable key** via `/config` so the frontend can load Stripe.js securely.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Add your Stripe keys

```bash
cp .env.example .env
```

Edit `.env` and paste your keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys).

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Start the server

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Security highlights

| Concern | How it's handled |
|---|---|
| Secret key exposure | Kept server-side in `.env`; never sent to the browser |
| HTTP headers | `helmet` sets strict security headers including CSP |
| CORS | Locked to the same origin |
| Input validation | Amount validated as integer cents (50–99,999,999) |
| Stripe.js | Loaded from Stripe's own CDN as required by Stripe |
| PCI scope | Card data goes directly to Stripe's iframe — never touches your server |

## Project structure

```
.
├── index.html       # Payment form (HTML + inline JS)
├── style.css        # Minimal styles
├── server.js        # Express backend (PaymentIntent creation, config endpoint)
├── package.json
├── .env.example     # Environment variable template
└── .gitignore       # Excludes .env and node_modules
```
