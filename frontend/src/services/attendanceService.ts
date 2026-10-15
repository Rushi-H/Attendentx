import { api } from './api';
import { AttendanceEligibility, AttendanceRecord, AttendanceAttempt } from '../types/attendance';

export const attendanceService = {
  async getEligibility(): Promise<AttendanceEligibility> {
    const res = await api.get('/attendance/eligibility/');
    return res.data.data;
  },

  async checkIn(notes?: string): Promise<AttendanceRecord> {
    const res = await api.post('/attendance/check-in/', { notes });
    return res.data.data;
  },

  async checkOut(notes?: string): Promise<AttendanceRecord> {
    const res = await api.post('/attendance/check-out/', { notes });
    return res.data.data;
  },

  async getTodayAttendance(): Promise<AttendanceRecord | null> {
    const res = await api.get('/attendance/today/');
    return res.data.data;
  },

  async getHistory(params?: { month?: number; year?: number; page?: number }): Promise<any> {
    const res = await api.get('/attendance/history/', { params });
    return res.data;
  },

  async getAdminAttendance(params?: {
    start_date?: string;
    end_date?: string;
    attendance_date?: string;
    attendance_status?: string;
    department?: string;
    search?: string;
    page?: number;
  }): Promise<any> {
    const res = await api.get('/attendance/admin/', { params });
    return res.data;
  },

  async correctAttendance(
    id: string,
    payload: {
      check_in_at?: string;
      check_out_at?: string | null;
      attendance_status?: string;
      correction_reason: string;
    }
  ): Promise<AttendanceRecord> {
    const res = await api.patch(`/attendance/admin/${id}/`, payload);
    return res.data.data;
  },

  async getAttempts(): Promise<AttendanceAttempt[]> {
    const res = await api.get('/attendance/attempts/');
    return res.data.data || res.data.results || [];
  },
};
