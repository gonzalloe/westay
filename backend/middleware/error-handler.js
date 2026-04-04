// ============ CENTRALIZED ERROR HANDLER ============
// Catches all unhandled errors from route handlers
// Must be registered LAST with app.use(errorHandler)

function errorHandler(err, req, res, next) {
  // Log error server-side (never expose stack to client)
  console.error('[ERROR]', req.method, req.originalUrl, err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Already sent headers? Delegate to default Express handler
  if (res.headersSent) return next(err);

  const status = err.status || err.statusCode || 500;
  const message = status === 500
    ? 'Internal server error'
    : err.message || 'Something went wrong';

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
