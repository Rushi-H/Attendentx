import { api } from './api';
import { LeaveRequest } from '../types/leave';

export const leaveService = {
  async getLeaves(params?: { status?: string; leave_type?: string; page?: number }): Promise<any> {
    const res = await api.get('/leaves/', { params });
    return res.data;
  },

  async applyLeave(data: { leave_type: string; start_date: string; end_date: string; reason: string }): Promise<LeaveRequest> {
    const res = await api.post('/leaves/', data);
    return res.data.data;
  },

  async reviewLeave(id: string, status: 'APPROVED' | 'REJECTED', review_notes?: string): Promise<LeaveRequest> {
    const res = await api.patch(`/leaves/${id}/review/`, { status, review_notes });
    return res.data.data;
  },
};
