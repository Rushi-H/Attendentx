export type UserRole = 'SUPER_ADMIN' | 'HR_ADMIN' | 'EMPLOYEE';

export interface Office {
  id: string;
  name: string;
  timezone: string;
  address?: string;
  is_active: boolean;
  network_policy?: NetworkPolicy;
}

export interface NetworkPolicy {
  id: string;
  office: string;
  verification_mode: 'STRICT_IP_ALLOWLIST' | 'MANAGED_NETWORK_VERIFICATION' | 'DEVELOPMENT_MOCK' | 'ADMIN_MANUAL_REVIEW';
  allowed_ip_ranges: string[];
  strict_mode_enabled: boolean;
  is_active: boolean;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  employee_count?: number;
}

export interface EmployeeProfile {
  id: string;
  user_id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string;
  department?: Department | null;
  department_name?: string;
  office?: Office | null;
  office_name?: string;
  designation?: string;
  joining_date?: string;
  employment_status: 'ACTIVE' | 'PROBATION' | 'SUSPENDED' | 'RESIGNED';
  assigned_shift?: {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    grace_minutes: number;
    minimum_work_minutes: number;
    is_overnight: boolean;
  } | null;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
  employee_profile?: EmployeeProfile;
}
