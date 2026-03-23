# Stripe Frontend

This repository contains only the frontend (HTML, CSS, and JavaScript).

## Files

- `frontend/index.html`
- `frontend/style.css`
- `frontend/payment.js`

## Connect to your worker

Set your worker base URL in `frontend/index.html`:

```html
<script>
  window.STRIPE_API_BASE = 'https://YOUR-WORKER-DOMAIN.workers.dev';
</script>
```

## Run locally

```bash
npm start
```

`npm start` uses Python's built-in HTTP server (`python3`), so make sure Python 3 is installed.

Then open `http://localhost:8080`.
