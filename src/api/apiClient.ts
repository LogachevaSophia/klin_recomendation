import axios from 'axios';
import { API_BASE_URL } from './config';
import { clearSession, getAccessToken } from './authStorage';

function resolveBearerToken(): string | undefined {
  const fromSession = getAccessToken();
  if (fromSession) return fromSession;
  const env = import.meta.env.VITE_CLINREC_API_TOKEN as string | undefined;
  return env?.trim() || undefined;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token temporarily disabled — auth backend not connected
apiClient.interceptors.request.use((config) => {
  // const token = resolveBearerToken();
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

// Auth redirect temporarily disabled — auth backend not connected
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // if (axios.isAxiosError(error) && error.response?.status === 401) {
    //   console.log('[auth] apiClient 401', {
    //     url: error.config?.url,
    //     baseURL: error.config?.baseURL,
    //   });
    //   const hadAuth = Boolean(error.config?.headers?.Authorization);
    //   if (hadAuth) {
    //     clearSession();
    //     const { authStore } = await import('../stores/authStore');
    //     authStore.clearSessionState();
    //     if (!window.location.pathname.startsWith('/login')) {
    //       window.location.assign('/login');
    //     }
    //   }
    // }
    return Promise.reject(error);
  },
);
