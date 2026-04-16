import axios from 'axios';
import { API_BASE_URL } from './config';

/** Только IAM login/register — без Authorization, чтобы не подмешивался service token из env. */
export const authHttp = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});
