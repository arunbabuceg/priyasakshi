import {
  CircleCheck as CheckCircle,
  Clock,
  Circle as XCircle,
  RotateCcw,
  Loader,
  Package,
  Truck,
  PackageCheck,
  Ban,
  Hourglass,
} from 'lucide-react';

// Payment status is read-only (set by the payment flow).
export const PAYMENT_BADGE = {
  awaiting_payment: { bg: '#FEF3C7', color: '#B45309', label: 'Awaiting Payment', Icon: Clock },
  paid: { bg: '#DCFCE7', color: '#15803D', label: 'Paid', Icon: CheckCircle },
  failed: { bg: '#FEE2E2', color: '#DC2626', label: 'Failed', Icon: XCircle },
  refunded: { bg: '#F3F4F6', color: '#6B7280', label: 'Refunded', Icon: RotateCcw },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled', Icon: Ban },
};

// Shipment status is admin-controlled fulfillment progress.
export const SHIPMENT_BADGE = {
  waiting_for_payment: { bg: '#FEF3C7', color: '#B45309', label: 'Waiting for Payment', Icon: Hourglass },
  order_received: { bg: '#FDF2F8', color: '#8B2956', label: 'Order Received', Icon: CheckCircle },
  preparing: { bg: '#DBEAFE', color: '#2563EB', label: 'Preparing', Icon: Loader },
  packed: { bg: '#F3E8FF', color: '#9333EA', label: 'Packed', Icon: Package },
  shipped: { bg: '#E0E7FF', color: '#4F46E5', label: 'Shipped', Icon: Truck },
  out_for_delivery: { bg: '#E0E7FF', color: '#4F46E5', label: 'Out for Delivery', Icon: Truck },
  delivered: { bg: '#DCFCE7', color: '#15803D', label: 'Delivered', Icon: PackageCheck },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled', Icon: Ban },
  returned: { bg: '#F3F4F6', color: '#6B7280', label: 'Returned', Icon: RotateCcw },
};

// Legacy -> canonical maps so pre-split orders still resolve.
const LEGACY_PAYMENT = {
  unpaid: 'awaiting_payment',
  pending: 'awaiting_payment',
  awaiting: 'awaiting_payment',
  pending_payment: 'awaiting_payment',
  verified: 'paid',
  canceled: 'cancelled',
};

const LEGACY_SHIPMENT = {
  received: 'order_received',
  pending_payment: 'waiting_for_payment',
  awaiting_payment: 'waiting_for_payment',
  paid: 'order_received',
  confirmed: 'preparing',
  processing: 'preparing',
  canceled: 'cancelled',
};

export function getPaymentBadge(status) {
  const key = String(status || '').toLowerCase();
  const canonical = LEGACY_PAYMENT[key] || key;
  return PAYMENT_BADGE[canonical] || PAYMENT_BADGE.awaiting_payment;
}

export function getShipmentBadge(status) {
  const key = String(status || '').toLowerCase();
  const canonical = LEGACY_SHIPMENT[key] || key;
  return SHIPMENT_BADGE[canonical] || SHIPMENT_BADGE.waiting_for_payment;
}

// Orders written before payment/shipment were split only carry `status`.
export function readShipmentStatus(order) {
  return order?.shipment_status || order?.status;
}
