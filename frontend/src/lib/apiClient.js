import axios from 'axios';

// Vite exposes VITE_-prefixed env vars via import.meta.env.
const RAW_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const BACKEND_URL = RAW_BACKEND_URL.replace(/\/$/, '');

export const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

/** Extract a user-friendly error message from an axios error. */
export const getErrorMessage = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.detail || err?.message || fallback;
