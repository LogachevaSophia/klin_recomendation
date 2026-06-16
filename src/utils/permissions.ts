import type { Permission } from '../api/authTypes';
import { authStore } from '../stores/authStore';

export function getUserPermissions(): Permission[] {
  return authStore.permissions;
}

function permissionMatches(
  p: Permission,
  action: string,
  resource: string,
): boolean {
  const pa = p.action ?? '';
  const pr = p.resource ?? '';
  if (pa === '*' && pr === '*') return true;
  if (pa === '' && pr === '') return true;
  return pa === action && pr === resource;
}

export function hasPermission(action: string, resource: string): boolean {
  const permissions = getUserPermissions();
  return permissions.some((p) => permissionMatches(p, action, resource));
}

export function hasAnyPermission(
  permissionsList: Array<{ action: string; resource: string }>,
): boolean {
  const userPermissions = getUserPermissions();
  return permissionsList.some(({ action, resource }) =>
    userPermissions.some((p) => permissionMatches(p, action, resource)),
  );
}
