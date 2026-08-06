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
  CircleDot,
} from 'lucide-react';

// Payment status is read-only (set by the payment flow).
export const PAYMENT_BADGE = {
  paid: { bg: '#DCFCE7', color: '#15803D', label: 'Paid', Icon: CheckCircle },
  awaiting_payment: { bg: '#FEF3C7', color: '#B45309', label: 'Awaiting Payment', Icon: Clock },
  failed: { bg: '#FEE2E2', color: '#DC2626', label: 'Failed', Icon: XCircle },
  refunded: { bg: '#F3F4F6', color: '#6B7280', label: 'Refunded', Icon: RotateCcw },
};

// Order status is admin-editable (lifecycle).
export const ORDER_BADGE = {
  order_received: { bg: '#FEF3C7', color: '#B45309', label: 'Order Received', Icon: CheckCircle },
  preparing: { bg: '#DBEAFE', color: '#2563EB', label: 'Preparing', Icon: Loader },
  packed: { bg: '#F3E8FF', color: '#9333EA', label: 'Packed', Icon: Package },
  shipped: { bg: '#E0E7FF', color: '#4F46E5', label: 'Shipped', Icon: Truck },
  out_for_delivery: { bg: '#E0E7FF', color: '#4F46E5', label: 'Out for Delivery', Icon: Truck },
  delivered: { bg: '#DCFCE7', color: '#15803D', label: 'Delivered', Icon: PackageCheck },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled', Icon: Ban },
};

const PAYMENT_FALLBACK = { bg: '#FEF3C7', color: '#B45309', label: 'Awaiting Payment', Icon: Clock };
const ORDER_FALLBACK = { bg: '#F5EBF0', color: '#2E2825', label: 'Order Received', Icon: CircleDot };

// Legacy -> canonical maps so old badges still resolve after the split.
const LEGACY_PAYMENT = {
  unpaid: 'awaiting_payment',
  pending: 'awaiting_payment',
  awaiting: 'awaiting_payment',
  awaiting_payment: 'awaiting_payment',
  paid: 'paid',
  failed: 'failed',
  refunded: 'refunded',
};

const LEGACY_ORDER = {
  received: 'order_received',
  pending_payment: 'order_received',
  paid: 'preparing',
  confirmed: 'preparing',
  processing: 'preparing',
  preparing: 'preparing',
  packed: 'packed',
  shipped: 'shipped',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

export function getPaymentBadge(status) {
  const key = String(status || '').toLowerCase();
  const canonical = LEGACY_PAYMENT[key] || key;
  return PAYMENT_BADGE[canonical] || { ...PAYMENT_FALLBACK, label: status || 'Awaiting Payment' };
}

export function getOrderBadge(status) {
  const key = String(status || '').toLowerCase();
  const canonical = LEGACY_ORDER[key] || key;
  if (!key) return ORDER_BADGE.order_received;
  return ORDER_BADGE[canonical] || { ...ORDER_FALLBACK, label: status };
}
