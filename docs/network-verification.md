# Network Verification Architecture & Security Analysis

## 1. Executive Summary & Core Threat Model

The primary objective of the Network Verification module is to validate that an employee's attendance check-in originates from an authorized company office network.

In our deployment environment:
- **ISP**: Airtel AirFiber
- **Observed Candidate Public IPv4**: `223.236.99.39`
- **Router Admin Access**: Not currently accessible
- **Static IP Allocation**: Unconfirmed (AirFiber accounts frequently utilize Carrier-Grade NAT (CGNAT) or dynamic pool rotation)

---

## 2. Fundamental Security Risks of Public IP Allowlisting

### Risk 1: Non-Exclusivity and CGNAT Collisions
In CGNAT topologies commonly used by mobile networks and Fixed Wireless Access (FWA) services like Airtel AirFiber:
- Hundreds of distinct subscriber households or enterprises may share the same egress public IPv4 address (`223.236.99.39`).
- Matching this IP does **not** prove an individual is physically situated within the company office; anyone connected to the same CGNAT pool or base station segment might share the same public address.

### Risk 2: Dynamic Address Rotation
If the AirFiber link does not have a dedicated, leased static IP:
- Periodic router reboots, link renegotiations, or ISP lease expirations can rotate the public IP to a different subnet.
- Under strict mode, all legitimate employees would suddenly receive `IP_MISMATCH` rejections.
- **Mitigation**: Admin UI allows Super Admins to add CIDR ranges or quickly update the candidate IP, with an emergency `ADMIN_MANUAL_REVIEW` fallback mode that allows attendance to be submitted as `PENDING_REVIEW` without halting operations.

### Risk 3: Client-Side Spoofing & Header Tampering
An attacker or malicious employee attempting to mark attendance remotely might:
- Transmit fake headers: `X-Forwarded-For: 223.236.99.39`, `X-Real-IP: 223.236.99.39`, or `Client-IP: 223.236.99.39`.
- Attempt to manipulate browser geolocation or submit JavaScript-reported Wi-Fi SSIDs.
- **System Defense**:
  1. The backend **never** trusts client-reported IP addresses, client GPS, or client-reported SSIDs.
  2. The backend derives the client IP strictly via Django's trusted proxy configuration.
  3. Untrusted reverse proxy headers are ignored unless verified through a configured trusted proxy chain.
  4. If behind a trusted edge proxy (e.g., Render / Cloudflare / Nginx), only the rightmost untrusted hop in `X-Forwarded-For` is extracted based on `NUM_PROXIES` configuration.

---

## 3. Configurable Verification Modes

The `NetworkPolicy` entity supports four explicit modes:

1. **`STRICT_IP_ALLOWLIST`**:
   - The verified source IP must belong to one of the configured CIDR ranges or specific IP strings (e.g., `["223.236.99.39/32"]`).
   - If IP does not match, request is rejected with HTTP 403 `NETWORK_VERIFICATION_FAILED`.

2. **`ADMIN_MANUAL_REVIEW`**:
   - If the employee is off-network or the IP does not match, the attendance record is accepted with status `PENDING_REVIEW`.
   - The observed IP is recorded.
   - An administrator or HR manager must review and formally approve the record.

3. **`MANAGED_NETWORK_VERIFICATION`**:
   - Future-proof interface hook for local network controller integrations (e.g., UniFi API, Cisco Meraki, RADIUS 802.1X verification, or local gateway cryptographic tokens).

4. **`DEVELOPMENT_MOCK`**:
   - Allowed **strictly** when `DEBUG=True`.
   - Allows simulated IP headers for testing local setups.
   - Hardcoded protection: Throws runtime `SecurityException` if active in `DEBUG=False` production.

---

## 4. Fail-Closed Protocol

Under any of the following conditions, the attendance engine fails closed:
- No active `NetworkPolicy` exists for the employee's assigned office.
- The source IP cannot be reliably determined (missing socket address or malformed headers).
- Network verification service encounters an internal exception or database timeout.

Every verification check (success or failure) generates an immutable `AttendanceAttempt` record capturing:
- `employee_id`
- `office_id`
- `attempted_at`
- `action` (CHECK_IN, CHECK_OUT, ELIGIBILITY)
- `observed_ip`
- `verification_result` (ALLOWED, REJECTED, PENDING)
- `reason_code` (e.g., `IP_MATCHED`, `IP_MISMATCH`, `NO_POLICY`, `SERVICE_ERROR`)
