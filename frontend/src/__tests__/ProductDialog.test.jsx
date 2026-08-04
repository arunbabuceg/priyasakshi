import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { CartProvider } from '@/context/CartContext';
import ProductDialog from '@/components/ProductDialog';

const product = {
  id: 'skin-tamarai-oil',
  name: 'Tamarai 100-Herb Hair Oil',
  price: 1999,
  currency: 'INR',
  shortDescription: 'Signature herbal hair oil.',
  longDescription: 'Long description here.',
  images: ['/img-1.jpg', '/img-2.jpg'],
  tag: 'Signature',
};

const renderDialog = () =>
  render(
    <CartProvider>
      <ProductDialog product={product} open onOpenChange={() => {}} />
    </CartProvider>,
  );

describe('ProductDialog', () => {
  it('renders product details and gallery thumbnails when multiple images exist', () => {
    renderDialog();
    // Product name is present in both the (visually hidden) dialog title and
    // the visible heading \u2014 so we just require at least one match.
    expect(screen.getAllByText(product.name).length).toBeGreaterThan(0);
    expect(screen.getByText('Long description here.')).toBeInTheDocument();
    // gallery + 2 thumbs
    expect(screen.getByTestId('product-dialog-gallery-primary')).toBeInTheDocument();
    expect(screen.getByTestId('product-dialog-gallery-thumb-0')).toBeInTheDocument();
    expect(screen.getByTestId('product-dialog-gallery-thumb-1')).toBeInTheDocument();
  });

  it('adds the product to the basket', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByTestId('dialog-add-to-cart'));
    // Once added, the qty controls take over
    expect(await screen.findByTestId('dialog-qty-controls')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-qty-value')).toHaveTextContent('1');
  });
});
