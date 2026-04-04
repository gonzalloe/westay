// ============ MIDDLEWARE TESTS ============
// Tests for validation, sanitization, pagination, auth, and logging

const { createTestDB, seedTestDB, generateTestToken, getTestUsers } = require('./setup');

// ---- Validation & Sanitization ----

describe('Validation Middleware', () => {
  const { sanitize, sanitizeObj, validate } = require('../backend/middleware/validate');

  describe('sanitize()', () => {
    test('strips script tags', () => {
      expect(sanitize('<script>alert("xss")</script>Hello')).toBe('Hello');
    });

    test('strips event handlers', () => {
      expect(sanitize('Click <div onmouseover=alert(1)>here</div>')).toBe('Click here');
    });

    test('strips javascript: protocol', () => {
      expect(sanitize('javascript:alert(1)')).toBe('alert(1)');
    });

    test('strips data:text/html', () => {
      expect(sanitize('data:text/html,<h1>xss</h1>')).not.toContain('data:');
      expect(sanitize('data:text/html,<h1>xss</h1>')).not.toContain('<');
    });

    test('trims whitespace', () => {
      expect(sanitize('  hello  ')).toBe('hello');
    });

    test('passes through clean strings', () => {
      expect(sanitize('Hello World')).toBe('Hello World');
    });

    test('passes through non-string values', () => {
      expect(sanitize(42)).toBe(42);
      expect(sanitize(null)).toBe(null);
    });
  });

  describe('sanitizeObj()', () => {
    test('recursively sanitizes object values', () => {
      const input = { name: '<script>bad</script>John', age: 25 };
      const result = sanitizeObj(input);
      expect(result.name).toBe('John');
      expect(result.age).toBe(25);
    });

    test('handles nested objects', () => {
      const input = { data: { value: '<script>x</script>clean' } };
      const result = sanitizeObj(input);
      expect(result.data.value).toBe('clean');
    });

    test('handles arrays', () => {
      const input = [{ name: '<script>x</script>clean' }];
      const result = sanitizeObj(input);
      expect(result[0].name).toBe('clean');
    });
  });

  describe('validate() middleware', () => {
    function mockReqRes(body) {
      return {
        req: { body },
        res: {
          statusCode: 200,
          status(code) { this.statusCode = code; return this; },
          json(data) { this.data = data; return this; }
        },
        nextCalled: false,
        next() { this.nextCalled = true; }
      };
    }

    test('passes valid input', () => {
      const mw = validate({ name: { required: true, type: 'string' } });
      const { req, res, next } = mockReqRes({ name: 'Test' });
      const ctx = { nextCalled: false };
      mw(req, res, () => { ctx.nextCalled = true; });
      expect(ctx.nextCalled).toBe(true);
    });

    test('rejects missing required field', () => {
      const mw = validate({ name: { required: true } });
      const { req, res } = mockReqRes({});
      mw(req, res, () => {});
      expect(res.statusCode).toBe(400);
      expect(res.data.error).toBe('Validation failed');
    });

    test('rejects wrong type', () => {
      const mw = validate({ count: { type: 'number' } });
      const { req, res } = mockReqRes({ count: 'not-a-number' });
      mw(req, res, () => {});
      expect(res.statusCode).toBe(400);
    });

    test('rejects value exceeding maxLen', () => {
      const mw = validate({ name: { type: 'string', maxLen: 5 } });
      const { req, res } = mockReqRes({ name: 'TooLong' });
      mw(req, res, () => {});
      expect(res.statusCode).toBe(400);
    });

    test('rejects value not in allowed list', () => {
      const mw = validate({ status: { allowed: ['Open', 'Closed'] } });
      const { req, res } = mockReqRes({ status: 'Invalid' });
      mw(req, res, () => {});
      expect(res.statusCode).toBe(400);
    });

    test('skips optional absent fields', () => {
      const mw = validate({ name: { type: 'string' } });
      const ctx = { nextCalled: false };
      const { req, res } = mockReqRes({});
      mw(req, res, () => { ctx.nextCalled = true; });
      expect(ctx.nextCalled).toBe(true);
    });
  });
});

// ---- Pagination ----

describe('Pagination Middleware', () => {
  const paginate = require('../backend/middleware/paginate');

  test('returns raw array without page param', () => {
    const data = [1, 2, 3, 4, 5];
    const req = { query: {} };
    expect(paginate(data, req)).toEqual([1, 2, 3, 4, 5]);
  });

  test('returns paginated object with page param', () => {
    const data = Array.from({ length: 25 }, (_, i) => i);
    const req = { query: { page: '1', limit: '10' } };
    const result = paginate(data, req);
    expect(result.data.length).toBe(10);
    expect(result.pagination.total).toBe(25);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.totalPages).toBe(3);
  });

  test('handles last page correctly', () => {
    const data = Array.from({ length: 25 }, (_, i) => i);
    const req = { query: { page: '3', limit: '10' } };
    const result = paginate(data, req);
    expect(result.data.length).toBe(5);
    expect(result.pagination.page).toBe(3);
  });

  test('clamps out-of-range page to last page', () => {
    const data = [1, 2, 3];
    const req = { query: { page: '99', limit: '10' } };
    const result = paginate(data, req);
    // paginate clamps page to totalPages (1 in this case)
    expect(result.pagination.page).toBe(1);
    expect(result.data.length).toBe(3);
  });
});

// ---- i18n ----

describe('i18n Engine', () => {
  const { t, getSupportedLocales } = require('../backend/i18n');

  test('translates English key', () => {
    expect(t('common.success', 'en')).toBe('Success');
  });

  test('translates Malay key', () => {
    expect(t('common.success', 'ms')).toBe('Berjaya');
  });

  test('translates Chinese key', () => {
    expect(t('common.success', 'zh')).toContain('成功');
  });

  test('falls back to English for unknown locale', () => {
    expect(t('common.success', 'xx')).toBe('Success');
  });

  test('returns key for unknown translation', () => {
    expect(t('nonexistent.key', 'en')).toBe('nonexistent.key');
  });

  test('handles interpolation', () => {
    const result = t('bills.generated', 'en', { count: 5 });
    expect(result).toContain('5');
  });

  test('lists supported locales', () => {
    const locales = getSupportedLocales();
    expect(locales).toContain('en');
    expect(locales).toContain('ms');
    expect(locales).toContain('zh');
  });
});

// ---- Auth Middleware (requireRole) ----

describe('Auth Middleware - requireRole', () => {
  const { requireRole } = require('../backend/middleware/auth');

  function mockReqRes(role) {
    return {
      req: { user: { id: 'u-1', username: 'test', role } },
      res: {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.data = data; return this; }
      }
    };
  }

  test('admin passes admin-only check', () => {
    const mw = requireRole('admin');
    const { req, res } = mockReqRes('admin');
    let passed = false;
    mw(req, res, () => { passed = true; });
    expect(passed).toBe(true);
  });

  test('operator fails admin-only check', () => {
    const mw = requireRole('admin');
    const { req, res } = mockReqRes('operator');
    let passed = false;
    mw(req, res, () => { passed = true; });
    expect(passed).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  test('operator passes admin+operator check', () => {
    const mw = requireRole('admin', 'operator');
    const { req, res } = mockReqRes('operator');
    let passed = false;
    mw(req, res, () => { passed = true; });
    expect(passed).toBe(true);
  });

  test('admin passes admin+operator check', () => {
    const mw = requireRole('admin', 'operator');
    const { req, res } = mockReqRes('admin');
    let passed = false;
    mw(req, res, () => { passed = true; });
    expect(passed).toBe(true);
  });

  test('tenant fails admin+operator check', () => {
    const mw = requireRole('admin', 'operator');
    const { req, res } = mockReqRes('tenant');
    let passed = false;
    mw(req, res, () => { passed = true; });
    expect(passed).toBe(false);
    expect(res.statusCode).toBe(403);
  });
});

// ---- Audit Middleware ----

describe('Audit Log', () => {
  const { createAuditEntry, queryAuditLog } = require('../backend/middleware/audit');
  let db;

  beforeEach(async () => {
    db = await createTestDB();
  });

  test('creates audit entry', async () => {
    const entry = await createAuditEntry(db, {
      action: 'create',
      entity: 'props',
      entityId: 'Test Property',
      user: { id: 'u-1', username: 'operator', role: 'operator' },
      ip: '127.0.0.1'
    });

    expect(entry.id).toMatch(/^AUD-/);
    expect(entry.action).toBe('create');
    expect(entry.entity).toBe('props');
    expect(entry.username).toBe('operator');
  });

  test('queries audit log with filters', async () => {
    await createAuditEntry(db, { action: 'create', entity: 'props', user: { id: 'u-1', username: 'operator', role: 'operator' } });
    await createAuditEntry(db, { action: 'update', entity: 'bills', user: { id: 'u-1', username: 'operator', role: 'operator' } });
    await createAuditEntry(db, { action: 'delete', entity: 'props', user: { id: 'u-1', username: 'operator', role: 'operator' } });

    const propsLogs = await queryAuditLog(db, { entity: 'props' });
    expect(propsLogs.length).toBe(2);

    const createLogs = await queryAuditLog(db, { action: 'create' });
    expect(createLogs.length).toBe(1);
  });

  test('limits query results', async () => {
    for (let i = 0; i < 10; i++) {
      await createAuditEntry(db, { action: 'create', entity: 'test' });
    }
    const limited = await queryAuditLog(db, { limit: 5 });
    expect(limited.length).toBe(5);
  });
});

// ---- Logger ----

describe('Logger', () => {
  const { logger } = require('../backend/middleware/logger');

  test('logger has all level methods', () => {
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.http).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  test('format includes timestamp and level', () => {
    const line = logger.format('info', 'test message');
    expect(line).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(line).toContain('[INFO]');
    expect(line).toContain('test message');
  });

  test('format includes meta as JSON', () => {
    const line = logger.format('error', 'fail', { code: 500 });
    expect(line).toContain('500');
  });
});
