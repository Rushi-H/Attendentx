export type LeaveType = 'CASUAL' | 'SICK' | 'PAID' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
  id: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
  reviewed_by?: string;
  reviewer_email?: string;
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
}
