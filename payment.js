(async () => {
  const placeholderApiBase = 'https://YOUR-WORKER-DOMAIN.workers.dev';
  const apiBase = window.STRIPE_API_BASE || placeholderApiBase;
  const apiUrl = (path) => `${apiBase}${path}`;
  const initMessagePrefix = 'Unable to initialize payment form.';
  const keyMissingMessage = 'STRIPE_PUBLISHABLE_KEY is not configured';
  const apiBaseMissingMessage = 'STRIPE_API_BASE is not configured';
  const unknownInitMessage = 'Unable to determine initialization failure reason.';

  let elements;
  let currentAmount = null; // track the PaymentIntent amount in cents
  let lastInitErrorReason = unknownInitMessage;

  const form       = document.getElementById('payment-form');
  const amountInput = document.getElementById('amount');
  const msgEl      = document.getElementById('payment-message');
  const submitBtn  = document.getElementById('submit-btn');
  const btnText    = document.getElementById('btn-text');
  const spinner    = document.getElementById('spinner');

  async function fetchJson(path, options) {
    const response = await fetch(apiUrl(path), options);
    let payload = {};
    try {
      payload = await response.json();
    } catch (_) {
      // keep empty payload for non-JSON failures
    }

    if (!response.ok) {
      throw new Error(payload.error || `Request failed: ${response.status}`);
    }
    return payload;
  }

    function showMessage(text, type) {
      msgEl.textContent = text;
      msgEl.className   = type; // 'error' or 'success'
    }

    function setLoading(loading) {
      submitBtn.disabled = loading;
      spinner.style.display  = loading ? 'block' : 'none';
      btnText.style.display  = loading ? 'none'  : 'inline';
    }

    function showInitError(reason) {
      lastInitErrorReason = reason || unknownInitMessage;
      showMessage(`${initMessagePrefix}\n${lastInitErrorReason}`, 'error');
    }

    if (apiBase === placeholderApiBase) {
      showInitError(apiBaseMissingMessage);
      return;
    }

    // 1. Fetch the publishable key from the backend (never hardcoded here)
    let stripe;
    try {
      const { publishableKey } = await fetchJson('/config');
      if (typeof publishableKey !== 'string' || !publishableKey.trim()) {
        throw new Error(keyMissingMessage);
      }
      stripe = Stripe(publishableKey.trim()); // eslint-disable-line no-undef
    } catch (error) {
      const reason = typeof error?.message === 'string' && error.message.trim()
        ? error.message.trim()
        : unknownInitMessage;
      showInitError(reason);
      return;
    }

    async function initializeElements(amountCents) {
      try {
        const { clientSecret, error } = await fetchJson('/create-payment-intent', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ amount: amountCents }),
        });

        if (error) {
          showMessage(error, 'error');
          return false;
        }

        if (typeof clientSecret !== 'string' || !clientSecret.trim()) {
          showMessage('Backend did not return a valid clientSecret.', 'error');
          return false;
        }

        elements = stripe.elements({ clientSecret: clientSecret.trim() });
        const paymentEl = elements.create('payment');
        paymentEl.mount('#payment-element');
        return true;
      } catch (error) {
        showMessage(error.message, 'error');
        return false;
      }
    }

    // Build (or rebuild) the payment element when the amount changes
    let debounceTimer;
    amountInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const dollars = parseFloat(amountInput.value);
        if (isNaN(dollars) || dollars < 0.50) return;
        const cents = Math.round(dollars * 100);
        if (cents === currentAmount) return;
        currentAmount = cents;
        document.getElementById('payment-element').innerHTML = '';
        msgEl.className = '';
        await initializeElements(cents);
      }, 600);
    });

    // Bootstrap with the default amount
    const defaultCents = Math.round(parseFloat(amountInput.value) * 100);
    currentAmount = defaultCents;
    await initializeElements(defaultCents);

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!elements) {
        showInitError(lastInitErrorReason);
        return;
      }
      setLoading(true);

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Redirect here after payment (can be a dedicated success page)
          return_url: window.location.href,
        },
      });

      // confirmPayment only lands here on error (success redirects away)
      if (error) {
        showMessage(error.message, 'error');
      } else {
        showMessage('Something unexpected happened.', 'error');
      }
      setLoading(false);
    });

    // Show success message if redirected back after payment
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_intent_client_secret')) {
      const { paymentIntent } = await stripe.retrievePaymentIntent(
        params.get('payment_intent_client_secret')
      );
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        showMessage('Payment succeeded! Thank you.', 'success');
      }
    }
  })();
