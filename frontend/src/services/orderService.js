/**
 * Order service — posts orders to the backend for record-keeping.
 *
 * The backend currently persists the order and returns an id; no payment is
 * captured. The frontend still displays "Online payments will be available
 * soon." after submission (see CheckoutForm). Wire real payment provider
 * calls into src/services/paymentService.js when they become available.
 */
import { apiClient, getErrorMessage } from '@/lib/apiClient';

export const createOrder = async (payload) => {
  try {
    const { data } = await apiClient.post('/orders', payload);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not place order') };
  }
};
