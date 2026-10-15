# Deployment & Operations Guide

## 1. Production Architecture Overview

- **Frontend**: Deployed to Vercel (static asset CDN with client-side routing fallback).
- **Backend**: Deployed to Render / AWS ECS / DigitalOcean App Platform (Gunicorn / Uvicorn ASGI).
- **Database**: Managed PostgreSQL 15+ (e.g., Render Managed PostgreSQL, Supabase, AWS RDS).

---

## 2. Environment Variables Specification

### Backend Variables (`backend/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DJANGO_SECRET_KEY` | High-entropy secret key | `super-secret-key-32-chars-min` |
| `DJANGO_DEBUG` | Debug mode (must be False in prod) | `False` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed domain hosts | `api.attendance.company.com,localhost` |
| `DATABASE_URL` | PostgreSQL connection URI | `postgresql://user:pass@host:5432/dbname` |
| `CORS_ALLOWED_ORIGINS` | Permitted frontend origins | `https://attendance.company.com` |
| `CSRF_TRUSTED_ORIGINS` | Trusted origins for CSRF POST requests | `https://attendance.company.com` |
| `NUM_PROXIES` | Number of trusted reverse proxy layers | `1` |
| `DEFAULT_OFFICE_IP` | Seed public IP for primary office | `223.236.99.39` |

### Frontend Variables (`frontend/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base API URL | `https://api.attendance.company.com/api/v1` |

---

## 3. Database Migration & Bootstrap Execution

1. Run standard migrations:
   ```bash
   python manage.py migrate
   ```
2. Seed initial office, shifts, and superuser:
   ```bash
   python manage.py bootstrap_system --super-email admin@company.com --password AdminSecurePassword123!
   ```

---

## 4. Reverse Proxy Setup (NGINX / Edge Proxy)

Example NGINX snippet for forwarding client IP reliably:
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
*Note: In Render or Cloudflare, ensure `NUM_PROXIES` is set correctly to pick the external edge address.*
