// ============ PAYMENT GATEWAY SERVICE (Stripe) ============
// Stripe Checkout Sessions for FPX, Card, and GrabPay
// Uses Stripe-hosted payment page — fully PCI compliant
//
// Requires: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET in .env
// For Malaysian market: supports FPX, card, and grabpay payment methods

let stripe = null;

function getStripe() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key === 'sk_test_your_key_here') {
      return null; // Stripe not configured — graceful degradation
    }
    stripe = require('stripe')(key);
  }
  return stripe;
}

/**
 * Check if Stripe is configured and available
 * @returns {boolean}
 */
function isConfigured() {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_key_here');
}

/**
 * Create a Stripe Checkout Session for a bill payment.
 * Redirects user to Stripe-hosted page for FPX bank selection,
 * card entry, or GrabPay — all PCI compliant.
 *
 * @param {Object} options
 * @param {number} options.amount - Amount in cents (RM 150 = 15000)
 * @param {string} [options.currency='myr']
 * @param {string} options.billId - WeStay bill ID (INV-xxxx or UB-xxxx)
 * @param {string} options.billType - 'rent' or 'utility'
 * @param {string} options.tenantName
 * @param {string} options.propertyName
 * @param {string} options.paymentMethod - 'fpx', 'card', 'grabpay', or 'auto'
 * @param {string} options.successUrl - Frontend URL for post-payment redirect
 * @param {string} options.cancelUrl - Frontend URL if user cancels
 * @returns {Promise<Object>} { sessionId, sessionUrl }
 */
async function createCheckoutSession(options) {
  const s = getStripe();
  if (!s) throw new Error('Payment gateway not configured. Set STRIPE_SECRET_KEY in .env');

  const {
    amount,
    currency = 'myr',
    billId,
    billType = 'rent',
    tenantName = '',
    propertyName = '',
    paymentMethod = 'auto',
    successUrl,
    cancelUrl
  } = options;

  if (!amount || amount <= 0) throw new Error('Invalid payment amount');
  if (!billId) throw new Error('Bill ID is required');
  if (!successUrl || !cancelUrl) throw new Error('Success and cancel URLs are required');

  // Map payment method to Stripe payment_method_types
  let paymentMethodTypes;
  if (paymentMethod === 'fpx') paymentMethodTypes = ['fpx'];
  else if (paymentMethod === 'card') paymentMethodTypes = ['card'];
  else if (paymentMethod === 'grabpay') paymentMethodTypes = ['grabpay'];
  else paymentMethodTypes = ['fpx', 'card', 'grabpay']; // auto — show all

  const session = await s.checkout.sessions.create({
    payment_method_types: paymentMethodTypes,
    mode: 'payment',
    currency: currency.toLowerCase(),
    line_items: [{
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: billType === 'rent' ? 'Rent Payment' : 'Utility Bill Payment',
          description: billId + (propertyName ? ' — ' + propertyName : '') + (tenantName ? ' (' + tenantName + ')' : '')
        },
        unit_amount: Math.round(amount)
      },
      quantity: 1
    }],
    metadata: {
      billId,
      billType,
      tenantName,
      propertyName,
      source: 'westay'
    },
    success_url: successUrl,
    cancel_url: cancelUrl
  });

  return {
    sessionId: session.id,
    sessionUrl: session.url
  };
}

/**
 * Create a Payment Intent (legacy — used for confirm flow)
 */
async function createPaymentIntent(options) {
  const s = getStripe();
  if (!s) throw new Error('Payment gateway not configured. Set STRIPE_SECRET_KEY in .env');

  const {
    amount,
    currency = 'myr',
    billId,
    tenantName,
    propertyName,
    paymentMethods = ['fpx', 'card', 'grabpay']
  } = options;

  if (!amount || amount <= 0) throw new Error('Invalid payment amount');
  if (!billId) throw new Error('Bill ID is required');

  const intent = await s.paymentIntents.create({
    amount: Math.round(amount),
    currency: currency.toLowerCase(),
    payment_method_types: paymentMethods,
    metadata: {
      billId,
      tenantName: tenantName || '',
      propertyName: propertyName || '',
      source: 'westay'
    },
    description: 'WeStay payment - ' + billId
  });

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
    amount: intent.amount,
    currency: intent.currency,
    status: intent.status
  };
}

/**
 * Retrieve a Checkout Session by ID
 */
async function getCheckoutSession(sessionId) {
  const s = getStripe();
  if (!s) throw new Error('Payment gateway not configured');
  const session = await s.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent']
  });
  return session;
}

/**
 * Retrieve a payment intent by ID
 */
async function getPaymentIntent(paymentIntentId) {
  const s = getStripe();
  if (!s) throw new Error('Payment gateway not configured');

  const intent = await s.paymentIntents.retrieve(paymentIntentId);
  return {
    id: intent.id,
    amount: intent.amount,
    currency: intent.currency,
    status: intent.status,
    paymentMethod: intent.payment_method,
    metadata: intent.metadata,
    created: new Date(intent.created * 1000).toISOString()
  };
}

/**
 * Handle Stripe webhook events
 */
function constructWebhookEvent(rawBody, signature) {
  const s = getStripe();
  if (!s) throw new Error('Payment gateway not configured');

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');

  return s.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

/**
 * Refund a payment
 */
async function createRefund(paymentIntentId, amount) {
  const s = getStripe();
  if (!s) throw new Error('Payment gateway not configured');

  const params = { payment_intent: paymentIntentId };
  if (amount) params.amount = Math.round(amount);

  const refund = await s.refunds.create(params);
  return {
    id: refund.id,
    amount: refund.amount,
    status: refund.status,
    paymentIntentId: refund.payment_intent
  };
}

/**
 * Parse RM amount string to cents
 * e.g., "RM 1,500" -> 150000, "RM 850.50" -> 85050
 */
function parseAmountToCents(amountStr) {
  if (typeof amountStr === 'number') return Math.round(amountStr * 100);
  const cleaned = String(amountStr).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) throw new Error('Invalid amount: ' + amountStr);
  return Math.round(num * 100);
}

module.exports = {
  isConfigured,
  createCheckoutSession,
  createPaymentIntent,
  getCheckoutSession,
  getPaymentIntent,
  constructWebhookEvent,
  createRefund,
  parseAmountToCents
};
