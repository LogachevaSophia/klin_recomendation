import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback = 'Ошибка запроса'): string {
  if (axios.isAxiosError(error)) {
    const d = error.response?.data;
    if (d && typeof d === 'object') {
      const err = (d as { error?: unknown }).error;
      if (typeof err === 'string') return err;
      const msg = (d as { message?: unknown }).message;
      if (typeof msg === 'string') return msg;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
