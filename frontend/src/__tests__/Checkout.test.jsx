import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartProvider, useCart } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import CheckoutForm from '@/components/CheckoutForm';

// Mock the order service so tests don't try to hit the backend.
vi.mock('@/services/orderService', () => ({
  createOrder: vi.fn().mockResolvedValue({ ok: true, data: { order_id: 'test-order-id' } }),
}));

// Mock profile + address services so CheckoutForm's prefill effect doesn't hit the network.
vi.mock('@/services/profileService', () => ({
  getProfile: vi.fn().mockResolvedValue({ ok: true, data: { name: 'Ananya', email: 'ananya@example.com', phone: '9876543210' } }),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
}));
vi.mock('@/services/addressService', () => ({
  getAddresses: vi.fn().mockResolvedValue({ ok: true, data: [] }),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
}));

// Mock authService so AuthProvider's getMe() on mount doesn't hit the network.
vi.mock('@/services/authService', () => ({
  getMe: vi.fn().mockResolvedValue({ ok: true, data: { id: 'u1', name: 'Ananya', email: 'ananya@example.com' } }),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn().mockResolvedValue({ ok: true }),
}));

// Mock the Razorpay payment service end-to-end so tests never load the real
// checkout.js script or touch the network.
vi.mock('@/services/paymentService', () => ({
  PAYMENTS_ENABLED: true,
  createRazorpayOrder: vi.fn().mockResolvedValue({
    ok: true,
    data: { order_id: 'rzp_order_test', amount: 199900, currency: 'INR' },
  }),
  loadRazorpayCheckout: vi.fn().mockResolvedValue(true),
  openRazorpayCheckout: vi.fn().mockResolvedValue({
    razorpayOrderId: 'rzp_order_test',
    razorpayPaymentId: 'rzp_payment_test',
    razorpaySignature: 'test_signature',
  }),
  verifyPayment: vi.fn().mockResolvedValue({ ok: true, data: { success: true } }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { createOrder } from '@/services/orderService';
import { createRazorpayOrder, openRazorpayCheckout, verifyPayment } from '@/services/paymentService';

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
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <Seed>
            <CheckoutForm onBack={() => {}} />
          </Seed>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

async function fillAndSubmit() {
  const user = userEvent.setup();
  renderCheckout();

  // Wait for the auth prefill effect to populate name/email, then clear and
  // type our test values so we don't end up with concatenated strings.
  await waitFor(() => screen.getByTestId('checkout-name'));

  await user.clear(screen.getByTestId('checkout-name'));
  await user.clear(screen.getByTestId('checkout-email'));
  await user.type(screen.getByTestId('checkout-name'), 'Ananya');
  await user.type(screen.getByTestId('checkout-email'), 'ananya@example.com');
  await user.type(screen.getByTestId('checkout-address'), '12 Weavers St');
  await user.type(screen.getByTestId('checkout-city'), 'Kanchipuram');
  await user.type(screen.getByTestId('checkout-state'), 'TN');
  await user.type(screen.getByTestId('checkout-postal'), '631502');

  await user.click(screen.getByTestId('checkout-submit-btn'));
}

describe('CheckoutForm', () => {
  it('renders the form with a Pay button showing the total', () => {
    renderCheckout();
    expect(screen.getByTestId('checkout-name')).toBeInTheDocument();
    expect(screen.getByTestId('checkout-email')).toBeInTheDocument();
    expect(screen.getByTestId('checkout-submit-btn')).toHaveTextContent(/Pay/i);
  });

  it('records the order, opens Razorpay checkout, verifies payment, then redirects to /success', async () => {
    await fillAndSubmit();

    await waitFor(() => expect(verifyPayment).toHaveBeenCalledTimes(1));

    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(createRazorpayOrder).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'test-order-id' }),
    );
    expect(openRazorpayCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ razorpayOrderId: 'rzp_order_test' }),
    );
    expect(verifyPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'test-order-id',
        razorpayPaymentId: 'rzp_payment_test',
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/success');
  });
});
