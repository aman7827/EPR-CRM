import { ValidationError } from '../utils/errors.js';

export const validate = (schemas) => {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new ValidationError('Validation failed', details));
      }
      next(error);
    }
  };
};
