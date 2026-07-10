/**
 * Payment service — abstraction over future payment providers.
 *
 * Payments are intentionally disabled until a provider is wired up. When
 * Razorpay / Stripe are added, implement the `startCheckout` function to
 * hand off to the provider and everything else in the app (checkout form,
 * success page) stays the same.
 */
export const PAYMENTS_ENABLED = false;

export const startCheckout = async (_orderPayload) => {
  return {
    ok: false,
    disabled: true,
    message: 'Online payments will be available soon.',
  };
};
