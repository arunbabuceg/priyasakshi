/**
 * Order service — user order history + single order detail.
 *
 * Order creation stays in orderService.js (POST /api/orders). These functions
 * talk to the authenticated order endpoints added for the account dashboard.
 */
import { apiClient, getErrorMessage } from '@/lib/apiClient';

export const getMyOrders = async () => {
  try {
    const { data } = await apiClient.get('/orders/my');
    return { ok: true, data: data.orders || [] };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not load orders'), data: [] };
  }
};

export const getOrder = async (orderId) => {
  try {
    const { data } = await apiClient.get(`/orders/${orderId}`);
    return { ok: true, data: data.order };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not load order') };
  }
};
