import { api } from './api';
import { NetworkPolicy, Office } from '../types/auth';

export const settingsService = {
  async getNetworkPolicy(): Promise<NetworkPolicy & { client_observed_ip?: string }> {
    const res = await api.get('/settings/network/');
    return res.data.data;
  },

  async updateNetworkPolicy(data: {
    verification_mode?: string;
    allowed_ip_ranges?: string[];
    strict_mode_enabled?: boolean;
    reason?: string;
  }): Promise<NetworkPolicy> {
    const res = await api.patch('/settings/network/', data);
    return res.data.data;
  },

  async getOffices(): Promise<Office[]> {
    const res = await api.get('/offices/');
    return res.data.data || res.data.results || [];
  },

  async getHolidays(): Promise<any[]> {
    const res = await api.get('/offices/holidays/');
    return res.data.data || res.data.results || [];
  },
};
