import { authService } from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';

export const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      return sendSuccess(res, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      return sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  },
};
