/**
 * Profile service — view/edit name & phone, change password.
 * Email is not editable.
 */
import { apiClient, getErrorMessage } from '@/lib/apiClient';

export const getProfile = async () => {
  try {
    const { data } = await apiClient.get('/profile');
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not load profile') };
  }
};

export const updateProfile = async ({ name, phone }) => {
  try {
    const { data } = await apiClient.patch('/profile', { name, phone });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not update profile') };
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const { data } = await apiClient.post('/profile/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not change password') };
  }
};
