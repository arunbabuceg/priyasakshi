/**
 * Invoice service - handles invoice download and resend operations.
 */
import { apiClient, API_BASE, getErrorMessage } from '@/lib/apiClient';

const RAW_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const BACKEND_URL = RAW_BACKEND_URL.replace(/\/$/, '');

/**
 * Download invoice PDF for an order.
 * Opens the PDF in a new browser tab.
 */
export const downloadInvoice = async (orderId) => {
  try {
    const url = `${BACKEND_URL}/api/invoices/${orderId}`;
    window.open(url, '_blank');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not download invoice') };
  }
};

/**
 * Resend invoice email to customer (admin only).
 */
export const resendInvoiceEmail = async (orderId) => {
  try {
    const { data } = await apiClient.post(`/invoices/${orderId}/resend`);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not resend invoice') };
  }
};
