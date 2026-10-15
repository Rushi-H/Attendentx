import { api } from './api';
import { Department, EmployeeProfile } from '../types/auth';
import { Shift, EmployeeShiftAssignment } from '../types/shift';

export const employeeService = {
  async getDepartments(): Promise<Department[]> {
    const res = await api.get('/departments/');
    return res.data.data || res.data.results || [];
  },

  async createDepartment(data: { name: string; description?: string }): Promise<Department> {
    const res = await api.post('/departments/', data);
    return res.data.data;
  },

  async getEmployees(params?: { department?: string; employment_status?: string; search?: string; page?: number }): Promise<any> {
    const res = await api.get('/employees/', { params });
    return res.data;
  },

  async getMyProfile(): Promise<EmployeeProfile> {
    const res = await api.get('/employees/me/');
    return res.data.data;
  },

  async createEmployee(data: any): Promise<EmployeeProfile> {
    const res = await api.post('/employees/', data);
    return res.data.data;
  },

  async updateEmployee(id: string, data: Partial<EmployeeProfile>): Promise<EmployeeProfile> {
    const res = await api.patch(`/employees/${id}/`, data);
    return res.data.data;
  },

  async getShifts(): Promise<Shift[]> {
    const res = await api.get('/shifts/');
    return res.data.data || res.data.results || [];
  },

  async createShift(data: Partial<Shift>): Promise<Shift> {
    const res = await api.post('/shifts/', data);
    return res.data.data;
  },

  async updateShift(id: string, data: Partial<Shift>): Promise<Shift> {
    const res = await api.patch(`/shifts/${id}/`, data);
    return res.data.data;
  },

  async assignShift(employeeId: string, shiftId: string, effectiveFrom: string): Promise<EmployeeShiftAssignment> {
    const res = await api.post('/shifts/assign/', {
      employee: employeeId,
      shift: shiftId,
      effective_from: effectiveFrom,
    });
    return res.data.data;
  },
};
