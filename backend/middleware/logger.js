// ============ STRUCTURED LOGGING (Winston) ============
// Replaces console.log with structured, leveled, rotatable logs
// Logs to console (dev) + file (production). HTTP request logging middleware.

const path = require('path');
const fs = require('fs');

// ---- Log levels & colors for console ----
const LEVELS = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const COLORS = { error: '\x1b[31m', warn: '\x1b[33m', info: '\x1b[36m', http: '\x1b[35m', debug: '\x1b[90m' };
const RESET = '\x1b[0m';

// ---- Configuration ----
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_LOG_FILES = 5; // keep 5 rotated files

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ---- File rotation helper ----
function rotateIfNeeded(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const stats = fs.statSync(filePath);
    if (stats.size < MAX_LOG_SIZE) return;

    // Rotate: app.log -> app.log.1, app.log.1 -> app.log.2, etc.
    for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
      const from = i === 1 ? filePath : filePath + '.' + (i - 1);
      const to = filePath + '.' + i;
      if (fs.existsSync(from)) {
        fs.renameSync(from, to);
      }
    }
    // Truncate current file
    fs.writeFileSync(filePath, '');
  } catch (e) {
    // Silent failure — logging should never crash the app
  }
}

// ---- Logger class ----
class Logger {
  constructor() {
    this.level = LOG_LEVEL;
    this.appLogFile = path.join(LOG_DIR, 'app.log');
    this.errorLogFile = path.join(LOG_DIR, 'error.log');
    this.httpLogFile = path.join(LOG_DIR, 'http.log');
  }

  shouldLog(level) {
    return LEVELS[level] <= LEVELS[this.level];
  }

  format(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  write(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const line = this.format(level, message, meta);

    // Console output (colored)
    const color = COLORS[level] || '';
    process.stdout.write(`${color}${line}${RESET}\n`);

    // File output (plain text)
    const fileLine = line + '\n';

    // All logs -> app.log
    rotateIfNeeded(this.appLogFile);
    fs.appendFileSync(this.appLogFile, fileLine);

    // Errors also -> error.log
    if (level === 'error' || level === 'warn') {
      rotateIfNeeded(this.errorLogFile);
      fs.appendFileSync(this.errorLogFile, fileLine);
    }

    // HTTP logs -> http.log
    if (level === 'http') {
      rotateIfNeeded(this.httpLogFile);
      fs.appendFileSync(this.httpLogFile, fileLine);
    }
  }

  error(message, meta) { this.write('error', message, meta); }
  warn(message, meta) { this.write('warn', message, meta); }
  info(message, meta) { this.write('info', message, meta); }
  http(message, meta) { this.write('http', message, meta); }
  debug(message, meta) { this.write('debug', message, meta); }
}

const logger = new Logger();

// ---- HTTP Request Logging Middleware ----
function httpLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const user = req.user ? req.user.username : 'anonymous';

    const level = statusCode >= 500 ? 'error'
      : statusCode >= 400 ? 'warn'
      : 'http';

    logger[level](`${method} ${originalUrl} ${statusCode} ${duration}ms`, {
      ip: ip || req.connection.remoteAddress,
      user,
      status: statusCode,
      duration,
      contentLength: res.get('content-length') || 0
    });
  });

  next();
}

module.exports = { logger, httpLogger };
