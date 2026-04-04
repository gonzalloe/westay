// ============ CENTRALIZED ERROR HANDLER ============
// Catches all unhandled errors from route handlers
// Must be registered LAST with app.use(errorHandler)

const { logger } = require('./logger');

function errorHandler(err, req, res, next) {
  // Log error via structured logger
  logger.error(err.message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    user: req.user ? req.user.username : 'anonymous',
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });

  // Already sent headers? Delegate to default Express handler
  if (res.headersSent) return next(err);

  const status = err.status || err.statusCode || 500;
  const message = status === 500
    ? 'Internal server error'
    : err.message || 'Something went wrong';

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
