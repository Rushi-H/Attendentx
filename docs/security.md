# Security Architecture & OWASP Compliance

## 1. Authentication & Session Security
- **Session-Based Authentication**: Uses Django's battle-tested session engine with cryptographically signed session cookies (`PBKDF2-SHA256` password hashing).
- **HttpOnly & SameSite Flags**: Session cookies are configured with `HttpOnly=True`, `SameSite=Lax` (or `None` for cross-site with SSL), and `Secure=True` in production.
- **CSRF Protection**: Native Django CSRF tokens delivered via cookie and required in `X-CSRFToken` header for state-changing HTTP verbs (`POST`, `PATCH`, `PUT`, `DELETE`).
- **No Token in LocalStorage**: Zero credentials or refresh tokens stored in `window.localStorage` to neutralize Cross-Site Scripting (XSS) credential theft.

## 2. Authorization & RBAC
- **Strict Role-Based Access Control**:
  - `SUPER_ADMIN`: Full administrative and system policy management.
  - `HR_ADMIN`: Employee records, shift assignments, leave approvals, attendance adjustments.
  - `EMPLOYEE`: Self-service attendance, personal history, own leave requests.
- **Object-Level Authorization**:
  - An employee can never submit check-in or view records for another employee.
  - Endpoint parameters cannot override the authenticated `request.user`.

## 3. Rate Limiting & Throttling
- Django REST Framework scoped rate limiters:
  - `anon`: 20 requests / minute (guards login endpoints against credential stuffing).
  - `user`: 120 requests / minute.
  - `attendance`: 10 requests / minute per employee to prevent replay or rapid spamming.

## 4. Race Condition & Concurrency Defense
- Check-in and check-out logic runs in a database transaction block:
  ```python
  with transaction.atomic():
      record = AttendanceRecord.objects.select_for_update().filter(...)
  ```
- PostgreSQL unique constraint on `(employee_id, attendance_date)` ensures idempotency and guarantees no duplicate check-ins even during concurrent double-clicks.

## 5. Audit Logging
- Every administrative change (role update, attendance time adjustment, network policy modification) creates an immutable `AuditLog` row including:
  - Actor ID and IP address.
  - Old state and new state JSON diff.
  - Mandatory justification reason.
