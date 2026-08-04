import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { CartProvider, useCart } from '@/context/CartContext';

const product = {
  id: 'saree-magenta-olive',
  name: 'Magenta & Olive Heritage Silk',
  price: 15999,
  images: ['/img.jpg'],
};

// Tiny harness that surfaces cart state to the DOM for assertions.
function Harness() {
  const { items, add, updateQty, remove, count, subtotal, total } = useCart();
  return (
    <div>
      <div data-testid="count">{count}</div>
      <div data-testid="subtotal">{subtotal}</div>
      <div data-testid="total">{total}</div>
      <div data-testid="items">{JSON.stringify(items.map((i) => [i.product.id, i.quantity]))}</div>
      <button onClick={() => add(product)}>add</button>
      <button onClick={() => updateQty(product.id, (items[0]?.quantity || 0) + 1)}>inc</button>
      <button onClick={() => updateQty(product.id, (items[0]?.quantity || 0) - 1)}>dec</button>
      <button onClick={() => remove(product.id)}>remove</button>
    </div>
  );
}

const renderCart = () =>
  render(
    <CartProvider>
      <Harness />
    </CartProvider>,
  );

beforeEach(() => {
  window.localStorage.clear();
});

describe('CartContext', () => {
  it('starts empty', () => {
    renderCart();
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('total')).toHaveTextContent('0');
  });

  it('adds an item and computes totals with shipping', async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByText('add'));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    // Subtotal 15999 >= 5000 threshold → free shipping
    expect(screen.getByTestId('subtotal')).toHaveTextContent('15999');
    expect(screen.getByTestId('total')).toHaveTextContent('15999');
  });

  it('increments and decrements quantity', async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByText('add'));
    await user.click(screen.getByText('inc'));
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    await user.click(screen.getByText('dec'));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('removing the last unit clears the item', async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByText('add'));
    await user.click(screen.getByText('remove'));
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('items')).toHaveTextContent('[]');
  });

  it('persists across mounts via localStorage', async () => {
    const user = userEvent.setup();
    const { unmount } = renderCart();
    await user.click(screen.getByText('add'));
    await act(async () => {}); // allow effect flush
    unmount();

    renderCart();
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
});
