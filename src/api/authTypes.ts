export interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

/** Право из IAM: пара action + resource (например create + process). */
export interface Permission {
  action: string;
  resource: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user: AuthUser;
}

export interface RegisterResponse {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  created_at?: string;
}
