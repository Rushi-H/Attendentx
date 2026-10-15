export type AttendanceStatusType =
  | 'PRESENT'
  | 'LATE'
  | 'ABSENT'
  | 'HALF_DAY'
  | 'ON_LEAVE'
  | 'HOLIDAY'
  | 'WEEKLY_OFF'
  | 'PENDING_REVIEW'
  | 'MANUALLY_ADJUSTED';

export interface AttendanceRecord {
  id: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  department_name?: string;
  attendance_date: string;
  check_in_at: string;
  check_out_at?: string | null;
  attendance_status: AttendanceStatusType;
  working_minutes: number;
  verification_method: string;
  verification_result: string;
  check_in_ip?: string;
  check_out_ip?: string;
  is_manual_correction: boolean;
  correction_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface NetworkVerificationData {
  is_allowed: boolean;
  verification_mode: string;
  reason_code: string;
  observed_ip: string;
  policy_id?: string;
  office_name?: string;
  requires_review?: boolean;
  verified_at: string;
}

export interface AttendanceEligibility {
  is_eligible: boolean;
  can_check_in: boolean;
  can_check_out: boolean;
  current_status: string;
  network_verification: NetworkVerificationData;
  today_record?: {
    id: string;
    attendance_date: string;
    check_in_at: string;
    check_out_at?: string | null;
    working_minutes: number;
    status: AttendanceStatusType;
  } | null;
  assigned_shift?: {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    grace_minutes: number;
    minimum_work_minutes: number;
  } | null;
  server_time: string;
  server_date: string;
}

export interface AttendanceAttempt {
  id: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  office_name: string;
  attempted_at: string;
  action: 'CHECK_IN' | 'CHECK_OUT' | 'ELIGIBILITY';
  observed_ip: string;
  verification_result: string;
  reason_code: string;
  notes?: string;
}
