import { loadPermissionsFromStorage } from '../api/authStorage';
import type { Permission } from '../api/authTypes';

export function getUserPermissions(): Permission[] {
  return loadPermissionsFromStorage();
}

export function hasPermission(action: string, resource: string): boolean {
  const permissions = getUserPermissions();
  return permissions.some((p) => p.action === action && p.resource === resource);
}

export function hasAnyPermission(
  permissionsList: Array<{ action: string; resource: string }>,
): boolean {
  const userPermissions = getUserPermissions();
  return permissionsList.some(({ action, resource }) =>
    userPermissions.some((p) => p.action === action && p.resource === resource),
  );
}
