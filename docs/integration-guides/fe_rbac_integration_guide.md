# RBAC Integration Guide — Frontend Engineer

## Overview

The platform enforces a Role-Based Access Control (RBAC) system on every endpoint.
Every API call must carry a Bearer token (JWT or API key). The server evaluates the
caller's role assignments and either allows or rejects the request before any business
logic runs.

There are **two scopes**:

| Scope | Who uses it | System role | Permission pool |
|---|---|---|---|
| `platform` | Admin / staff users | `SUPER_ADMIN` | All 47 permissions |
| `org` | Organisation users & API keys | `ADMIN` | 27 org-scoped permissions only |

Org users **cannot** see or be assigned platform-scoped permissions. Admin users can
see and use all 47.

---

## Error Responses

Errors from the RBAC layer follow the same envelope as all other errors:

```json
// 401 — not authenticated
{ "error": { "code": "AUTHENTICATION_ERROR", "message": "...", "details": {} } }

// 403 — authenticated but missing the required permission
{ "error": { "code": "AUTHORIZATION_ERROR", "message": "Permission required: score_requests.create", "details": {} } }

// 429 — rate limit hit (always enforced before the permission check)
{ "error": { "code": "RATE_LIMIT_EXCEEDED", "message": "Rate limit exceeded", "details": { "retry_after": 60 } } }
```

---

## Permission Reference

### Platform-scoped (admin users only)

| Code | Group | Description |
|---|---|---|
| `admin.organizations.create` | Organizations | Create new organizations |
| `admin.organizations.read` | Organizations | View organizations and members |
| `admin.organizations.update` | Organizations | Update organization details |
| `admin.organizations.provision` | Organizations | Provision API keys and sandbox |
| `admin.organizations.suspend` | Organizations | Suspend or reactivate an org |
| `admin.training_data.upload` | Training Data | Upload training files and mappings |
| `admin.training_data.read` | Training Data | View uploads, status, mappings |
| `admin.training_data.approve` | Training Data | Approve or reject uploads |
| `admin.sources.manage` | Data Sources | Create and manage data sources |
| `admin.sources.read` | Data Sources | View data sources and templates |
| `admin.roles.read` | Role Management | View platform roles |
| `admin.roles.manage` | Role Management | Create, update, delete platform roles |
| `admin.roles.assign` | Role Management | Assign roles to platform users |
| `monitoring.risk` | Monitoring | Risk monitoring dashboard |
| `monitoring.infrastructure` | Monitoring | Infrastructure monitoring dashboard |
| `monitoring.model_ops` | Monitoring | Model operations dashboard |
| `monitoring.compliance` | Monitoring | Compliance monitoring dashboard |
| `monitoring.alerts` | Monitoring | View and manage alerts |
| `models.read` | Models & Rules | View champion model metadata |
| `rules.evaluate` | Models & Rules | Run sandbox rule evaluations |

### Org-scoped (org users and API keys)

| Code | Group | Description |
|---|---|---|
| `score_requests.create` | Scoring | Submit credit score requests |
| `score_requests.list` | Scoring | List credit score requests |
| `score_requests.read` | Scoring | View individual score request and result |
| `score_requests.override` | Scoring | Override a REFER decision manually |
| `score_requests.report_outcome` | Scoring | Record a loan decision outcome |
| `score_requests.report_performance` | Scoring | Report loan performance updates |
| `batch_scoring.create` | Batch Scoring | Submit batch scoring jobs |
| `batch_scoring.list` | Batch Scoring | List batch scoring jobs |
| `batch_scoring.read` | Batch Scoring | View batch job status and results |
| `batch_scoring.cancel` | Batch Scoring | Cancel a queued batch job |
| `bureau.lookup` | Bureau | Look up credit bureau data |
| `org.read` | Organization | View organization profile |
| `org.update` | Organization | Update organization profile |
| `users.invite` | User Management | Invite new users |
| `users.list` | User Management | List organization users |
| `users.update` | User Management | Update a user's name or role |
| `users.suspend` | User Management | Suspend or reactivate users |
| `users.delete` | User Management | Remove a user from the org |
| `api_keys.create` | API Keys | Generate new API keys |
| `api_keys.list` | API Keys | List API keys |
| `api_keys.revoke` | API Keys | Revoke an API key |
| `webhooks.manage` | Webhooks | Create, update, delete webhooks |
| `webhooks.list` | Webhooks | List webhooks and events |
| `api_logs.read` | API Logs | View API request logs |
| `roles.read` | Role Management | View org roles |
| `roles.manage` | Role Management | Create, update, delete org roles |
| `roles.assign` | Role Management | Assign roles to org users |

---

## Fetching the Permission & Role Catalog

### List permissions available to the caller

```
GET /v1/permissions
Authorization: Bearer <token>
```

Returns only what the caller's scope allows: all 47 for admin users, 27 org-scoped for
org users.

```json
{
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "code": "score_requests.create",
      "group_name": "Scoring",
      "description": "Submit credit score requests",
      "scope": "org"
    }
  ],
  "total": 27
}
```

Use this endpoint to populate the permission picker in the role builder UI.

### List roles

```
GET /v1/roles
Authorization: Bearer <token>
```

Returns roles visible to the caller:
- **Admin:** platform-scoped roles (SUPER_ADMIN + any custom platform roles)
- **Org user:** org system ADMIN role + custom roles belonging to their org

```json
{
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "ADMIN",
      "description": null,
      "scope": "org",
      "is_system": true,
      "organization_id": null,
      "created_at": "2026-04-16T10:00:00Z",
      "permissions": [
        {
          "id": "uuid",
          "code": "score_requests.create",
          "group_name": "Scoring",
          "description": "Submit credit score requests",
          "scope": "org"
        }
      ]
    },
    {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "name": "Loan Officer",
      "description": "Can score and override REFER decisions",
      "scope": "org",
      "is_system": false,
      "organization_id": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
      "created_at": "2026-04-16T11:00:00Z",
      "permissions": [
        { "id": "uuid", "code": "score_requests.create", "group_name": "Scoring", "description": "...", "scope": "org" },
        { "id": "uuid", "code": "score_requests.read",   "group_name": "Scoring", "description": "...", "scope": "org" },
        { "id": "uuid", "code": "score_requests.override","group_name": "Scoring", "description": "...", "scope": "org" }
      ]
    }
  ],
  "total": 2
}
```

### Get a single role

```
GET /v1/roles/{role_id}
Authorization: Bearer <token>
```

Same shape as a single item from the list above.

---

## Creating & Editing Custom Roles

### Create a role

```
POST /v1/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Loan Officer",
  "description": "Can score and override REFER decisions",
  "permission_codes": [
    "score_requests.create",
    "score_requests.read",
    "score_requests.list",
    "score_requests.override",
    "bureau.lookup"
  ]
}
```

Response — full `RoleResponse` with `id` and populated `permissions[]`.

**Rules:**
- Org users create org-scoped roles (`organization_id` is auto-set to their org).
- Admin users create platform-scoped roles (`organization_id` remains null).
- `permission_codes` must all be within the caller's scope or the request fails with
  `422 Unprocessable Entity`.

### Update a role (full permission replacement)

```
PATCH /v1/roles/{role_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Senior Loan Officer",
  "permission_codes": [
    "score_requests.create",
    "score_requests.read",
    "score_requests.list",
    "score_requests.override",
    "score_requests.report_outcome",
    "bureau.lookup"
  ]
}
```

`permission_codes` is a **full replacement** — whatever you send becomes the new set.
Omit the field entirely to leave the existing permissions unchanged.

System roles (`is_system: true`) cannot be modified — the server returns `422`.

### Delete a role

```
DELETE /v1/roles/{role_id}
Authorization: Bearer <token>
```

```json
{ "message": "Role 'Loan Officer' deleted" }
```

System roles cannot be deleted — the server returns `422`.

---

## Assigning Roles

### On user invite

```
POST /org/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "jane@acme.com",
  "name": "Jane Doe",
  "role_label": "credit_officer",
  "role_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

| Field | Required | Notes |
|---|---|---|
| `role_label` | Yes | Legacy display label (`admin`, `credit_officer`, `developer`, `viewer`). Still shown as a badge in the UI. |
| `role_id` | No | The RBAC role that governs what the user can actually do. Defaults to the system `ADMIN` role when omitted. |

### On user update

```
PATCH /org/users/{user_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "role_id": "new-role-uuid"
}
```

Replaces the user's current role assignment. `name` and `role_label` can be sent in
the same request.

### On API key creation

```
POST /org/api-keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Production integration",
  "environment": "production",
  "role_id": "scoring-only-role-uuid"
}
```

| Field | Notes |
|---|---|
| `role_id` | Optional. Omitting it grants the key full `ADMIN`-level access (backward-compatible). Recommended: always assign a minimal role to new keys. |

---

## Frontend Permission Checks

The server is the source of truth — never rely solely on client-side checks for
security. However, you should fetch the current user's resolved permissions after login
and store them in your auth state to drive conditional rendering.

### Fetch resolved permissions after login

Call `GET /v1/permissions` immediately after a successful login and store the result:

```typescript
// auth-store.ts
interface AuthState {
  token: string
  userType: 'admin' | 'org_user'
  permissions: Set<string>
}

async function loadPermissions(token: string): Promise<Set<string>> {
  const res = await fetch('/v1/permissions', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return new Set()
  const data = await res.json()
  return new Set((data.items as Array<{ code: string }>).map(p => p.code))
}

// Helper used everywhere in the UI
function can(permission: string): boolean {
  return authStore.permissions.has(permission)
}
```

> The wildcard `"*"` is never surfaced in the `/v1/permissions` response — the server
> returns the explicit list of codes the user has. Simply check whether the code you
> care about is present in that list.

### Gating UI elements

```tsx
// Show the Override button only when the user can override
{can('score_requests.override') && (
  <Button onClick={handleOverride}>Override Decision</Button>
)}

// Show the Role Management section in org settings
{can('roles.manage') && <RoleManagementSection />}

// Disable rather than hide when the user can see the section but not act
<Button disabled={!can('users.invite')} onClick={openInviteModal}>
  Invite User
</Button>

// Gate entire pages / routes
function ProtectedRoute({ permission, children }) {
  if (!can(permission)) return <Navigate to="/forbidden" />
  return children
}

<ProtectedRoute permission="api_logs.read">
  <ApiLogsPage />
</ProtectedRoute>
```

### Grouping permissions for the role builder

The `group_name` field is designed for this. Group the `/v1/permissions` response by
`group_name` to build a sectioned checkbox list:

```typescript
type Permission = { id: string; code: string; group_name: string; description: string }

function groupPermissions(permissions: Permission[]) {
  return permissions.reduce((acc, p) => {
    (acc[p.group_name] ??= []).push(p)
    return acc
  }, {} as Record<string, Permission[]>)
}

// Result keys: "Scoring", "Batch Scoring", "Bureau", "Organization",
//              "User Management", "API Keys", "Webhooks", "API Logs", "Role Management"
```

---

## Endpoint → Permission Matrix

| UI Action | Endpoint | Required Permission |
|---|---|---|
| Submit score request | `POST /v1/score-requests` | `score_requests.create` |
| View score request | `GET /v1/score-requests/{id}` | `score_requests.read` |
| List score requests | `GET /v1/score-requests` | `score_requests.list` |
| View scoring result | `GET /v1/score-requests/{id}/scoring-result` | `score_requests.read` |
| Override REFER decision | `POST /v1/score-requests/{id}/override` | `score_requests.override` |
| Record loan outcome | `POST /v1/score-requests/{id}/outcome` | `score_requests.report_outcome` |
| Report performance | `POST /v1/score-requests/{id}/performance` | `score_requests.report_performance` |
| Bureau lookup | `POST /v1/bureau-lookup` | `bureau.lookup` |
| Submit batch job | `POST /v1/score/batch` | `batch_scoring.create` |
| List batch jobs | `GET /v1/score/batch` | `batch_scoring.list` |
| View batch job | `GET /v1/score/batch/{id}` | `batch_scoring.read` |
| View batch results | `GET /v1/score/batch/{id}/results` | `batch_scoring.read` |
| Cancel batch job | `POST /v1/score/batch/{id}/cancel` | `batch_scoring.cancel` |
| View org profile | `GET /org/profile` | `org.read` |
| Edit org profile | `PATCH /org/profile` | `org.update` |
| List users | `GET /org/users` | `users.list` |
| Invite user | `POST /org/users` | `users.invite` |
| Edit user | `PATCH /org/users/{id}` | `users.update` |
| Suspend user | `POST /org/users/{id}/suspend` | `users.suspend` |
| Activate user | `POST /org/users/{id}/activate` | `users.suspend` |
| Remove user | `DELETE /org/users/{id}` | `users.delete` |
| List API keys | `GET /org/api-keys` | `api_keys.list` |
| Create API key | `POST /org/api-keys` | `api_keys.create` |
| Revoke API key | `DELETE /org/api-keys/{id}` | `api_keys.revoke` |
| List webhooks | `GET /org/webhooks` | `webhooks.list` |
| Create/edit/delete webhook | `POST/PATCH/DELETE /org/webhooks` | `webhooks.manage` |
| View API logs | `GET /org/api-logs` | `api_logs.read` |
| View permissions catalog | `GET /v1/permissions` | `roles.read` or `admin.roles.read` |
| List roles | `GET /v1/roles` | `roles.read` or `admin.roles.read` |
| View single role | `GET /v1/roles/{id}` | `roles.read` or `admin.roles.read` |
| Create role | `POST /v1/roles` | `roles.manage` or `admin.roles.manage` |
| Edit role | `PATCH /v1/roles/{id}` | `roles.manage` or `admin.roles.manage` |
| Delete role | `DELETE /v1/roles/{id}` | `roles.manage` or `admin.roles.manage` |
| View risk dashboard | `GET /v1/monitoring/risk` | `monitoring.risk` |
| View infra dashboard | `GET /v1/monitoring/infrastructure` | `monitoring.infrastructure` |
| View model ops dashboard | `GET /v1/monitoring/model-ops` | `monitoring.model_ops` |
| View compliance dashboard | `GET /v1/monitoring/compliance` | `monitoring.compliance` |
| View alerts | `GET /v1/monitoring/alerts` | `monitoring.alerts` |
| View champion model | `GET /v1/models/current` | `models.read` |
| Run rule evaluation | `POST /v1/rules/evaluate` | `rules.evaluate` |
| List organizations (admin) | `GET /admin/organizations` | `admin.organizations.read` |
| Create organization (admin) | `POST /admin/organizations` | `admin.organizations.create` |
| Update organization (admin) | `PATCH /admin/organizations/{id}` | `admin.organizations.update` |
| Provision organization (admin) | `POST /admin/organizations/{id}/provision` | `admin.organizations.provision` |
| Suspend organization (admin) | `POST /admin/organizations/{id}/suspend` | `admin.organizations.suspend` |
| View training uploads (admin) | `GET /admin/training-data` | `admin.training_data.read` |
| Upload training data (admin) | `POST /admin/training-data` | `admin.training_data.upload` |
| Approve training upload (admin) | `POST /admin/training-data/{id}/approve` | `admin.training_data.approve` |
| View data sources (admin) | `GET /admin/sources` | `admin.sources.read` |
| Manage data sources (admin) | `POST /admin/sources` | `admin.sources.manage` |
