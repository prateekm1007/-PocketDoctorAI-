# PocketDoctor AI — V2 Production Package
**Date:** 2025-11-07

A consolidated, production-hardened package (Files 1–25) with **mobile app**, **secure API**, **CI/CD**, **autoscaling**, **monitoring**, and **disaster recovery**.

## Folder Structure
```
PocketDoctorAI-V2/
├─ app/                         # Expo client (minimal, points to API)
├─ server/                      # Node/Express API (production-hardened)
│  ├─ middleware/               # Security, logging, uploads, validation
│  ├─ config/                   # Firebase/Admin & env config
│  ├─ utils/                    # OCR and analyzer stubs
│  ├─ server.production.js      # Main server with security hardening
│  ├─ package.json
│  └─ .env.example
├─ firebase/                    # Firestore & Storage rules + indexes
├─ aws/                         # S3 lifecycle, ASG/ALB, CloudWatch
├─ docs/                        # Deployment + DR guides
├─ .github/workflows/           # CI/CD pipelines
└─ LICENSE
```

## Quick Start

### 1) Backend (API)
```bash
cd server
cp .env.example .env
npm ci
npm start
```
API runs on `http://localhost:3000` by default.

### 2) Frontend (Expo)
```bash
cd app
npm install
npm start
```
Press `w` for web or run on device/emulator. Set `EXPO_PUBLIC_API_BASE` in `app/.env` if not localhost.

## Key Capabilities
- Rate limiting (Redis optional), helmet, CORS, gzip, strict uploads (JPG/PNG/PDF, 10MB)
- PDF validation (size/pages/encrypted), request correlation + audit logs (Firest**ore**)†
- Disk fallback + S3 streaming uploads (OOM-safe), Sentry error tracking
- CI/CD (GitHub Actions) with tests, lint, health-check, Slack + Sentry notify, rollback
- Autoscaling (ALB + ASG), CloudWatch dashboards + alarms, S3 lifecycle & cost controls
- Disaster Recovery with RPO/RTO targets, Firestore export runbook

† Replace Firestore audit logging with your preferred data lake/SIEM for long-term retention.

## Environment Variables (server/.env.example)
See `server/.env.example` for full list. Use AWS **SSM/Secrets Manager** in production.

---

**Security Note:** This package ships with safe defaults, but you must review privacy logging, PHI handling, and secrets rotation before a public launch.
