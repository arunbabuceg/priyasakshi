/**
 * Auth service — talks to the backend /api/auth/* endpoints.
 *
 * Tokens are stored in HTTP-only cookies set by the backend, so we never
 * touch them in JS. We use `credentials: 'include'` so the browser sends
 * the cookies with every request. Axios is configured with withCredentials
 * in apiClient.js.
 */
import { apiClient, getErrorMessage } from '@/lib/apiClient';

export const register = async (name, email, password) => {
  try {
    const { data } = await apiClient.post('/auth/register', { name, email, password });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Registration failed') };
  }
};

export const login = async (email, password) => {
  try {
    const { data } = await apiClient.post('/auth/login', { email, password });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Invalid email or password') };
  }
};

export const logout = async () => {
  try {
    await apiClient.post('/auth/logout', {});
    return { ok: true };
  } catch {
    return { ok: true };
  }
};

export const refresh = async (refreshToken) => {
  try {
    const { data } = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
    return { ok: true, data };
  } catch {
    return { ok: false };
  }
};

export const getMe = async () => {
  try {
    const { data } = await apiClient.get('/auth/me');
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err) };
  }
};

export const verifyEmail = async (token) => {
  try {
    const { data } = await apiClient.post('/auth/verify-email', { token });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Invalid or expired token') };
  }
};

export const resendVerification = async () => {
  try {
    const { data } = await apiClient.post('/auth/resend-verification');
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not send verification email') };
  }
};

export const forgotPassword = async (email) => {
  try {
    const { data } = await apiClient.post('/auth/forgot-password', { email });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Request failed') };
  }
};

export const resetPassword = async (token, password) => {
  try {
    const { data } = await apiClient.post('/auth/reset-password', { token, password });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Reset failed') };
  }
};
