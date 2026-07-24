import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartProvider, useCart } from '@/context/CartContext';
import CheckoutForm from '@/components/CheckoutForm';

// Mock the order service so tests don't try to hit the backend.
vi.mock('@/services/orderService', () => ({
  createOrder: vi.fn().mockResolvedValue({ ok: true, data: { order_id: 'test-id' } }),
}));

// Mock the payment service — Razorpay modal is not available in jsdom.
vi.mock('@/services/paymentService', () => ({
  PAYMENTS_ENABLED: true,
  createRazorpayOrder: vi.fn().mockResolvedValue({
    ok: true,
    data: { order_id: 'rzp_test_123', amount: 199900, currency: 'INR' },
  }),
  openRazorpayCheckout: vi.fn().mockResolvedValue({
    razorpay_payment_id: 'pay_test_123',
    razorpay_order_id: 'rzp_test_123',
    razorpay_signature: 'sig_test_123',
  }),
  verifyPayment: vi.fn().mockResolvedValue({ ok: true, data: { ok: true } }),
}));

import { createOrder } from '@/services/orderService';
import { createRazorpayOrder, verifyPayment } from '@/services/paymentService';

const product = {
  id: 'skin-tamarai-oil',
  name: 'Tamarai Hair Oil',
  price: 1999,
  images: ['/img.jpg'],
};

function Seed({ children }) {
  const { add } = useCart();
  const seededRef = React.useRef(false);
  React.useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    add(product);
  }, [add]);
  return children;
}

function renderCheckout() {
  return render(
    <CartProvider>
      <Seed>
        <CheckoutForm onBack={() => {}} />
      </Seed>
    </CartProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe('CheckoutForm', () => {
  it('renders the form and totals with Razorpay pay button', () => {
    renderCheckout();
    expect(screen.getByTestId('checkout-name')).toBeInTheDocument();
    expect(screen.getByTestId('checkout-email')).toBeInTheDocument();
    // The submit button now says "Pay" (Razorpay enabled)
    expect(screen.getByTestId('checkout-submit-btn')).toHaveTextContent(/pay/i);
  });

  it('records the order, creates a Razorpay order, and verifies payment on submit', async () => {
    const user = userEvent.setup();
    renderCheckout();

    await user.type(screen.getByTestId('checkout-name'), 'Ananya');
    await user.type(screen.getByTestId('checkout-email'), 'ananya@example.com');
    await user.type(screen.getByTestId('checkout-address'), '12 Weavers St');
    await user.type(screen.getByTestId('checkout-city'), 'Kanchipuram');
    await user.type(screen.getByTestId('checkout-state'), 'TN');
    await user.type(screen.getByTestId('checkout-postal'), '631502');

    await user.click(screen.getByTestId('checkout-submit-btn'));

    // Order was recorded, Razorpay order created, and payment verified
    await waitFor(() => {
      expect(createOrder).toHaveBeenCalledTimes(1);
      expect(createRazorpayOrder).toHaveBeenCalledTimes(1);
      expect(verifyPayment).toHaveBeenCalledTimes(1);
    });
  });
});
