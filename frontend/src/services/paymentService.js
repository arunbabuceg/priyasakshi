/**
 * Payment service — Razorpay Standard Web Checkout.
 *
 * Flow:
 *  1. createRazorpayOrder() — backend POST /payments/create-order → { order_id }
 *  2. openRazorpayCheckout() — loads Razorpay modal via checkout.js
 *  3. On success, verifyPayment() — backend POST /payments/verify (HMAC check)
 *
 * KEY_ID is public and safe for the frontend (prefixed VITE_).
 * KEY_SECRET never leaves the backend.
 */
import { apiClient, getErrorMessage } from '@/lib/apiClient';

export const PAYMENTS_ENABLED = true;

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

export const createRazorpayOrder = async (amount, currency = 'INR', receipt) => {
  try {
    const { data } = await apiClient.post('/payments/create-order', { amount, currency, receipt });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not initiate payment') };
  }
};

export const verifyPayment = async (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
  try {
    const { data } = await apiClient.post('/payments/verify', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Payment verification failed') };
  }
};

/**
 * Opens the Razorpay checkout modal.
 * Returns a promise that resolves on success or rejects on dismissal/failure.
 *
 * @param {object} opts
 * @param {string} opts.orderId     — Razorpay order_id from create-order
 * @param {number} opts.amount      — amount in paise
 * @param {string} opts.currency    — 'INR'
 * @param {string} opts.name        — merchant name
 * @param {string} opts.description — order description
 * @param {object} opts.prefill     — { name, email, contact }
 */
export const openRazorpayCheckout = (opts) =>
  new Promise((resolve, reject) => {
    if (!RAZORPAY_KEY_ID) {
      reject(new Error('Razorpay key not configured'));
      return;
    }

    const handler = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      order_id: opts.orderId,
      amount: opts.amount,
      currency: opts.currency || 'INR',
      name: opts.name || 'Priya Sakshi',
      description: opts.description || 'Order',
      prefill: opts.prefill || {},
      theme: { color: '#8B2956' },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    });

    handler.on('payment.failed', (response) => {
      reject(new Error(response?.error?.description || 'Payment failed'));
    });

    handler.open();
  });
