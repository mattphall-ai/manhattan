# Backend Requirements — Production Estimator Pro

## 1. Purpose

The app currently runs entirely client-side: every estimate lives in one browser's `localStorage` (see `src/App.tsx`, key `production-project-estimates-v5`), rate cards are hardcoded in `src/types.ts`, and nothing is shared between users or devices. This document defines the requirements for a backend that replaces local persistence with a centralized, multi-user service behind SSO.

Goals:
- Any authorized user can open the app from any device and see the same estimates.
- Multiple estimators can work across the same set of projects without overwriting each other silently.
- Access is controlled by company identity (SSO), not an open/anonymous app.
- Estimate data and rate cards — both commercially sensitive — are protected in transit, at rest, and by access control.

Non-goals (v1): real-time co-editing of a single estimate (Google-Docs-style live cursors), public/anonymous sharing, mobile apps.

## 2. Domain model (carried over from the current client types)

The backend's schema should be a direct, faithful mapping of `src/types.ts` plus the multi-user concepts layered on top:

| Entity | Source | Notes |
|---|---|---|
| `Organization` | new | Tenant boundary. Every other entity belongs to exactly one org. |
| `User` | new | Identity comes from SSO (§4); no local password accounts. |
| `Membership` | new | User ↔ Organization, carries a `Role` (§5). |
| `RateCard` entry | `RoleRate` in `types.ts` | Role name, department, per-client rate. Currently a hardcoded constant — becomes an org-scoped, editable table. |
| `Project` (estimate) | `Project` in `types.ts` | `details`, `phases`, `oopCosts`, `notes`, `versionNotes`, `contingencyPercent`, `estimateNumber` / `baseEstimateNumber`, timestamps. |
| `CustomPhase` | `types.ts` | Ordered list of `{ roleId, hours }`, belongs to a `Project`. |
| `OopCost` | `types.ts` | Out-of-pocket line item, belongs to a `Project`. |
| `AuditEvent` | new | Append-only record of who changed what on a `Project` or `RateCard`, and when. |

`baseEstimateNumber` / `estimateNumber` versioning and the existing Clone/Duplicate flow (`handleDuplicateProject` in `App.tsx`) must keep working — the backend should assign these server-side to avoid collisions across concurrent users, instead of the current client-side "scan all loaded projects and increment" logic.

## 3. Multi-user data access

- **Tenancy**: single-organization-per-tenant model. All `Project` and `RateCard` rows are scoped to an `Organization`; a user only ever sees their org's data. (If this tool is meant to be used across multiple agencies/business units as separate tenants, that maps directly to one `Organization` each — flag if that's not the intent.)
- **Shared visibility within an org**: any member of an org can see all of that org's projects by default, matching the current single-user experience where every estimate in storage is visible. If certain estimates need to be restricted to their creator or a subset of users, that's a v2 permission model — call it out explicitly if needed now.
- **Concurrency**: two users editing the same estimate is possible and must not silently corrupt data.
  - Minimum bar: optimistic concurrency — every write includes the `updatedAt` (or a numeric version) the client last saw; the server rejects a write with a 409 if it's stale, and the client reloads and re-applies or prompts the user.
  - The existing "Cloud Sync: Active" indicator in the footer (`App.tsx`) implies users already expect live/near-live sync — polling or a lightweight subscription (SSE/WebSocket) to refresh the active project when another user changes it is in scope for v1 if feasible, but hard real-time collaborative editing (per-keystroke merge) is not.
- **Soft delete**: `handleDeleteProject` / `handleDeletePhase` currently hard-delete. The backend should soft-delete (retain for audit/recovery, e.g. 30 days) rather than physically remove rows immediately.

## 4. Authentication — SSO

- Support enterprise SSO via **OpenID Connect** (primary) and **SAML 2.0** (for IdPs that only offer SAML), so it can integrate with whatever the organization already runs (Okta, Microsoft Entra ID / Azure AD, Google Workspace, etc.) rather than assuming one provider.
- **Just-in-time (JIT) provisioning**: first successful SSO login creates the `User` and `Membership` records; no separate manual account-creation step required.
- No local username/password accounts and no "forgot password" flow — identity is entirely delegated to the IdP.
- Session handling: short-lived access token + refresh, server-side session invalidation on logout and on admin-initiated "revoke session."
- Optional, flag for later: **SCIM** provisioning/de-provisioning so removing a user in the IdP automatically revokes app access, and group-to-role mapping from the IdP.
- Open question: which IdP(s) must be supported at launch, and is SCIM (automatic de-provisioning) a v1 requirement or acceptable to defer?

## 5. Authorization (roles)

Minimum role set, evaluated per-organization membership:

| Role | Can do |
|---|---|
| **Admin** | Everything below, plus manage rate cards, manage org members/roles, view audit log |
| **Estimator** | Create/edit/duplicate/delete their org's projects, phases, OOP costs; read rate cards |
| **Viewer** | Read-only access to projects (e.g. for a business manager or client-facing reviewer who shouldn't edit numbers) |

All authorization checks happen server-side on every request — the current app has zero access control since it's a single local user, so this is new surface area, not a port of existing logic.

## 6. API surface

A REST (or GraphQL — pick one, not both) API replacing the current in-memory `projects` state and `localStorage` calls in `App.tsx`. Every handler in `App.tsx` (`handleDetailsChange`, `handleAddPhase`, `handleHoursChange`, `handleAddOopCost`, etc.) currently mutates local state and writes the whole projects array back to `localStorage`; the backend should expose equivalent scoped operations instead of "rewrite the whole blob," e.g.:

- `GET /projects` — list org's estimates (summary fields only; avoid shipping every phase/role for a list view)
- `GET /projects/:id` — full estimate detail
- `POST /projects` — create (server assigns id + estimate numbers)
- `PATCH /projects/:id` — partial update (details, notes, contingencyPercent) with optimistic-concurrency check
- `POST /projects/:id/duplicate` — clone with next version suffix, assigned server-side
- `DELETE /projects/:id` — soft delete
- `POST /projects/:id/phases`, `PATCH /projects/:id/phases/:phaseId`, `DELETE /projects/:id/phases/:phaseId`
- `POST /projects/:id/phases/:phaseId/roles`, `PATCH .../roles/:roleId`, `DELETE .../roles/:roleId`
- `POST /projects/:id/oop-costs`, `PATCH .../oop-costs/:id`, `DELETE .../oop-costs/:id`
- `GET /rate-card`, `PATCH /rate-card/:roleId` (Admin only)
- `GET /projects/:id/audit` (Admin only)
- Import path: the app already has "Import" / "Backup JSON" in `ProjectSelector` — keep a bulk-import endpoint so a user's existing `localStorage` export can be migrated into the backend once (§9).

## 7. Data security

- **Transport**: TLS 1.2+ everywhere; no plaintext HTTP endpoint, including internal service-to-service calls.
- **At rest**: database-level encryption at rest; encrypted backups.
- **Secrets**: IdP client secrets, DB credentials, and signing keys live in a secrets manager / KMS, never in source control or plain environment files committed to the repo (the current `.env.example` pattern is fine for local dev placeholders only).
- **Least privilege**: application DB role should not have superuser/DDL rights at runtime; separate migration credentials from application credentials.
- **Input validation**: server-side validation on every write (numeric hours/rates, enum checks on `Client`/`Department`, string length limits) — the current app trusts the client entirely, which is unacceptable once untrusted multi-tenant traffic is possible.
- **Audit logging**: every create/update/delete on a `Project`, `RateCard`, or `Membership` recorded with actor, timestamp, before/after (or diff), matching the `AuditEvent` entity in §2.
- **Rate limiting / abuse protection** on the API layer.
- **Dependency hygiene**: automated vulnerability scanning on backend dependencies (the frontend already carries `@google/genai`, `express`, `dotenv` as unused leftovers from the AI Studio scaffold — don't carry that pattern into the backend; only add dependencies actually used).
- **Backups & recovery**: define RPO/RTO (e.g. RPO ≤ 1 hour, RTO ≤ 4 hours as a starting point — confirm with stakeholders) and test restore procedure periodically.
- **Data classification**: rate cards and client-specific pricing are the most sensitive data in this system (competitive/commercial harm if leaked) — treat them as at least as sensitive as customer PII even though there's no traditional PII beyond preparer/business-manager names.
- Open question: any compliance target (SOC 2, ISO 27001) driving these requirements, or is this internal-tool-grade security sufficient for now?

## 8. Non-functional requirements

- **Availability**: define a target (e.g. 99.5% for an internal tool is usually enough; call out if this needs to be customer-facing/higher).
- **Performance**: typical CRUD operations should complete well under 500ms; project list/detail reads should stay fast as the number of estimates grows into the thousands.
- **Environments**: separate dev/staging/prod with independent databases; migrations run through CI, not manually.
- **Observability**: structured logging, error tracking, and basic metrics (request latency/error rate) from day one.
- **API documentation**: OpenAPI (or GraphQL schema) kept current so the frontend team isn't reverse-engineering the backend.

## 9. Migration path from the current client-only app

1. Ship the backend + auth first, frontend points at it instead of `localStorage`.
2. Keep the existing "Backup JSON" export in the UI as the escape hatch: a user with estimates trapped in browser `localStorage` exports them and re-imports through the new bulk-import endpoint into their org.
3. Rate card becomes admin-editable data instead of the hardcoded `RATE_CARD` constant in `types.ts` — seed it from the current constant on first deploy per org.

## 10. Open questions for stakeholders

- Single organization, or does this need to support multiple separate agencies/tenants from day one?
- Which identity provider(s) must work at launch?
- Is per-estimate restricted visibility (not everyone in the org sees every estimate) needed now or later?
- Any regulatory/compliance driver (SOC 2, client contractual requirements) that sets hard requirements rather than best-practice defaults?
- Expected scale: rough number of users and estimates in year one, to size availability/performance targets realistically.
