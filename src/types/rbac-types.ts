// ==================== RBAC TYPES ====================
// Roles and permission shapes used by the role-management endpoints.

export interface PermissionResponse {
  id: string;
  code: string;
  name: string;
  group_name: string;
  description: string;
  scope: string;
}

export interface PermissionListResponse {
  items: PermissionResponse[];
  total: number;
}

export interface RolePermissionItem {
  id: string;
  code: string;
  name: string;
  group_name: string;
  description: string;
  scope: string;
}

export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  scope: string;
  is_system: boolean;
  organization_id: string | null;
  created_at: string;
  permissions: RolePermissionItem[];
}

export interface RoleListResponse {
  items: RoleResponse[];
  total: number;
}

export interface CreateRoleRequest {
  name: string;
  description?: string | null;
  permission_codes?: string[];
}

export interface UpdateRoleRequest {
  name?: string | null;
  description?: string | null;
  permission_codes?: string[] | null;
}
