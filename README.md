# Office Attendance Management System

A production-ready, database-driven **Office Attendance Management System** built with **Django REST Framework** and **React 18 + TypeScript + Tailwind CSS**, featuring server-side office network verification, one-tap check-in/out, shift & grace period tracking, leave approvals, audit logging, and reporting.

---

## 1. System Overview & Architecture

### Core Architecture
- **Backend**: Modular monolith in Python / Django REST Framework with apps:
  - `accounts`: Custom User model, session auth, CSRF tokens, role-based access.
  - `offices`: Office management, network security policies, holiday calendar.
  - `employees`: Employee profiles, department directories.
  - `shifts`: Work shifts, grace periods, overnight shifts, employee assignments.
  - `attendance`: Concurrency-safe atomic check-in/out engine, telemetry logging.
  - `leaves`: Time-off applications and administrative review workflows.
  - `reports`: Daily/monthly KPI aggregation, punctuality metrics, CSV/Excel export.
  - `audit`: Immutable audit trail for administrative changes.
- **Frontend**: React 18 Single Page Application with TypeScript:
  - **Styling**: Tailwind CSS with custom corporate design tokens (Royal Blue palette `#2563EB`).
  - **State & Caching**: TanStack Query (React Query v5) with live polling.
  - **Forms & Validation**: React Hook Form + Zod.
  - **Visualization**: Recharts for daily status distribution and trend tracking.
  - **Icons**: Lucide React.
  - **Security**: HttpOnly session cookies, CSRF protection, and zero tokens stored in localStorage.

---

## 2. Office Network Verification Module

### Candidate Office Public IPv4: `223.236.99.39` (Airtel AirFiber)
- The candidate public IP is configured in the database via `NetworkPolicy` models and is never hardcoded.
- **Reverse Proxy Protection**: Client source IPs are derived through configured reverse proxy depth (`NUM_PROXIES`), neutralizing spoofed `X-Forwarded-For` and `Client-IP` headers.
- **Fail-Closed Design**: If an office lacks an active policy or an IP cannot be verified, attendance is rejected with HTTP 403 `NETWORK_VERIFICATION_FAILED`.

### Important Limitation & Security Notice
Airtel AirFiber operates over Fixed Wireless Access (FWA) with Carrier-Grade NAT (CGNAT) or dynamic IP pools:
1. Public-IP allowlisting enforces an external perimeter gate, but **does not guarantee physical presence** inside the office.
2. In the event of dynamic IP pool rotation, Super Admins can update the candidate CIDR range or switch the policy to `ADMIN_MANUAL_REVIEW` mode, which records check-in as `PENDING_REVIEW` for supervisor signoff.

---

## 3. Quickstart & Local Setup

### Prerequisites
- Python 3.10+ (tested with Python 3.14)
- Node.js 18+ (tested with Node.js 24)
- PostgreSQL 15+ (or SQLite fallback for quick testing)

### Step 1: Backend Setup
```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed database with demo office, shifts, and accounts
python manage.py bootstrap_system
```

### Step 2: Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Or start development server
npm run dev
```

The frontend will start at `http://127.0.0.1:5173/` and proxies `/api` calls to Django at `http://127.0.0.1:8000/`.

---

## 4. Docker Containerized Deployment

To spin up the entire system (PostgreSQL 16, Django Backend with Gunicorn, and React Frontend with NGINX) using a single command:

```bash
docker compose up --build -d
```

- **Frontend Application**: `http://localhost/` (Port 80)
- **Backend REST API**: `http://localhost:8000/api/v1/`
- **PostgreSQL Database**: `localhost:5432`

---

## 5. Default Demo Accounts

| Role | Email | Password | Access / Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@company.com` | `AdminPassword123!` | Full system control, network security policy, audit logs, reports |
| **HR Admin** | `hr@company.com` | `HrPassword123!` | Employee directory, shift assignments, leave approvals, attendance adjustments |
| **Employee** | `employee@company.com` | `EmpPassword123!` | Self-service one-tap check-in/out, history, personal profile, leave application |

*Note: The login page includes quick-fill buttons for instant demo access.*

---

## 6. Automated Testing

### Backend Automated Test Suite (Pytest)
Run the 37 automated backend tests across all domain applications:
```bash
cd backend
.\.venv\Scripts\python.exe -m pytest -v
```

### Test Coverage Highlights (37/37 Passed in 58s):
- `tests/test_auth.py` (10 tests): CSRF initialization, session login, invalid password rejection, deactivated account rejection, `/me` profile retrieval, unauthenticated rejection, password update, cryptographically signed password reset workflow, status toggle permissions.
- `tests/test_network.py` (6 tests): IP allowlist matching (`223.236.99.39`), unapproved IP rejection, reverse-proxy spoofing defense (`NUM_PROXIES`), trusted proxy extraction, fail-closed policy enforcement, admin manual review mode.
- `tests/test_attendance.py` (7 tests): Atomic check-in, duplicate check-in prevention, unapproved IP check-in rejection, check-out workflow with working minutes calculation, check-out without check-in rejection, admin manual correction with mandatory audit reason, employee correction rejection.
- `tests/test_phase4_operations.py` (6 tests): Branch office creation with auto-provisioned policy, employee office creation rejection, Super Admin network policy CIDR update with client IP diagnostics, shift creation and employee assignment rotation, leave application and approval workflow, leave visibility isolation.
- `tests/test_reports.py` (8 tests): Attendance summary KPIs, employee report access rejection, streaming CSV export, styled Excel (`openpyxl`) export, monthly matrix report, late arrivals report, Super Admin audit log access, employee audit log access rejection.

---

## 6. API Documentation

Comprehensive REST API specifications are documented in [`docs/api-documentation.md`](docs/api-documentation.md).
Key endpoint groups:
- `/api/v1/auth/` (CSRF, Login, Logout, Me, Password change)
- `/api/v1/attendance/` (Eligibility, Check-In, Check-Out, Today, History, Admin list & correction)
- `/api/v1/employees/` (Directory, Profile, Create)
- `/api/v1/departments/` (List, Create)
- `/api/v1/shifts/` (List, Create, Assign)
- `/api/v1/leaves/` (Apply, List, Review)
- `/api/v1/reports/` (Summary KPIs, Monthly matrix, Late arrivals, CSV & Excel export)
- `/api/v1/settings/network/` (Network policy management)
- `/api/v1/audit/logs/` (Compliance audit trail)

---

## 7. Security & Compliance
- Refer to [`docs/security.md`](docs/security.md) for details on OWASP compliance, rate limiting, and session security.
- Refer to [`docs/network-verification.md`](docs/network-verification.md) for the complete threat model and Airtel AirFiber analysis.
- Refer to [`docs/deployment.md`](docs/deployment.md) for production hosting on Render/Vercel/PostgreSQL.
