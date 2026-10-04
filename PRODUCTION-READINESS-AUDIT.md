# HostelDesk V5 — Production Readiness Audit

## Current baseline inspected
- Next.js 14.2.5
- React 18.3.1
- Local JSON database: `data/db.json`
- Session state stored in the JSON database
- Student/guest identity proofs are stored in application data rather than private object storage
- Multi-tenant filtering exists in API routes using `tenantId`
- Super Admin customer creation/listing exists

## Go-live blockers
1. **Database** — `data/db.json` must be replaced with PostgreSQL. A serverless deployment cannot safely use the local project filesystem as the primary mutable database.
2. **Document storage** — front/back identity proofs must move to private object storage with signed, short-lived access URLs. Do not expose public document URLs.
3. **Authentication** — replace demo SHA-256 password hashing with a password hashing scheme designed for passwords (Argon2id or bcrypt), add session expiry/rotation and login rate limiting.
4. **Secrets** — production WhatsApp token, database credentials and auth secrets must be environment variables only. Never commit `.env.local`.
5. **Tenant isolation** — keep tenant filtering at the server/database layer; never trust a tenant/customer ID sent by the browser.
6. **Audit/security** — record actor, tenant, action, timestamp and target for security-sensitive operations; add request validation and rate limits.
7. **Backups/recovery** — enable automated database backups and document restore procedure before real customer data is imported.
8. **WhatsApp** — production Cloud API credentials, approved templates and webhook/HTTPS configuration must be completed before unattended business-initiated messaging.
9. **Testing** — run a production build and a tenant-isolation test suite before opening access to customers.

## Recommended deployment shape
- Web: Next.js on Vercel or another Node.js host
- Database: managed PostgreSQL
- Documents: private object storage (S3-compatible)
- WhatsApp: Meta WhatsApp Cloud API
- Domain: HTTPS custom domain
- Android: mobile wrapper/client against the same production API after the web/API is stable

## Phase order
1. PostgreSQL migration + schema
2. Private proof storage
3. Production authentication/security
4. WhatsApp production integration
5. Web deployment + custom domain
6. Tenant/customer acceptance testing
7. Android app (AAB for Play Store; APK for direct testing)

## Important
This file is an audit, not a declaration that the current local build is production-ready. The local JSON/database and proof-storage blockers must be resolved before real customer data is used in production.
