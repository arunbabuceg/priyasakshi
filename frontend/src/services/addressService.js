/**
 * Saved addresses service — CRUD for the authenticated user's addresses.
 */
import { apiClient, getErrorMessage } from '@/lib/apiClient';

export const getAddresses = async () => {
  try {
    const { data } = await apiClient.get('/addresses');
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not load addresses'), data: [] };
  }
};

export const createAddress = async (payload) => {
  try {
    const { data } = await apiClient.post('/addresses', payload);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not save address') };
  }
};

export const updateAddress = async (id, payload) => {
  try {
    const { data } = await apiClient.put(`/addresses/${id}`, payload);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not update address') };
  }
};

export const deleteAddress = async (id) => {
  try {
    await apiClient.delete(`/addresses/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not delete address') };
  }
};
