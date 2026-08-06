import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Package, Truck, CreditCard, Save, ExternalLink, Loader as Loader2 } from 'lucide-react';
import { getAdminOrder, updateAdminOrder } from '@/services/adminService';
import { formatINR } from '@/lib/format';
import OrderItemsList from '@/components/OrderItemsList';
import { getPaymentBadge, getShipmentBadge, readShipmentStatus } from '@/lib/orderBadges';
import { COURIERS, getCourier, getCourierName, getTrackingLink } from '@/lib/couriers';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

const SHIPMENT_STATUS_OPTIONS = [
  { value: 'waiting_for_payment', label: 'Waiting for Payment' },
  { value: 'order_received', label: 'Order Received' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
];

// Shipment cannot progress past the pre-payment stage until payment is Paid.
const PAID_ONLY_STATUSES = [
  'order_received',
  'preparing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'returned',
];

export default function AdminOrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ shipment_status: '', courier: '', tracking_number: '', estimated_delivery: '', internal_notes: '' });

  useEffect(() => {
    let mounted = true;
    getAdminOrder(orderId)
      .then((res) => {
        if (!mounted) return;
        if (res.ok) {
          setOrder(res.data);
          setForm({
            shipment_status: readShipmentStatus(res.data) || 'waiting_for_payment',
            courier: res.data.courier || '',
            tracking_number: res.data.tracking_number || '',
            estimated_delivery: res.data.estimated_delivery ? res.data.estimated_delivery.slice(0, 10) : '',
            internal_notes: res.data.internal_notes || '',
          });
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [orderId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      shipment_status: form.shipment_status || undefined,
      // Sent as empty strings (not undefined) so a field can also be cleared.
      courier: form.courier,
      tracking_number: form.tracking_number,
      estimated_delivery: form.estimated_delivery ? new Date(form.estimated_delivery).toISOString() : '',
      internal_notes: form.internal_notes,
    };
    const res = await updateAdminOrder(orderId, payload);
    setSaving(false);
    if (res.ok) {
      setOrder(res.data);
      setForm((f) => ({ ...f, shipment_status: readShipmentStatus(res.data) || f.shipment_status }));
      toast.success('Order updated');
    } else {
      toast.error(res.error || 'Could not update order');
    }
  };

  if (loading) {
    return <div className="clay-card p-10 flex items-center justify-center text-[#2E2825]/60"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading order…</div>;
  }
  if (!order) {
    return (
      <div className="clay-card p-10 text-center">
        <h2 className="font-serif-display text-2xl text-[#2E2825]">Order not found</h2>
        <button onClick={() => navigate('/admin/orders')} className="mt-6 clay-btn-primary h-12 px-6">Back to Orders</button>
      </div>
    );
  }

  const shipping = order.shipping || {};
  const timeline = order.timeline || [];
  const pay = getPaymentBadge(order.payment_status);
  const ship = getShipmentBadge(readShipmentStatus(order));
  const isPaid = order.payment_status === 'paid';
  // Legacy free-text couriers stay selectable until the admin picks a catalog entry.
  const knownCourier = getCourier(form.courier);
  const isUnknownCourier = Boolean(form.courier) && !knownCourier;
  const courierValue = knownCourier ? knownCourier.code : form.courier;
  const trackingLink = getTrackingLink(form.courier, form.tracking_number);

  return (
    <div>
      <button onClick={() => navigate('/admin/orders')} className="clay-btn-ghost h-10 px-4 inline-flex items-center gap-2 text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </button>

      <div className="space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="clay-card p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="clay-pill">Order</span>
              <h1 className="mt-3 font-serif-display text-3xl text-[#8B2956]">#{String(order.id).slice(0, 8)}</h1>
              <p className="text-sm text-[#2E2825]/60 mt-1">{formatDate(order.created_at)}</p>
            </div>
            <div className="text-right">
              <div className="font-serif-display text-3xl text-[#8B2956]">{formatINR(order.total)}</div>
              <div className="text-xs uppercase tracking-widest text-[#2E2825]/50 mt-1">{order.items?.length || 0} item(s)</div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="clay-pill inline-flex items-center gap-1" style={{ background: pay.bg, color: pay.color }} data-testid="admin-order-payment-status"><pay.Icon className="w-3.5 h-3.5" />Payment: {pay.label}</span>
            <span className="clay-pill inline-flex items-center gap-1" style={{ background: ship.bg, color: ship.color }} data-testid="admin-order-shipment-badge"><ship.Icon className="w-3.5 h-3.5" />Shipment: {ship.label}</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Products */}
          <div className="clay-card p-6 sm:p-8">
            <h2 className="font-serif-display text-2xl text-[#2E2825] mb-4 flex items-center gap-2"><Package className="w-5 h-5" /> Products</h2>
            <OrderItemsList items={order.items} testId="admin-order-products" />
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-[#2E2825]/70">Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-[#2E2825]/70">Shipping</span><span>{order.shipping_fee === 0 ? 'FREE' : formatINR(order.shipping_fee)}</span></div>
              <div className="flex justify-between font-serif-display text-xl text-[#8B2956] pt-1"><span>Total</span><span>{formatINR(order.total)}</span></div>
            </div>
          </div>

          {/* Customer + shipping */}
          <div className="clay-card-cream p-6 sm:p-8">
            <h2 className="font-serif-display text-2xl text-[#8B2956] mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" /> Customer & Shipping</h2>
            <div className="text-sm text-[#2E2825]/80 leading-relaxed">
              <div className="font-medium text-[#2E2825]">{order.customer_name}</div>
              <div>{order.customer_email}</div>
              {order.phone && <div>Phone: {order.phone}</div>}
              <div className="mt-3 pt-3 border-t border-[#E0D2DD]">
                {shipping.line1 && <div>{shipping.line1}</div>}
                <div>{[shipping.city, shipping.state, shipping.postal_code].filter(Boolean).join(', ')}</div>
                <div>{shipping.country}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Update form */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="clay-card p-6 sm:p-8">
          <h2 className="font-serif-display text-2xl text-[#8B2956] mb-2 flex items-center gap-2"><Truck className="w-5 h-5" /> Update Order</h2>
          <p className="text-xs text-[#2E2825]/60 mb-5">
            Payment status is read-only and set automatically by the payment provider.
            {isPaid
              ? ' Edit the fields below to update the shipment and fulfillment details.'
              : ' Shipment status stays “Waiting for Payment” until the payment is Paid.'}
          </p>
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-[#2E2825]/60 ml-3">Shipment Status</span>
                <select className="clay-input mt-1.5" value={form.shipment_status} onChange={(e) => setForm((f) => ({ ...f, shipment_status: e.target.value }))} data-testid="admin-order-shipment-select">
                  {SHIPMENT_STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value} disabled={!isPaid && PAID_ONLY_STATUSES.includes(s.value)}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-[#2E2825]/60 ml-3">Courier</span>
                <select className="clay-input mt-1.5" value={courierValue} onChange={(e) => setForm((f) => ({ ...f, courier: e.target.value }))} data-testid="admin-order-courier-input">
                  <option value="">Not assigned</option>
                  {COURIERS.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                  {isUnknownCourier && <option value={form.courier}>{form.courier}</option>}
                </select>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-[#2E2825]/60 ml-3">Tracking Number</span>
                <input className="clay-input mt-1.5" value={form.tracking_number} onChange={(e) => setForm((f) => ({ ...f, tracking_number: e.target.value }))} data-testid="admin-order-tracking-input" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-[#2E2825]/60 ml-3">Estimated Delivery</span>
                <input type="date" className="clay-input mt-1.5" value={form.estimated_delivery} onChange={(e) => setForm((f) => ({ ...f, estimated_delivery: e.target.value }))} data-testid="admin-order-eta-input" />
              </label>
            </div>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-[#2E2825]/60 ml-3">Internal Notes</span>
              <textarea className="clay-input mt-1.5 min-h-[100px] resize-none" value={form.internal_notes} onChange={(e) => setForm((f) => ({ ...f, internal_notes: e.target.value }))} placeholder="Notes visible only to admins" data-testid="admin-order-notes-input" />
            </label>
            {trackingLink && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#2E2825]/60">
                <a
                  href={trackingLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clay-btn-ghost h-10 px-4 inline-flex items-center gap-2 text-sm"
                  data-testid="admin-order-track-link"
                >
                  Track Package <ExternalLink className="w-4 h-4" />
                </a>
                <span>
                  {trackingLink.prefilled
                    ? `Opens ${getCourierName(form.courier)} with the tracking number pre-filled.`
                    : `${getCourierName(form.courier)} does not support pre-filled links — the number is shown beside the button for the customer.`}
                </span>
              </div>
            )}
            <button type="submit" disabled={saving} className="clay-btn-primary h-14 px-8 flex items-center gap-2 disabled:opacity-70" data-testid="admin-order-save-btn">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </motion.div>

        {/* Timeline */}
        <div className="clay-card p-6 sm:p-8">
          <h2 className="font-serif-display text-2xl text-[#2E2825] mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Timeline</h2>
          {timeline.length === 0 ? (
            <p className="text-sm text-[#2E2825]/60">No updates yet.</p>
          ) : (
            <ol className="relative border-l-2 border-[#EADFE5] ml-3 space-y-5">
              {timeline.map((t, i) => (
                <li key={i} className="ml-5 relative">
                  <span className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 border-white" style={{ background: '#8B2956', boxShadow: '0 2px 4px rgba(139,41,86,0.3)' }} />
                  <div className="font-medium text-[#2E2825]">{t.label || t.status}</div>
                  {t.note && <div className="text-sm text-[#2E2825]/70">{t.note}</div>}
                  <div className="text-xs text-[#2E2825]/50 mt-0.5">{formatDate(t.at)}</div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
