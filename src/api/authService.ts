import type { LoginResponse, Permission, RegisterResponse } from './authTypes';
import { persistSession } from './authStorage';
import { apiClient } from './apiClient';
import { authHttp } from './authHttp';

export async function fetchUserPermissions(userId: string): Promise<Permission[]> {
  console.log('[auth] fetchUserPermissions request', { userId, path: `/users/${userId}/permissions` });
  const { data } = await apiClient.get<{ permissions?: Permission[] }>(
    `/users/${userId}/permissions`,
  );
  const raw = data.permissions ?? [];
  const list = raw.filter(
    (p): p is Permission =>
      p != null &&
      typeof p === 'object' &&
      typeof p.action === 'string' &&
      typeof p.resource === 'string',
  );
  console.log('[auth] fetchUserPermissions response', { userId, count: list.length, rawLength: raw.length });
  return list;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  console.log('[auth] login request');
  const { data } = await authHttp.post<LoginResponse>('/login', { email, password });
  persistSession(data);
  console.log('[auth] login ok', { userId: data.user?.id, email: data.user?.email });
  return data;
}

export async function register(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
): Promise<RegisterResponse> {
  console.log('[auth] register request', { email });
  const body: Record<string, unknown> = { email, password };
  if (firstName?.trim()) body.first_name = firstName.trim();
  if (lastName?.trim()) body.last_name = lastName.trim();
  const { data } = await authHttp.post<RegisterResponse>('/users', body);
  console.log('[auth] register ok', { id: data.id, email: data.email });
  return data;
}

export async function registerAndLogin(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
): Promise<LoginResponse> {
  await register(email, password, firstName, lastName);
  return login(email, password);
}
