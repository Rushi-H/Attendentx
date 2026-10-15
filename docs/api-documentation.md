# REST API Specification (v1)

Base URL: `/api/v1`

Standard Response Structure:
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

Standard Error Structure:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error description",
    "details": {}
  }
}
```

---

## 1. Authentication Endpoints (`/api/v1/auth/`)

### `GET /auth/csrf/`
- **Description**: Returns CSRF cookie and token for session protection.
- **Access**: Public.
- **Response**: `{ "csrfToken": "..." }`

### `POST /auth/login/`
- **Description**: Authenticates user via email & password. Sets secure HttpOnly session cookie.
- **Request Body**:
  ```json
  {
    "email": "employee@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "id": "uuid",
    "email": "employee@example.com",
    "role": "EMPLOYEE",
    "employee_profile": {
      "id": "uuid",
      "employee_code": "EMP-1001",
      "full_name": "Jane Doe",
      "designation": "Software Engineer",
      "department": { "id": "uuid", "name": "Engineering" },
      "office": { "id": "uuid", "name": "Headquarters", "timezone": "Asia/Kolkata" }
    }
  }
  ```

### `POST /auth/logout/`
- **Description**: Invalidates session cookie.
- **Access**: Authenticated.

### `GET /auth/me/`
- **Description**: Returns current authenticated user and linked employee profile.
- **Access**: Authenticated.

### `POST /auth/change-password/`
- **Description**: Change user password with current password verification.
- **Request Body**: `{ "old_password": "...", "new_password": "..." }`

---

## 2. Attendance Endpoints (`/api/v1/attendance/`)

### `GET /attendance/eligibility/`
- **Description**: Real-time evaluation of network policy and attendance state for the authenticated employee.
- **Access**: Employee / Authenticated.
- **Response 200 OK**:
  ```json
  {
    "is_eligible": true,
    "can_check_in": true,
    "can_check_out": false,
    "current_status": "READY_TO_CHECK_IN",
    "network_verification": {
      "is_allowed": true,
      "verification_mode": "STRICT_IP_ALLOWLIST",
      "observed_ip": "223.236.99.39",
      "reason_code": "IP_MATCHED",
      "office_name": "Headquarters"
    },
    "today_record": null,
    "assigned_shift": {
      "name": "General Shift",
      "start_time": "09:30:00",
      "end_time": "18:30:00",
      "grace_minutes": 15
    },
    "server_time": "2026-10-14T09:25:00+05:30"
  }
  ```

### `POST /attendance/check-in/`
- **Description**: Marks check-in using authoritative server timestamp and verified source IP.
- **Access**: Employee.
- **Request Body**: `{ "notes": "Optional remark" }`
- **Response 201 Created**:
  ```json
  {
    "id": "uuid",
    "attendance_date": "2026-10-14",
    "check_in_at": "2026-10-14T09:35:12+05:30",
    "check_out_at": null,
    "attendance_status": "PRESENT",
    "verification_result": "ALLOWED"
  }
  ```
- **Error 403 Forbidden** (if out of network):
  ```json
  {
    "success": false,
    "error": {
      "code": "NETWORK_VERIFICATION_FAILED",
      "message": "Your current public IP (49.36.12.8) does not match the approved office network policy.",
      "observed_ip": "49.36.12.8"
    }
  }
  ```

### `POST /attendance/check-out/`
- **Description**: Marks check-out and computes official working duration in minutes.
- **Access**: Employee.
- **Response 200 OK**:
  ```json
  {
    "id": "uuid",
    "attendance_date": "2026-10-14",
    "check_in_at": "2026-10-14T09:35:12+05:30",
    "check_out_at": "2026-10-14T18:40:05+05:30",
    "working_minutes": 545,
    "attendance_status": "PRESENT"
  }
  ```

### `GET /attendance/today/`
- **Description**: Returns today's active attendance session and record for logged in user.

### `GET /attendance/history/`
- **Description**: Returns paginated attendance records for logged in employee, with optional `month` and `year` query parameters.

### `GET /attendance/admin/`
- **Description**: Admin view of all employee attendance records with search, date range, department, and status filters.
- **Access**: Admin / Super Admin.

### `PATCH /attendance/admin/{id}/`
- **Description**: Manual administrative correction with mandatory reason string and audit log creation.
- **Access**: Admin / Super Admin.
- **Request Body**:
  ```json
  {
    "check_in_at": "2026-10-14T09:30:00+05:30",
    "check_out_at": "2026-10-14T18:30:00+05:30",
    "attendance_status": "PRESENT",
    "correction_reason": "Employee had network switch failure in morning"
  }
  ```

---

## 3. Employee & Department Endpoints (`/api/v1/employees/`, `/api/v1/departments/`)

- `GET /departments/` — List all departments.
- `POST /departments/` — Create department (Admin).
- `PATCH /departments/{id}/` — Update department (Admin).
- `GET /employees/` — List all employees (Admin/HR view all, Employee view team directory).
- `POST /employees/` — Register new employee & user account (Admin/HR).
- `GET /employees/{id}/` — View profile details.
- `PATCH /employees/{id}/` — Update profile/department/status.
- `GET /employees/me/` — Current employee profile.

---

## 4. Shift & Leave Endpoints (`/api/v1/shifts/`, `/api/v1/leaves/`)

- `GET /shifts/` — List available shifts.
- `POST /shifts/` — Create shift (Admin).
- `PATCH /shifts/{id}/` — Update shift parameters (Admin).
- `POST /shifts/assign/` — Assign shift to employee.
- `GET /leaves/` — List leaves (filtered by current user if employee, all if admin).
- `POST /leaves/` — Submit leave request.
- `PATCH /leaves/{id}/review/` — Approve / reject leave request (Admin/HR).

---

## 5. Reports & Network Settings (`/api/v1/reports/`, `/api/v1/settings/`)

- `GET /reports/attendance/` — Daily / date-range attendance summary.
- `GET /reports/monthly/` — Monthly matrix report by employee.
- `GET /reports/late-arrivals/` — Late arrival analytics.
- `GET /reports/export/?format=csv` — Download CSV report.
- `GET /reports/export/?format=excel` — Download Excel report.
- `GET /settings/network/` — View office network verification policies (Admin).
- `PATCH /settings/network/` — Update approved IP allowlists and verification modes (Super Admin only).
- `GET /audit/logs/` — List immutable system audit trails (Super Admin only).
