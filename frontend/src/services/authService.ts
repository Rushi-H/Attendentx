import { api, initializeCsrf } from './api';
import { User } from '../types/auth';

export const authService = {
  async getCsrf() {
    return await initializeCsrf();
  },

  async login(email: string, password: string):Promise<User> {
    // Ensure CSRF cookie is initialized before posting credentials
    await initializeCsrf();
    const response = await api.post('/auth/login/', { email, password });
    return response.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout/');
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me/');
    return response.data.data;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },
};
