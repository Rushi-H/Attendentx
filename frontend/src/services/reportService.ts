import { api, API_BASE_URL } from './api';
import { SummaryReportResponse, MonthlyEmployeeStat, AuditLogItem } from '../types/report';

export const reportService = {
  async getSummary(date?: string): Promise<SummaryReportResponse> {
    const res = await api.get('/reports/attendance/', { params: { date } });
    return res.data.data;
  },

  async getMonthlyMatrix(month?: number, year?: number): Promise<{ month: number; year: number; employees: MonthlyEmployeeStat[] }> {
    const res = await api.get('/reports/monthly/', { params: { month, year } });
    return res.data.data;
  },

  async getLateArrivals(days?: number): Promise<any[]> {
    const res = await api.get('/reports/late-arrivals/', { params: { days } });
    return res.data.data;
  },

  getExportUrl(format: 'csv' | 'excel', startDate?: string, endDate?: string): string {
    const params = new URLSearchParams({ format });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return `${API_BASE_URL}/reports/export/?${params.toString()}`;
  },

  async getAuditLogs(params?: { action?: string; entity_type?: string; search?: string; page?: number }): Promise<any> {
    const res = await api.get('/audit/logs/', { params });
    return res.data;
  },
};
