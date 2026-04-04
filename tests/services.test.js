// ============ SERVICE TESTS ============
// Tests for payment and notification services

describe('Payment Service', () => {
  const payment = require('../backend/services/payment');

  test('isConfigured returns false when no key set', () => {
    const original = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = 'sk_test_your_key_here';
    expect(payment.isConfigured()).toBe(false);
    process.env.STRIPE_SECRET_KEY = original;
  });

  test('isConfigured returns false when key is empty', () => {
    const original = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    expect(payment.isConfigured()).toBe(false);
    process.env.STRIPE_SECRET_KEY = original;
  });

  describe('parseAmountToCents', () => {
    test('parses RM string', () => {
      expect(payment.parseAmountToCents('RM 1,500')).toBe(150000);
    });

    test('parses decimal amount', () => {
      expect(payment.parseAmountToCents('RM 850.50')).toBe(85050);
    });

    test('parses plain number string', () => {
      expect(payment.parseAmountToCents('1200')).toBe(120000);
    });

    test('parses number input', () => {
      expect(payment.parseAmountToCents(850)).toBe(85000);
    });

    test('parses amount with spaces and commas', () => {
      expect(payment.parseAmountToCents('RM 2,500.00')).toBe(250000);
    });

    test('throws on invalid amount', () => {
      expect(() => payment.parseAmountToCents('abc')).toThrow('Invalid amount');
    });
  });
});

describe('Notification Service', () => {
  const notification = require('../backend/services/notification');

  test('isEmailConfigured returns false without env vars', () => {
    const host = process.env.SMTP_HOST;
    delete process.env.SMTP_HOST;
    expect(notification.isEmailConfigured()).toBe(false);
    process.env.SMTP_HOST = host;
  });

  test('isWhatsAppConfigured returns false without env vars', () => {
    const url = process.env.WHATSAPP_API_URL;
    delete process.env.WHATSAPP_API_URL;
    expect(notification.isWhatsAppConfigured()).toBe(false);
    process.env.WHATSAPP_API_URL = url;
  });

  test('sendEmail returns error when not configured', async () => {
    const result = await notification.sendEmail({ to: 'test@test.com', subject: 'Test', text: 'Hello' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('not configured');
  });

  test('sendWhatsApp returns error when not configured', async () => {
    const result = await notification.sendWhatsApp({ to: '60123456789', message: 'Hello' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('not configured');
  });

  test('createInAppNotification creates notification in DB', async () => {
    const { createTestDB } = require('./setup');
    const db = await createTestDB();

    const notif = await notification.createInAppNotification(db, {
      title: 'Test Alert',
      message: 'This is a test',
      type: 'info',
      target: 'all'
    });

    expect(notif.id).toMatch(/^N-/);
    expect(notif.title).toBe('Test Alert');
    expect(notif.read).toBe(false);

    // Verify it's in DB
    const fetched = await db.getById('notifs', notif.id);
    expect(fetched).toBeTruthy();
    expect(fetched.title).toBe('Test Alert');
  });

  test('sendMultiChannel sends to inapp by default', async () => {
    const { createTestDB } = require('./setup');
    const db = await createTestDB();

    const results = await notification.sendMultiChannel(db, {
      channels: ['inapp'],
      subject: 'Multi Test',
      message: 'Testing multi-channel'
    });

    expect(results.inapp).toBeTruthy();
    expect(results.inapp.success).toBe(true);
  });

  test('rentDueEmailHtml generates valid HTML', () => {
    const html = notification.rentDueEmailHtml('Sarah Lim', 'RM 850', '05 Apr 2026', 'Cambridge House');
    expect(html).toContain('Sarah Lim');
    expect(html).toContain('RM 850');
    expect(html).toContain('Cambridge House');
    expect(html).toContain('WeStay');
  });

  test('ticketUpdateEmailHtml generates valid HTML', () => {
    const html = notification.ticketUpdateEmailHtml('Sarah Lim', 'TK-001', 'In Progress', 'Being fixed');
    expect(html).toContain('TK-001');
    expect(html).toContain('In Progress');
  });
});

describe('HTTPS Module', () => {
  const httpsModule = require('../backend/https');

  test('isSSLEnabled returns false by default', () => {
    const original = process.env.SSL_ENABLED;
    delete process.env.SSL_ENABLED;
    expect(httpsModule.isSSLEnabled()).toBe(false);
    process.env.SSL_ENABLED = original;
  });

  test('createHTTPSServer returns null when SSL disabled', () => {
    const original = process.env.SSL_ENABLED;
    delete process.env.SSL_ENABLED;
    expect(httpsModule.createHTTPSServer({})).toBeNull();
    process.env.SSL_ENABLED = original;
  });
});
