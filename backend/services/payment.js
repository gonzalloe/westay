// ============ PAYMENT GATEWAY SERVICE (Stripe) ============
// Stripe integration with FPX (Malaysian bank transfer) support
// Usage: paymentService.createPaymentIntent(amount, currency, metadata)
//
// Requires: STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env
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
 * Create a Payment Intent for a bill
 * @param {Object} options
 * @param {number} options.amount - Amount in cents (e.g., RM 150 = 15000)
 * @param {string} [options.currency='myr'] - Currency code
 * @param {string} options.billId - WeStay bill ID (INV-xxxx)
 * @param {string} options.tenantName - Tenant name
 * @param {string} options.propertyName - Property name
 * @param {string[]} [options.paymentMethods] - ['fpx', 'card', 'grabpay']
 * @returns {Promise<Object>} { clientSecret, paymentIntentId, amount, currency }
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
    amount: Math.round(amount), // cents
    currency: currency.toLowerCase(),
    payment_method_types: paymentMethods,
    metadata: {
      billId,
      tenantName: tenantName || '',
      propertyName: propertyName || '',
      source: 'westay'
    },
    description: `WeStay rent payment - ${billId}`
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
 * Retrieve a payment intent by ID
 * @param {string} paymentIntentId
 * @returns {Promise<Object>}
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
 * @param {Buffer} rawBody - Raw request body (not parsed JSON)
 * @param {string} signature - Stripe-Signature header
 * @returns {Object} Parsed event
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
 * @param {string} paymentIntentId
 * @param {number} [amount] - Partial refund amount in cents. Omit for full refund.
 * @returns {Promise<Object>}
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
 * @param {string} amountStr - Amount string like "RM 1,500" or "1500"
 * @returns {number} Amount in cents (sen)
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
  createPaymentIntent,
  getPaymentIntent,
  constructWebhookEvent,
  createRefund,
  parseAmountToCents
};
