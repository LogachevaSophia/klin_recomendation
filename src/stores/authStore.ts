import { makeAutoObservable, runInAction } from 'mobx';
import * as authService from '../api/authService';
import {
  clearSession,
  getAccessToken,
  loadPermissionsFromStorage,
  loadUserFromStorage,
} from '../api/authStorage';
import type { AuthUser, Permission } from '../api/authTypes';

class AuthStore {
  token: string | null = null;
  user: AuthUser | null = null;
  permissions: Permission[] = [];

  constructor() {
    this.token = getAccessToken();
    this.user = loadUserFromStorage();
    this.permissions = loadPermissionsFromStorage();
    makeAutoObservable(this);
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  clearSessionState(): void {
    this.token = null;
    this.user = null;
    this.permissions = [];
  }

  async login(email: string, password: string): Promise<void> {
    const data = await authService.login(email, password);
    runInAction(() => {
      this.token = data.access_token;
      this.user = data.user;
      this.permissions = loadPermissionsFromStorage();
    });
  }

  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ): Promise<void> {
    const data = await authService.registerAndLogin(
      email,
      password,
      firstName,
      lastName,
    );
    runInAction(() => {
      this.token = data.access_token;
      this.user = data.user;
      this.permissions = loadPermissionsFromStorage();
    });
  }

  logout(): void {
    clearSession();
    runInAction(() => {
      this.clearSessionState();
    });
  }
}

export const authStore = new AuthStore();
