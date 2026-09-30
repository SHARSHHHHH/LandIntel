export const ADMIN_ROLE = "admin";

export const ADMIN_PERMISSIONS = [
  "view_users",
  "manage_users",
  "disable_users",
  "view_roles",
  "manage_roles",
  "view_audit_logs",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];
