export interface AttendanceKPIs {
  total_employees: number;
  present_today: number;
  late_today: number;
  half_day_today: number;
  absent_today: number;
  on_leave_today: number;
  pending_reviews: number;
  attendance_rate: number;
}

export interface RecentCheckIn {
  id: string;
  employee_name: string;
  employee_code: string;
  department: string;
  check_in_at: string | null;
  status: string;
  ip_verified: boolean;
}

export interface SummaryReportResponse {
  date: string;
  kpis: AttendanceKPIs;
  recent_check_ins: RecentCheckIn[];
}

export interface MonthlyEmployeeStat {
  employee_id: string;
  employee_code: string;
  full_name: string;
  department: string;
  present_days: number;
  late_days: number;
  half_days: number;
}

export interface AuditLogItem {
  id: string;
  actor: string | null;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  reason: string;
  ip_address: string | null;
  created_at: string;
}
