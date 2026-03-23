(async () => {
  const apiBase = window.STRIPE_API_BASE || '';
  const apiUrl = (path) => `${apiBase}${path}`;

  // 1. Fetch the publishable key from the backend (never hardcoded here)
  const { publishableKey } = await fetch(apiUrl('/config')).then(r => r.json());
    const stripe = Stripe(publishableKey); // eslint-disable-line no-undef

    let elements;
    let currentAmount = null; // track the PaymentIntent amount in cents

    const form       = document.getElementById('payment-form');
    const amountInput = document.getElementById('amount');
    const msgEl      = document.getElementById('payment-message');
    const submitBtn  = document.getElementById('submit-btn');
    const btnText    = document.getElementById('btn-text');
    const spinner    = document.getElementById('spinner');

    function showMessage(text, type) {
      msgEl.textContent = text;
      msgEl.className   = type; // 'error' or 'success'
    }

    function setLoading(loading) {
      submitBtn.disabled = loading;
      spinner.style.display  = loading ? 'block' : 'none';
      btnText.style.display  = loading ? 'none'  : 'inline';
    }

    async function initializeElements(amountCents) {
    const { clientSecret, error } = await fetch(apiUrl('/create-payment-intent'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: amountCents }),
      }).then(r => r.json());

      if (error) {
        showMessage(error, 'error');
        return false;
      }

      elements = stripe.elements({ clientSecret });
      const paymentEl = elements.create('payment');
      paymentEl.mount('#payment-element');
      return true;
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
      if (!elements) return;
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
