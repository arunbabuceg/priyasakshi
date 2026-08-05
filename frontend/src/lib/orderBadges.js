import { CircleCheck as CheckCircle, Clock, Circle as XCircle, RotateCcw, Loader, Package, Truck, PackageCheck, Ban, CircleDot } from 'lucide-react';

export const PAYMENT_BADGE = {
  paid: { bg: '#DCFCE7', color: '#15803D', label: 'Paid', Icon: CheckCircle },
  pending: { bg: '#FEF3C7', color: '#B45309', label: 'Pending', Icon: Clock },
  failed: { bg: '#FEE2E2', color: '#DC2626', label: 'Failed', Icon: XCircle },
  refunded: { bg: '#F3F4F6', color: '#6B7280', label: 'Refunded', Icon: RotateCcw },
};

export const ORDER_BADGE = {
  pending: { bg: '#FEF3C7', color: '#B45309', label: 'Pending', Icon: Clock },
  confirmed: { bg: '#DBEAFE', color: '#2563EB', label: 'Confirmed', Icon: CheckCircle },
  processing: { bg: '#DBEAFE', color: '#2563EB', label: 'Processing', Icon: Loader },
  packed: { bg: '#F3E8FF', color: '#9333EA', label: 'Packed', Icon: Package },
  shipped: { bg: '#E0E7FF', color: '#4F46E5', label: 'Shipped', Icon: Truck },
  out_for_delivery: { bg: '#E0E7FF', color: '#4F46E5', label: 'Out for Delivery', Icon: Truck },
  delivered: { bg: '#DCFCE7', color: '#15803D', label: 'Delivered', Icon: PackageCheck },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled', Icon: Ban },
};

const FALLBACK = { bg: '#F5EBF0', color: '#2E2825', label: 'Processing', Icon: CircleDot };

export function getPaymentBadge(status) {
  const key = String(status || '').toLowerCase();
  return PAYMENT_BADGE[key] || { ...FALLBACK, label: status || 'Pending', Icon: Clock };
}

export function getOrderBadge(status) {
  const key = String(status || '').toLowerCase();
  if (!key) return ORDER_BADGE.processing;
  return ORDER_BADGE[key] || { ...FALLBACK, label: status };
}
