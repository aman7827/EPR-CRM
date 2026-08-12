import { AuthorizationError } from '../utils/errors.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthorizationError('User is not authenticated'));
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError(`Role '${req.user.role}' is not authorized to perform this operation`));
    }

    next();
  };
};
