import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import OrderItemsList from '@/components/OrderItemsList';
import TrackingCard from '@/components/TrackingCard';
import ShipmentTimeline from '@/components/ShipmentTimeline';
import { getCustomerShipmentBadge, getShipmentBadge } from '@/lib/orderBadges';
import { getCourierName, getTrackingLink } from '@/lib/couriers';

describe('customer shipment labels', () => {
  it('never shows "Order Received" to customers', () => {
    expect(getCustomerShipmentBadge('order_received').label).toBe('Order Placed');
    expect(getCustomerShipmentBadge('waiting_for_payment').label).toBe('Order Placed');
    // Legacy documents that only stored `status: paid`.
    expect(getCustomerShipmentBadge('paid').label).toBe('Order Placed');
    expect(getCustomerShipmentBadge('out_for_delivery').label).toBe('Out for Delivery');
  });

  it('keeps "Order Received" for admins', () => {
    expect(getShipmentBadge('order_received').label).toBe('Order Received');
  });
});

describe('courier mapping', () => {
  it('pre-fills the tracking number when the courier supports it', () => {
    const link = getTrackingLink('delhivery', 'ABC123');
    expect(link.prefilled).toBe(true);
    expect(link.url).toContain('ABC123');
  });

  it('falls back to the courier tracking page otherwise', () => {
    const link = getTrackingLink('india_post', 'EE123456789IN');
    expect(link.prefilled).toBe(false);
    expect(link.url).not.toContain('EE123456789IN');
  });

  it('resolves couriers stored as free text before the dropdown existed', () => {
    expect(getCourierName('BlueDart')).toBe('Blue Dart');
    expect(getTrackingLink('BlueDart', '999').prefilled).toBe(true);
  });
});

describe('order item thumbnails', () => {
  it('renders the stored image', () => {
    render(<OrderItemsList items={[{ product_id: 'x', name: 'Silk Saree', quantity: 2, price: 100, image: 'https://cdn.test/s.jpg' }]} />);
    expect(screen.getByAltText('Silk Saree')).toHaveAttribute('src', 'https://cdn.test/s.jpg');
  });

  it('falls back to the catalog image for legacy items without one', () => {
    render(<OrderItemsList items={[{ product_id: 'saree-magenta-olive', name: 'Magenta & Olive Heritage Silk', quantity: 1, price: 1 }]} />);
    expect(screen.getByAltText('Magenta & Olive Heritage Silk')).toBeInTheDocument();
  });
});

describe('tracking card', () => {
  it('prompts to wait when no courier is assigned', () => {
    render(<TrackingCard order={{ id: '1' }} />);
    expect(screen.getByTestId('tracking-pending')).toBeInTheDocument();
    expect(screen.queryByTestId('track-package-btn')).toBeNull();
  });

  it('shows the tracking number beside the button for couriers without pre-fill', () => {
    render(<TrackingCard order={{ id: '1', courier: 'st_courier', tracking_number: 'ST99' }} />);
    expect(screen.getByTestId('track-package-btn')).toBeInTheDocument();
    expect(screen.getByTestId('tracking-copy-hint')).toHaveTextContent('ST99');
  });
});

describe('shipment timeline', () => {
  it('marks completed steps up to the current status', () => {
    render(<ShipmentTimeline order={{ payment_status: 'paid', shipment_status: 'packed' }} />);
    expect(screen.getByTestId('timeline-step-payment_successful')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-step-delivered')).toBeInTheDocument();
  });
});
