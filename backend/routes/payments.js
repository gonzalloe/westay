// ============ PAYMENT ROUTES ============
// Stripe Checkout Session integration for bill payments
// Routes: /api/payments/*

const express = require('express');
const router = express.Router();
const payment = require('../services/payment');
const { createAuditEntry } = require('../middleware/audit');

module.exports = function(db) {

  // GET /api/payments/status — Check if payment gateway is configured
  router.get('/status', (req, res) => {
    res.json({
      configured: payment.isConfigured(),
      provider: 'stripe',
      methods: ['fpx', 'card', 'grabpay'],
      currency: 'myr',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ''
    });
  });

  // POST /api/payments/checkout — Create Stripe Checkout Session (redirect to Stripe-hosted page)
  router.post('/checkout', async (req, res) => {
    try {
      if (!payment.isConfigured()) {
        return res.status(503).json({
          error: 'Payment gateway not configured',
          hint: 'Set STRIPE_SECRET_KEY in .env to enable payments'
        });
      }

      const { billId, billType, paymentMethod } = req.body;
      if (!billId) return res.status(400).json({ error: 'billId is required' });

      // Look up the bill from the appropriate table
      let bill, amountCents, tenantName, propertyName;
      if (billType === 'utility') {
        bill = await db.getById('utility_bills', billId);
        if (!bill) return res.status(404).json({ error: 'Utility bill not found' });
        if (bill.status === 'Paid') return res.status(400).json({ error: 'Bill already paid' });
        amountCents = payment.parseAmountToCents(bill.total);
        tenantName = bill.tenant || '';
        propertyName = bill.property || '';
      } else {
        bill = await db.getById('bills', billId);
        if (!bill) return res.status(404).json({ error: 'Bill not found' });
        if (bill.s === 'Paid') return res.status(400).json({ error: 'Bill already paid' });
        amountCents = payment.parseAmountToCents(bill.a);
        tenantName = bill.t || '';
        propertyName = bill.prop || '';
      }

      // Build success/cancel URLs
      const origin = req.headers.origin || req.headers.referer || 'http://localhost:' + (process.env.PORT || 3456);
      const baseUrl = origin.replace(/\/$/, '');
      const successUrl = baseUrl + '/?payment_success=' + encodeURIComponent(billId) + '&session_id={CHECKOUT_SESSION_ID}';
      const cancelUrl = baseUrl + '/?payment_cancelled=' + encodeURIComponent(billId);

      // Map ewallet → grabpay for Stripe
      let stripeMethod = paymentMethod || 'auto';
      if (stripeMethod === 'ewallet') stripeMethod = 'grabpay';

      const result = await payment.createCheckoutSession({
        amount: amountCents,
        currency: 'myr',
        billId: bill.id || billId,
        billType: billType || 'rent',
        tenantName,
        propertyName,
        paymentMethod: stripeMethod,
        successUrl,
        cancelUrl
      });

      // Audit log
      createAuditEntry(db, {
        action: 'create',
        entity: 'checkout_session',
        entityId: result.sessionId,
        user: req.user,
        ip: req.ip,
        details: { billId, billType, amount: amountCents, currency: 'myr', method: stripeMethod }
      });

      res.json(result);
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/payments/create-intent — Create payment intent (legacy, kept for card confirm flow)
  router.post('/create-intent', async (req, res) => {
    try {
      if (!payment.isConfigured()) {
        return res.status(503).json({
          error: 'Payment gateway not configured',
          hint: 'Set STRIPE_SECRET_KEY in .env to enable payments'
        });
      }

      const { billId, paymentMethods } = req.body;
      if (!billId) return res.status(400).json({ error: 'billId is required' });

      const bill = await db.getById('bills', billId);
      if (!bill) return res.status(404).json({ error: 'Bill not found' });
      if (bill.s === 'Paid') return res.status(400).json({ error: 'Bill already paid' });

      const amountCents = payment.parseAmountToCents(bill.a);

      const result = await payment.createPaymentIntent({
        amount: amountCents,
        currency: 'myr',
        billId: bill.id,
        tenantName: bill.t,
        propertyName: bill.prop || '',
        paymentMethods: paymentMethods || ['fpx', 'card', 'grabpay']
      });

      createAuditEntry(db, {
        action: 'create',
        entity: 'payment_intent',
        entityId: result.paymentIntentId,
        user: req.user,
        ip: req.ip,
        details: { billId, amount: amountCents, currency: 'myr' }
      });

      res.json(result);
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/payments/verify-session/:sessionId — Verify checkout session completed
  router.get('/verify-session/:sessionId', async (req, res) => {
    try {
      if (!payment.isConfigured()) {
        return res.status(503).json({ error: 'Payment gateway not configured' });
      }

      const session = await payment.getCheckoutSession(req.params.sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found' });

      const billId = session.metadata && session.metadata.billId;
      const billType = session.metadata && session.metadata.billType;
      const paid = session.payment_status === 'paid';

      // If paid, auto-mark the bill
      if (paid && billId) {
        await _markBillPaid(db, billId, billType, session.payment_intent ? session.payment_intent.id || session.payment_intent : null, req);
      }

      res.json({
        status: session.payment_status,
        paid,
        billId,
        billType,
        amountTotal: session.amount_total,
        currency: session.currency,
        paymentMethod: session.payment_method_types ? session.payment_method_types[0] : null,
        customerEmail: session.customer_details ? session.customer_details.email : null
      });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/payments/:intentId — Get payment intent status
  router.get('/:intentId', async (req, res) => {
    try {
      if (!payment.isConfigured()) {
        return res.status(503).json({ error: 'Payment gateway not configured' });
      }

      const result = await payment.getPaymentIntent(req.params.intentId);
      res.json(result);
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/payments/confirm/:billId — Confirm payment and mark bill as paid
  router.post('/confirm/:billId', async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      const billId = req.params.billId;

      // Try rent bills first, then utility bills
      let bill = await db.getById('bills', billId);
      let billType = 'rent';
      if (!bill) {
        bill = await db.getById('utility_bills', billId);
        billType = 'utility';
      }
      if (!bill) return res.status(404).json({ error: 'Bill not found' });

      const alreadyPaid = billType === 'rent' ? bill.s === 'Paid' : bill.status === 'Paid';
      if (alreadyPaid) return res.status(400).json({ error: 'Bill already paid' });

      // If Stripe is configured, verify the payment intent
      if (payment.isConfigured() && paymentIntentId) {
        const intent = await payment.getPaymentIntent(paymentIntentId);
        if (intent.status !== 'succeeded') {
          return res.status(400).json({ error: 'Payment not yet confirmed by Stripe. Status: ' + intent.status });
        }
      }

      const result = await _markBillPaid(db, billId, billType, paymentIntentId, req);
      res.json(result);
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/payments/refund — Refund a payment
  router.post('/refund', async (req, res) => {
    try {
      if (!payment.isConfigured()) {
        return res.status(503).json({ error: 'Payment gateway not configured' });
      }

      const { paymentIntentId, amount } = req.body;
      if (!paymentIntentId) return res.status(400).json({ error: 'paymentIntentId is required' });

      const result = await payment.createRefund(paymentIntentId, amount);

      createAuditEntry(db, {
        action: 'create',
        entity: 'refund',
        entityId: result.id,
        user: req.user,
        ip: req.ip,
        details: { paymentIntentId, amount }
      });

      res.json(result);
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};

// ---- Internal: mark bill as paid + auto-reconnect ----
async function _markBillPaid(db, billId, billType, paymentIntentId, req) {
  const result = { billId, billType, paid: true, reconnected: null, lockReEnabled: null };

  if (billType === 'utility') {
    await db.update('utility_bills', billId, {
      status: 'Paid',
      paidAt: new Date().toISOString(),
      paymentMethod: paymentIntentId ? 'stripe' : 'manual',
      paymentIntentId: paymentIntentId || null
    });
  } else {
    const bill = await db.getById('bills', billId);
    await db.update('bills', billId, {
      s: 'Paid',
      paidAt: new Date().toISOString(),
      paymentMethod: paymentIntentId ? 'stripe' : 'manual',
      paymentIntentId: paymentIntentId || null
    });

    // Auto-reconnect electric meter
    if (bill && bill.t) {
      const meters = await db.getAll('electric_meters');
      const meter = meters.find(m => m.tenant === bill.t && m.status !== 'Connected');
      if (meter) {
        await db.update('electric_meters', meter.meterId, { status: 'Connected' });
        result.reconnected = { meterId: meter.meterId, room: meter.room, unit: meter.unit };
      }

      // Auto re-enable smart lock
      const locks = await db.getAll('smart_lock_registry');
      const lock = locks.find(l => l.tenant === bill.t && l.status.includes('Disabled') && !l.status.includes('Lease Expired'));
      if (lock) {
        await db.updateWhere('smart_lock_registry', { tenant: bill.t }, { status: 'Active', fingerprints: 2 });
        result.lockReEnabled = { tenant: bill.t, unit: lock.unit };
      }
    }
  }

  // Audit
  if (req && req.user) {
    const { createAuditEntry } = require('../middleware/audit');
    createAuditEntry(db, {
      action: 'update',
      entity: billType === 'utility' ? 'utility_bills' : 'bills',
      entityId: billId,
      user: req.user,
      ip: req.ip,
      details: { action: 'payment_confirmed', method: paymentIntentId ? 'stripe' : 'manual', paymentIntentId }
    });
  }

  // Broadcast via WebSocket
  if (req && req.app) {
    const broadcast = req.app.get('broadcast');
    if (broadcast) {
      broadcast('bills', 'paid', { billId, billType });
    }
  }

  return result;
}
