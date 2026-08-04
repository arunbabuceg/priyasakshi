import { apiClient, getErrorMessage } from '@/lib/apiClient';

export const subscribeNewsletter = async (email, name) => {
  try {
    const { data } = await apiClient.post('/newsletter/subscribe', { email, name });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not subscribe') };
  }
};
