// ============ NOTIFICATION ROUTES ============
// API endpoints for sending notifications via email, WhatsApp, and in-app
// Routes: /api/notifications/*

const express = require('express');
const router = express.Router();
const notification = require('../services/notification');
const { validate } = require('../middleware/validate');

module.exports = function(db) {

  // GET /api/notifications/status — Check notification channel availability
  router.get('/status', (req, res) => {
    res.json({
      email: {
        configured: notification.isEmailConfigured(),
        provider: 'nodemailer'
      },
      whatsapp: {
        configured: notification.isWhatsAppConfigured(),
        provider: 'meta-cloud-api'
      },
      inapp: {
        configured: true,
        provider: 'built-in'
      }
    });
  });

  // POST /api/notifications/send — Send notification (multi-channel)
  router.post('/send', validate({
    channels: { required: true, isArray: true },
    subject: { required: true, type: 'string', maxLen: 200 },
    message: { required: true, type: 'string', maxLen: 2000 }
  }), async (req, res) => {
    try {
      const broadcast = req.app.get('broadcast');
      const results = await notification.sendMultiChannel(db, {
        ...req.body,
        broadcast
      });
      res.json({ results });
    } catch(e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/notifications/email — Send email only
  router.post('/email', validate({
    to: { required: true, type: 'string', maxLen: 200 },
    subject: { required: true, type: 'string', maxLen: 200 },
    message: { required: true, type: 'string', maxLen: 5000 }
  }), async (req, res) => {
    try {
      const result = await notification.sendEmail({
        to: req.body.to,
        subject: req.body.subject,
        text: req.body.message,
        html: req.body.html
      });
      res.json(result);
    } catch(e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/notifications/whatsapp — Send WhatsApp message
  router.post('/whatsapp', validate({
    to: { required: true, type: 'string', maxLen: 20 },
    message: { required: true, type: 'string', maxLen: 2000 }
  }), async (req, res) => {
    try {
      const result = await notification.sendWhatsApp({
        to: req.body.to,
        message: req.body.message,
        template: req.body.template,
        templateParams: req.body.templateParams
      });
      res.json(result);
    } catch(e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/notifications/rent-reminder — Send rent due reminder to a tenant
  router.post('/rent-reminder', validate({
    billId: { required: true, type: 'string' }
  }), async (req, res) => {
    try {
      const bill = await db.getById('bills', req.body.billId);
      if (!bill) return res.status(404).json({ error: 'Bill not found' });

      // Find tenant details
      const tenant = await db.getById('tenants', bill.t);

      const subject = 'Rent Payment Reminder - ' + bill.id;
      const message = `Hi ${bill.t}, your rent of ${bill.a} for ${bill.prop || 'your unit'} is due on ${bill.d}. Please make your payment to avoid service interruptions.`;
      const html = notification.rentDueEmailHtml(bill.t, bill.a, bill.d, bill.prop || '');

      const channels = ['inapp'];
      const opts = {
        channels,
        subject,
        message,
        html,
        type: 'warning',
        target: bill.t,
        broadcast: req.app.get('broadcast')
      };

      // Add email if tenant has email
      if (tenant && tenant.email) {
        opts.channels.push('email');
        opts.emailTo = tenant.email;
      }

      // Add WhatsApp if tenant has phone
      if (tenant && tenant.phone) {
        opts.channels.push('whatsapp');
        opts.phone = tenant.phone;
      }

      const results = await notification.sendMultiChannel(db, opts);
      res.json({ bill: bill.id, tenant: bill.t, results });
    } catch(e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/notifications/bulk-rent-reminder — Send rent reminders for all pending bills
  router.post('/bulk-rent-reminder', async (req, res) => {
    try {
      const bills = await db.query('bills', { s: 'Pending' });
      const results = [];

      for (const bill of bills) {
        const subject = 'Rent Payment Reminder - ' + bill.id;
        const message = `Hi ${bill.t}, your rent of ${bill.a} is due on ${bill.d}. Please make your payment.`;

        const r = await notification.createInAppNotification(db, {
          title: subject,
          message,
          type: 'warning',
          target: bill.t,
          broadcast: req.app.get('broadcast')
        });
        results.push({ billId: bill.id, tenant: bill.t, notificationId: r.id });
      }

      res.json({ sent: results.length, results });
    } catch(e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
