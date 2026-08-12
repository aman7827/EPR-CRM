import bcrypt from 'bcryptjs';
import { usersRepository } from './users.repository.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';

export const usersService = {
  async listUsers(pagination, search) {
    return usersRepository.findAll({ ...pagination, search });
  },

  async getUser(id) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  },

  async createUser({ name, email, password, role }) {
    const existing = await usersRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    return usersRepository.create({ name, email, passwordHash, role });
  },

  async updateUser(id, data) {
    const existing = await usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    if (data.email && data.email !== existing.email) {
      const emailCheck = await usersRepository.findByEmail(data.email);
      if (emailCheck) {
        throw new ConflictError('Email is already taken by another user');
      }
    }

    const fieldsToUpdate = { ...data };
    if (data.password) {
      fieldsToUpdate.password_hash = await bcrypt.hash(data.password, 10);
      delete fieldsToUpdate.password;
    }

    return usersRepository.update(id, fieldsToUpdate);
  },

  async deleteUser(id) {
    const deleted = await usersRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('User not found');
    }
    return deleted;
  },
};
