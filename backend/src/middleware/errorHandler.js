/**
 * errorHandler.js
 * Centralized Express error-handling middleware.
 * Must be the last middleware registered in app.js.
 */

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred.';

  // Log server errors (not client 4xx) for debugging
  if (status >= 500) {
    console.error('[Server Error]', err);
  }

  res.status(status).json({
    success: false,
    message,
    errors: err.errors || undefined,
    ...(process.env.NODE_ENV === 'development' && status >= 500
      ? { stack: err.stack }
      : {}),
  });
}

/**
 * 404 handler for unmatched routes.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}
