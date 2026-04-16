/** IAM + Clinrec: gateway `http://host:8081/api` или относительно `/api` (Vite proxy). */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api';
