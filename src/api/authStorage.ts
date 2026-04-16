import type { AuthUser, Permission } from './authTypes';

export const TOKEN_KEY = 'token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'user';
export const PERMISSIONS_KEY = 'permissions';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function persistSession(data: {
  access_token: string;
  refresh_token?: string;
  user: AuthUser;
}): void {
  localStorage.setItem(TOKEN_KEY, data.access_token);
  if (data.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function persistPermissions(permissions: Permission[]): void {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
}

export function loadPermissionsFromStorage(): Permission[] {
  const raw = localStorage.getItem(PERMISSIONS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is Permission =>
        p != null &&
        typeof p === 'object' &&
        'action' in p &&
        'resource' in p &&
        typeof (p as Permission).action === 'string' &&
        typeof (p as Permission).resource === 'string',
    );
  } catch {
    return [];
  }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PERMISSIONS_KEY);
}

export function loadUserFromStorage(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
