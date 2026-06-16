import { makeAutoObservable, runInAction } from 'mobx';
import * as authService from '../api/authService';
import { clearSession, getAccessToken, loadUserFromStorage } from '../api/authStorage';
import type { AuthUser, Permission } from '../api/authTypes';

class AuthStore {
  token: string | null = null;
  user: AuthUser | null = null;
  permissions: Permission[] = [];

  constructor() {
    this.token = getAccessToken();
    this.user = loadUserFromStorage();
    this.permissions = [];
    makeAutoObservable(this);
    if (this.token && this.user?.id) {
      console.log('[auth] hydrate: token + user in storage, loading permissions', { userId: this.user.id });
      void this.refreshPermissions();
    }
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  clearSessionState(): void {
    this.token = null;
    this.user = null;
    this.permissions = [];
  }

  /** Права только в памяти; вызывайте при входе, F5 с сессией или перед экранами с RBAC. */
  async refreshPermissions(): Promise<void> {
    const uid = this.user?.id;
    if (!this.token || !uid) {
      console.log('[auth] refreshPermissions skip', { hasToken: !!this.token, userId: uid ?? null });
      runInAction(() => {
        this.permissions = [];
      });
      return;
    }
    console.log('[auth] refreshPermissions start', { userId: uid });
    try {
      const list = await authService.fetchUserPermissions(uid);
      runInAction(() => {
        this.permissions = list;
      });
      console.log('[auth] refreshPermissions ok', { userId: uid, count: list.length });
    } catch (err) {
      console.warn('[auth] refreshPermissions error', err);
      runInAction(() => {
        this.permissions = [];
      });
    }
  }

  async login(email: string, password: string): Promise<void> {
    const data = await authService.login(email, password);
    runInAction(() => {
      this.token = data.access_token;
      this.user = data.user;
      this.permissions = [];
    });
    console.log('[auth] store login: session set, refreshing permissions');
    await this.refreshPermissions();
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
      this.permissions = [];
    });
    console.log('[auth] store register: session set, refreshing permissions');
    await this.refreshPermissions();
  }

  logout(): void {
    console.log('[auth] logout');
    clearSession();
    runInAction(() => {
      this.clearSessionState();
    });
  }
}

export const authStore = new AuthStore();
