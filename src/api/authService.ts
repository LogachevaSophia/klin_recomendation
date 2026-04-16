import type { LoginResponse, Permission, RegisterResponse } from './authTypes';
import { persistPermissions, persistSession } from './authStorage';
import { apiClient } from './apiClient';
import { authHttp } from './authHttp';

export async function fetchAndStoreUserPermissions(userId: string): Promise<void> {
  const { data } = await apiClient.get<{ permissions?: Permission[] }>(
    `/users/${userId}/permissions`,
  );
  persistPermissions(data.permissions ?? []);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await authHttp.post<LoginResponse>('/login', { email, password });
  persistSession(data);
  try {
    await fetchAndStoreUserPermissions(data.user.id);
  } catch {
    persistPermissions([]);
  }
  return data;
}

export async function register(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
): Promise<RegisterResponse> {
  const body: Record<string, unknown> = { email, password };
  if (firstName?.trim()) body.first_name = firstName.trim();
  if (lastName?.trim()) body.last_name = lastName.trim();
  const { data } = await authHttp.post<RegisterResponse>('/users', body);
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
