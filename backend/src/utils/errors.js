export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'UNAUTHENTICATED');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class InsufficientStockError extends AppError {
  constructor(message = 'Insufficient stock') {
    super(message, 409, 'INSUFFICIENT_STOCK');
  }
}

export class InvalidStateTransitionError extends AppError {
  constructor(message = 'Invalid state transition') {
    super(message, 400, 'INVALID_STATE_TRANSITION');
  }
}
