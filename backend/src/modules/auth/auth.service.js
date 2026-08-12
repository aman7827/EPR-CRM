import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AuthenticationError, NotFoundError } from '../../utils/errors.js';
import { authRepository } from './auth.repository.js';

export const authService = {
  generateTokens(user) {
    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = jwt.sign(accessTokenPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    const refreshTokenPayload = {
      sub: user.id,
      type: 'refresh',
      jti: crypto.randomUUID(),
    };

    const refreshToken = jwt.sign(refreshTokenPayload, env.REFRESH_TOKEN_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    });

    // Calculate expiry timestamp for refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return { accessToken, refreshToken, expiresAt };
  },

  async login(email, password) {
    const user = await authRepository.findUserByEmail(email);
    if (!user || !user.is_active) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AuthenticationError('Invalid email or password');
    }

    const { accessToken, refreshToken, expiresAt } = this.generateTokens(user);
    await authRepository.saveRefreshToken(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async refreshToken(token) {
    let payload;
    try {
      payload = jwt.verify(token, env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const storedToken = await authRepository.findRefreshToken(token);
    if (!storedToken || storedToken.revoked_at || new Date() > new Date(storedToken.expires_at)) {
      throw new AuthenticationError('Refresh token is invalid, revoked, or expired');
    }

    const user = await authRepository.findUserById(payload.sub);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Refresh Token Rotation: Revoke current token and generate new tokens
    await authRepository.revokeRefreshToken(token);
    const { accessToken, refreshToken: newRefreshToken, expiresAt } = this.generateTokens(user);
    await authRepository.saveRefreshToken(user.id, newRefreshToken, expiresAt);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async logout(token) {
    if (token) {
      await authRepository.revokeRefreshToken(token);
    }
  },

  async getMe(userId) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  },
};
