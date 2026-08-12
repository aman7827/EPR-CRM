import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AuthenticationError } from '../utils/errors.js';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authentication token is missing');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AuthenticationError('Authentication token is invalid');
    }

    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Invalid or expired authentication token'));
    } else {
      next(error);
    }
  }
};
