export interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  grace_minutes: number;
  minimum_work_minutes: number;
  weekly_off_days: number[];
  is_overnight: boolean;
  is_active: boolean;
  created_at: string;
}

export interface EmployeeShiftAssignment {
  id: string;
  employee: string;
  employee_name: string;
  shift: string;
  shift_name: string;
  effective_from: string;
  effective_to?: string | null;
  is_active: boolean;
}
