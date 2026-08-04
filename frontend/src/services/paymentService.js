/**
 * Payment service — Razorpay Standard Checkout integration.
 *
 * Flow:
 *   1. createRazorpayOrder(orderId, amount) → POST /api/create-order
 *   2. loadRazorpayCheckout() → injects the Razorpay Checkout script once
 *   3. openRazorpayCheckout(...) → opens the Standard Checkout modal
 *   4. verifyPayment(...) → POST /api/verify-payment with the payment
 *      handle Razorpay returns, so the backend can validate the HMAC
 *      signature and mark the order paid.
 *
 * KEY_SECRET never appears here — only VITE_RAZORPAY_KEY_ID (public) is
 * used on the client, per Razorpay Standard Checkout's design.
 */
import { apiClient, getErrorMessage } from '@/lib/apiClient';

export const PAYMENTS_ENABLED = true;

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/** Creates a Razorpay order for an already-recorded internal order. */
export const createRazorpayOrder = async ({ orderId, amount, currency = 'INR' }) => {
  try {
    const { data } = await apiClient.post('/create-order', {
      order_id: orderId,
      amount,
      currency,
    });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Could not start payment') };
  }
};

/** Verifies a completed Razorpay Standard Checkout payment against the backend. */
export const verifyPayment = async ({
  orderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  try {
    const { data } = await apiClient.post('/verify-payment', {
      order_id: orderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err, 'Payment verification failed') };
  }
};

/** Lazily injects the Razorpay Checkout script (loaded once per page). */
let checkoutScriptPromise = null;
export const loadRazorpayCheckout = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (checkoutScriptPromise) return checkoutScriptPromise;

  checkoutScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Could not load Razorpay Checkout'));
    document.body.appendChild(script);
  });
  return checkoutScriptPromise;
};

/**
 * Opens Razorpay Standard Checkout. Resolves with the payment handle on
 * success, rejects on modal dismissal or checkout failure.
 */
export const openRazorpayCheckout = ({
  razorpayOrderId,
  amount,
  currency,
  name,
  description,
  prefill,
}) =>
  new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      order_id: razorpayOrderId,
      amount,
      currency,
      name,
      description,
      prefill,
      theme: { color: '#8B2956' },
      handler: (response) => {
        resolve({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    });
    rzp.on('payment.failed', (resp) => {
      reject(new Error(resp?.error?.description || 'Payment failed'));
    });
    rzp.open();
  });
