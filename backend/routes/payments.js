// ============ PAYMENT ROUTES ============
// Stripe payment gateway integration for bill payments
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
      currency: 'myr'
    });
  });

  // POST /api/payments/create-intent — Create payment intent for a bill
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

      // Look up the bill
      const bill = await db.getById('bills', billId);
      if (!bill) return res.status(404).json({ error: 'Bill not found' });
      if (bill.s === 'Paid') return res.status(400).json({ error: 'Bill already paid' });

      // Parse amount from bill (e.g., "RM 1,500" -> 150000 cents)
      const amountCents = payment.parseAmountToCents(bill.a);

      const result = await payment.createPaymentIntent({
        amount: amountCents,
        currency: 'myr',
        billId: bill.id,
        tenantName: bill.t,
        propertyName: bill.prop || '',
        paymentMethods: paymentMethods || ['fpx', 'card', 'grabpay']
      });

      // Audit log
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
  // Called after successful Stripe payment on frontend
  router.post('/confirm/:billId', async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      const bill = await db.getById('bills', req.params.billId);
      if (!bill) return res.status(404).json({ error: 'Bill not found' });
      if (bill.s === 'Paid') return res.status(400).json({ error: 'Bill already paid' });

      // If Stripe is configured, verify the payment intent
      if (payment.isConfigured() && paymentIntentId) {
        const intent = await payment.getPaymentIntent(paymentIntentId);
        if (intent.status !== 'succeeded') {
          return res.status(400).json({ error: 'Payment not yet confirmed by Stripe. Status: ' + intent.status });
        }
      }

      // Mark bill as paid
      await db.update('bills', req.params.billId, {
        s: 'Paid',
        paidAt: new Date().toISOString(),
        paymentMethod: paymentIntentId ? 'stripe' : 'manual',
        paymentIntentId: paymentIntentId || null
      });

      const result = { bill: { ...bill, s: 'Paid' }, reconnected: null, lockReEnabled: null };

      // Auto-reconnect electric meter
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

      // Audit
      createAuditEntry(db, {
        action: 'update',
        entity: 'bills',
        entityId: bill.id,
        user: req.user,
        ip: req.ip,
        details: { action: 'payment_confirmed', method: paymentIntentId ? 'stripe' : 'manual', paymentIntentId }
      });

      // Broadcast via WebSocket
      const broadcast = req.app.get('broadcast');
      if (broadcast) {
        broadcast('bills', 'paid', { billId: bill.id, tenant: bill.t });
      }

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
