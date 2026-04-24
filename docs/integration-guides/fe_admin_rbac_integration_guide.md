# Frontend Integration Guide — Platform Admin RBAC

> **Version**: 1.0 · **Backend**: PaySwitch Credit Scoring API
> Companion to [`fe_rbac_integration_guide.md`](./fe_rbac_integration_guide.md) (org-side RBAC) and [`fe_monitoring_integration_guide.md`](./fe_monitoring_integration_guide.md) (admin dashboards).

---

## Overview

The platform side now runs the same Role-Based Access Control model as the org side. Every platform admin is assigned exactly **one** platform-scoped role; each role grants a fixed set of permission codes; every admin endpoint (`/admin/*`, `/v1/monitoring/*`) gates on a specific code.

### System platform roles

Five roles are seeded at startup and cannot be deleted or edited. They correspond 1:1 to the client's four role-specific dashboards plus a break-glass tier.

| Role | Persona | Dashboard(s) | # Perms |
|---|---|---|---|
| `SUPER_ADMIN` | Platform owner / break-glass | All | 27 |
| `RISK_ANALYST` | Portfolio / risk officer | Risk | 5 |
| `MODEL_OPS_ENGINEER` | Data science / ML engineering | ModelOps | 9 |
| `COMPLIANCE_OFFICER` | Compliance / audit | Compliance (+ Risk read-only) | 5 |
| `INFRASTRUCTURE_ENGINEER` | SRE / infrastructure | Infrastructure | 5 |

Custom platform roles can also be created through `POST /v1/roles` (requires `admin.roles.manage`) — they can mix and match any platform-scoped permissions. Only system roles are protected; custom roles are editable by any caller with `admin.roles.manage`.

---

## Authentication

All endpoints below require a **platform admin JWT** (`user_type: "admin"`). Get one via `POST /auth/login` with an admin email + password. Sessions and refresh flow are identical to the org side.

```http
Authorization: Bearer <admin-jwt>
```

> The legacy `role` claim on the admin JWT (e.g. `"super_admin"`) is **display-only** and retained for backwards compatibility. The authoritative permission set comes from the assigned platform RBAC role — always call `GET /auth/me/permissions` after login to know what the UI can render.

---

## Error shapes

```json
// 401 — bad or missing JWT
{ "error": { "code": "AUTHENTICATION_ERROR", "message": "...", "details": {} } }

// 403 — authenticated but missing the required permission
{ "error": { "code": "AUTHORIZATION_ERROR", "message": "Permission required: admin.admins.invite", "details": {} } }

// 404 — admin / role id not found
{ "error": { "code": "NOT_FOUND", "message": "Admin with id '...' not found", "details": {} } }

// 409 — conflict (duplicate email, last-SUPER_ADMIN guard, self-suspend, wrong status)
{ "error": { "code": "CONFLICT", "message": "Cannot remove this admin: this is the last active SUPER_ADMIN. Promote another admin to SUPER_ADMIN first.", "details": {} } }

// 422 — validation (missing required field, bad role_id shape, …)
{ "detail": [ { "loc": ["body", "email"], "msg": "...", "type": "..." } ] }
```

---

## Endpoints

Base path: `/admin/admins`

### 1. `POST /admin/admins` — Invite a new admin

**Permission:** `admin.admins.invite`

Creates an ACTIVE admin row, assigns the requested RBAC role, hashes a generated temp password and emails it to the invitee via the existing invite template.

**Request body:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string (email) | ✅ | |
| `name` | string (≤ 200) | ✅ | |
| `role_id` | UUID | ❌ | Defaults to system SUPER_ADMIN when omitted |
| `callback_url` | string | ❌ | Landing page for the login button in the email |

```json
// POST /admin/admins
{
  "email": "kofi.ansah@payswitch.com",
  "name": "Kofi Ansah",
  "role_id": "79f5f85c-8b97-4bda-82f2-37ce45a9718e",
  "callback_url": "https://admin.payswitch.com/login"
}
```

**Response `201`:**

```json
{
  "id": "4589102b-15ef-47ea-bd1f-7f3a4f0b8b4d",
  "email": "kofi.ansah@payswitch.com",
  "name": "Kofi Ansah",
  "status": "active",
  "role_id": "79f5f85c-8b97-4bda-82f2-37ce45a9718e",
  "role_name": "RISK_ANALYST",
  "last_login_at": null,
  "created_at": "2026-04-23T22:58:17.902Z"
}
```

**Errors:**

| Code | When |
|---|---|
| `403 AUTHORIZATION_ERROR` | caller lacks `admin.admins.invite` |
| `404 NOT_FOUND` | `role_id` doesn't exist |
| `422 VALIDATION_ERROR` | `role_id` is non-platform scope |
| `409 CONFLICT` | an admin with that email already exists |

---

### 2. `GET /admin/admins` — List admins

**Permission:** `admin.admins.list`

**Query params:**

| Param | Type | Default | Range |
|---|---|---|---|
| `page` | int | 1 | ≥ 1 |
| `per_page` | int | 20 | 1–100 |

**Response `200`:**

```json
{
  "items": [
    {
      "id": "4589102b-15ef-47ea-bd1f-7f3a4f0b8b4d",
      "email": "kofi.ansah@payswitch.com",
      "name": "Kofi Ansah",
      "status": "active",
      "role_id": "79f5f85c-8b97-4bda-82f2-37ce45a9718e",
      "role_name": "RISK_ANALYST",
      "last_login_at": "2026-04-22T09:40:00Z",
      "created_at": "2026-04-20T12:00:00Z"
    }
  ],
  "total": 3,
  "page": 1,
  "per_page": 20,
  "total_pages": 1
}
```

Deactivated admins and admins with no role (after a soft delete) are included — filter client-side if needed.

---

### 3. `GET /admin/admins/{id}` — Admin detail

**Permission:** `admin.admins.read`

Returns the same shape as a list item. `404` if the id doesn't exist.

---

### 4. `PATCH /admin/admins/{id}` — Update name / reassign role

**Permission:** `admin.admins.update`

**Request body** (all fields optional; send only what you change):

| Field | Type | Notes |
|---|---|---|
| `name` | string (≤ 200) | |
| `role_id` | UUID | Must be a platform-scoped role |

```json
// PATCH /admin/admins/4589102b-15ef-47ea-bd1f-7f3a4f0b8b4d
{ "role_id": "e07af6da-4589-46b1-a7d3-e9046643eced" }
```

**Response `200`:** updated admin detail object.

**Errors:**

| Code | When |
|---|---|
| `404 NOT_FOUND` | admin id or role_id missing |
| `422 VALIDATION_ERROR` | role is not platform-scoped |
| `409 CONFLICT` | reassigning away from SUPER_ADMIN would leave zero active SUPER_ADMINs |

---

### 5. `POST /admin/admins/{id}/suspend` — Suspend

**Permission:** `admin.admins.suspend`

Sets `status = deactivated`. Suspended admins cannot log in.

**Errors:**

| Code | When |
|---|---|
| `409 CONFLICT` | self-suspend attempt, admin already deactivated, or would leave zero active SUPER_ADMINs |

---

### 6. `POST /admin/admins/{id}/activate` — Reactivate

**Permission:** `admin.admins.suspend` *(intentionally shares the toggle permission)*

Sets `status = active` on a previously deactivated admin.

---

### 7. `DELETE /admin/admins/{id}` — Soft delete

**Permission:** `admin.admins.delete`

Deactivates the admin **and** detaches their RBAC role (so `role_id` / `role_name` become `null`). The row itself is retained for audit-link integrity.

**Errors:**

| Code | When |
|---|---|
| `409 CONFLICT` | self-delete attempt, or would leave zero active SUPER_ADMINs |

---

## Listing available platform roles

To populate the role dropdown on your invite / reassign forms, call the existing roles endpoint filtered to platform scope:

```http
GET /v1/roles?scope=platform
Authorization: Bearer <admin-jwt>
```

The system roles appear with `is_system: true` — you may want to render them as a separate group above the custom ones.

---

## Permission matrix (system roles)

Legend: ● granted · ○ not granted.

| Permission code | SUPER_ADMIN | RISK_ANALYST | MODEL_OPS_ENGINEER | COMPLIANCE_OFFICER | INFRASTRUCTURE_ENGINEER |
|---|:-:|:-:|:-:|:-:|:-:|
| `monitoring.risk` | ● | ● | ○ | ● | ○ |
| `monitoring.model_ops` | ● | ○ | ● | ○ | ○ |
| `monitoring.compliance` | ● | ○ | ○ | ● | ○ |
| `monitoring.infrastructure` | ● | ○ | ○ | ○ | ● |
| `monitoring.alerts` | ● | ● | ● | ● | ● |
| `models.read` | ● | ● | ● | ○ | ○ |
| `rules.evaluate` | ● | ● | ● | ○ | ○ |
| `admin.training_data.upload` | ● | ○ | ● | ○ | ○ |
| `admin.training_data.read` | ● | ○ | ● | ○ | ○ |
| `admin.training_data.approve` | ● | ○ | ● | ○ | ○ |
| `admin.sources.manage` | ● | ○ | ● | ○ | ○ |
| `admin.sources.read` | ● | ○ | ● | ○ | ● |
| `admin.api_logs.read` | ● | ○ | ○ | ● | ● |
| `admin.organizations.read` | ● | ● | ○ | ● | ● |
| `admin.organizations.create` | ● | ○ | ○ | ○ | ○ |
| `admin.organizations.update` | ● | ○ | ○ | ○ | ○ |
| `admin.organizations.provision` | ● | ○ | ○ | ○ | ○ |
| `admin.organizations.suspend` | ● | ○ | ○ | ○ | ○ |
| `admin.roles.read` | ● | ○ | ○ | ○ | ○ |
| `admin.roles.manage` | ● | ○ | ○ | ○ | ○ |
| `admin.roles.assign` | ● | ○ | ○ | ○ | ○ |
| `admin.admins.invite` | ● | ○ | ○ | ○ | ○ |
| `admin.admins.list` | ● | ○ | ○ | ○ | ○ |
| `admin.admins.read` | ● | ○ | ○ | ○ | ○ |
| `admin.admins.update` | ● | ○ | ○ | ○ | ○ |
| `admin.admins.suspend` | ● | ○ | ○ | ○ | ○ |
| `admin.admins.delete` | ● | ○ | ○ | ○ | ○ |

Admin-user and role-administration permissions are deliberately restricted to `SUPER_ADMIN`. Grant a narrower role to anyone who should not be able to invite or re-role other staff.

---

## TypeScript interfaces

```typescript
export interface AdminDetail {
  id: string;            // uuid
  email: string;
  name: string;
  status: "active" | "deactivated";
  role_id: string | null;
  role_name:
    | "SUPER_ADMIN"
    | "RISK_ANALYST"
    | "MODEL_OPS_ENGINEER"
    | "COMPLIANCE_OFFICER"
    | "INFRASTRUCTURE_ENGINEER"
    | string       // custom role names are free text
    | null;
  last_login_at: string | null;
  created_at: string;
}

export interface AdminListResponse {
  items: AdminDetail[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface InviteAdminRequest {
  email: string;
  name: string;
  role_id?: string;        // omit → defaults to SUPER_ADMIN
  callback_url?: string;
}

export interface UpdateAdminRequest {
  name?: string;
  role_id?: string;        // must be platform-scoped
}
```

---

## UX guidance

- **Block the bootstrap form for SUPER_ADMIN on the FE** — relying on the backend 409 to surface "this is the last SUPER_ADMIN" is fine as a safety net, but the UI should visually disable *Suspend* / *Remove* / *Demote* affordances when the target is the only active SUPER_ADMIN (use the list response to count).
- **Self-actions** — don't show *Suspend* / *Remove* for the currently logged-in admin at all; the backend enforces a 409, but hiding the buttons is cleaner.
- **Role picker** — fetch `/v1/roles?scope=platform` once per page and cache it. Highlight system roles; allow custom ones underneath.
- **Permission badges** — after login, call `GET /auth/me/permissions` and cache the permission set client-side. Feature-gate UI affordances on those codes (e.g. don't show the *Invite admin* button unless `admin.admins.invite` is in the set, or `"*"` is present).

---

## Bootstrap & migration

- The very first platform admin is still minted by the CLI scripts `scripts/create_superuser.py` or `scripts/create_admin_user.py`. These scripts create an ACTIVE admin; the next startup's seeder migration attaches the SUPER_ADMIN RBAC role automatically (idempotent).
- On first deploy after this release, every existing admin is auto-assigned the SUPER_ADMIN role by the seeder — no action needed. Promote / demote them afterwards via `PATCH /admin/admins/{id}`.
