export const ROLE_HIERARCHY = {
  VIEWER: 1,
  MEMBER: 2,
  TEAM: 3,
  ADMIN: 4,
  OWNER: 5,
} as const;

export type AppRole = keyof typeof ROLE_HIERARCHY;

export type CustomerPortalRole = 'VIEWER' | 'MEMBER';
export type StaffRole = 'TEAM' | 'ADMIN' | 'OWNER';

const ALL_ROLES = new Set<string>(Object.keys(ROLE_HIERARCHY));

export function isAppRole(role: string): role is AppRole {
  return ALL_ROLES.has(role);
}

export function hasMinRole(userRole: AppRole, required: AppRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

export function isCustomerRole(role: AppRole): boolean {
  return role === 'VIEWER' || role === 'MEMBER';
}

export function isStaffRole(role: AppRole): boolean {
  return role === 'TEAM' || role === 'ADMIN' || role === 'OWNER';
}

export function normalizePortalRole(role: string | null | undefined): CustomerPortalRole {
  return role === 'VIEWER' ? 'VIEWER' : 'MEMBER';
}

/** Legacy JWT roles from pre-RBAC sessions */
export function normalizeLegacyJwtRole(role: unknown): AppRole | null {
  if (typeof role !== 'string') return null;
  if (isAppRole(role)) return role;
  if (role === 'admin') return 'ADMIN';
  if (role === 'customer') return 'MEMBER';
  return null;
}

export function isStaffRoleName(role: string): boolean {
  const normalized = normalizeLegacyJwtRole(role);
  return normalized !== null && isStaffRole(normalized);
}

export function isCustomerRoleName(role: string): boolean {
  const normalized = normalizeLegacyJwtRole(role);
  return normalized !== null && isCustomerRole(normalized);
}
