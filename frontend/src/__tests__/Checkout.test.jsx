import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartProvider, useCart } from '@/context/CartContext';
import CheckoutForm from '@/components/CheckoutForm';

// Mock the order service so tests don't try to hit the backend.
vi.mock('@/services/orderService', () => ({
  createOrder: vi.fn().mockResolvedValue({ ok: true, data: { order_id: 'test-id' } }),
}));

import { createOrder } from '@/services/orderService';

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
  it('renders the form and totals', () => {
    renderCheckout();
    expect(screen.getByTestId('checkout-name')).toBeInTheDocument();
    expect(screen.getByTestId('checkout-email')).toBeInTheDocument();
    // "Online payments will be available soon." copy is shown
    expect(screen.getByText(/Online payments will be available soon/i)).toBeInTheDocument();
  });

  it('records the order and does not attempt payment on submit', async () => {
    const user = userEvent.setup();
    renderCheckout();

    await user.type(screen.getByTestId('checkout-name'), 'Ananya');
    await user.type(screen.getByTestId('checkout-email'), 'ananya@example.com');
    await user.type(screen.getByTestId('checkout-address'), '12 Weavers St');
    await user.type(screen.getByTestId('checkout-city'), 'Kanchipuram');
    await user.type(screen.getByTestId('checkout-state'), 'TN');
    await user.type(screen.getByTestId('checkout-postal'), '631502');

    await user.click(screen.getByTestId('checkout-submit-btn'));

    // Order was recorded once, no navigation happened
    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(window.location.href).not.toMatch(/checkout|stripe|razorpay/i);
  });
});
