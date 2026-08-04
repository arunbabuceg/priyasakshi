import { apiClient, getErrorMessage } from '@/lib/apiClient';

export const sendContactMessage = async (payload) => {
  try {
    const { data } = await apiClient.post('/contact', payload);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not send message') };
  }
};
