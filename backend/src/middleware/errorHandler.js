import { logger } from '../config/logger.js';
import { AppError } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = err.message || 'An unexpected error occurred';

  // Log structured details via Pino
  logger.error({
    requestId: req.id,
    userId: req.user ? req.user.id : null,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    errorCode: code,
    errorMessage: message,
    stack: err.stack,
    details: err.details || null,
  }, `API Error: ${message}`);

  const responsePayload = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (err.details) {
    responsePayload.error.details = err.details;
  }

  res.status(statusCode).json(responsePayload);
};
