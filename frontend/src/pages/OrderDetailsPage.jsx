import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Truck, CreditCard, Loader as Loader2, Package } from 'lucide-react';
import { getOrder } from '@/services/orderHistoryService';
import { formatINR } from '@/lib/format';
import { ClayShapes } from '@/components/ClayShapes';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const PAYMENT_LABEL = { paid: 'Paid', pending: 'Pending', unpaid: 'Unpaid', failed: 'Failed' };
const STATUS_LABEL = {
  received: 'Received',
  pending_payment: 'Awaiting Payment',
  paid: 'Paid',
  shipped: 'Shipped',
  cancelled: 'Cancelled',
};

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    getOrder(orderId)
      .then((res) => {
        if (!mounted) return;
        if (res.ok) setOrder(res.data);
        else setError(res.error || 'Could not load order');
      })
      .catch(() => mounted && setError('Could not load order'))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [orderId]);

  const shipping = order?.shipping || {};
  const timeline = order?.timeline || [];

  return (
    <div className="min-h-screen bg-[#FAF7F2] relative overflow-hidden px-4 py-28 md:py-32">
      <ClayShapes variant="hero" />
      <div className="relative max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/account/orders')}
          className="clay-btn-ghost h-10 px-4 inline-flex items-center gap-2 text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>

        {loading ? (
          <div className="clay-card p-10 flex flex-col items-center text-[#2E2825]/60">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            Loading order…
          </div>
        ) : error ? (
          <div className="clay-card p-10 text-center">
            <h2 className="font-serif-display text-2xl text-[#2E2825]">{error}</h2>
            <button onClick={() => navigate('/account/orders')} className="mt-6 clay-btn-primary h-12 px-6">
              Back to Orders
            </button>
          </div>
        ) : order ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            {/* Header */}
            <div className="clay-card p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="clay-pill">Order</span>
                  <h1 className="mt-3 font-serif-display text-3xl text-[#8B2956]">
                    #{String(order.id).slice(0, 8)}
                  </h1>
                  <p className="text-sm text-[#2E2825]/60 mt-1">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <div className="font-serif-display text-3xl text-[#8B2956]" data-testid="order-detail-total">
                    {formatINR(order.total)}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-[#2E2825]/50 mt-1">
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="clay-pill" style={{ background: '#F3EBDC', color: '#8A9A5B' }} data-testid="order-detail-status">
                  {STATUS_LABEL[order.status] || order.status}
                </span>
                <span className="clay-pill" style={{ background: '#F3D2A8', color: '#A06A2C' }} data-testid="order-detail-payment">
                  {PAYMENT_LABEL[order.payment_status] || order.payment_status}
                </span>
              </div>
            </div>

            {/* Products */}
            <div className="clay-card p-6 sm:p-8" data-testid="order-detail-products">
              <h2 className="font-serif-display text-2xl text-[#2E2825] mb-4">Products</h2>
              <ul className="space-y-3">
                {order.items?.map((it, i) => (
                  <li key={i} className="flex items-center justify-between gap-4 pb-3 border-b border-[#EFE6D6] last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: '#F3EBDC', boxShadow: 'inset 0 -3px 6px rgba(138,115,104,0.15), inset 0 3px 6px rgba(255,255,255,0.9)' }}
                      >
                        <Package className="w-5 h-5 text-[#8B2956]" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-[#2E2825] truncate">{it.name || it.product_id}</div>
                        <div className="text-xs text-[#2E2825]/60">Qty: {it.quantity}</div>
                      </div>
                    </div>
                    <div className="font-serif-display text-lg text-[#8B2956] flex-shrink-0">
                      {formatINR((it.price || 0) * it.quantity)}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-[#2E2825]/70">Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-[#2E2825]/70">Shipping</span><span>{order.shipping_fee === 0 ? 'FREE' : formatINR(order.shipping_fee)}</span></div>
                <div className="flex justify-between font-serif-display text-xl text-[#8B2956] pt-1"><span>Total</span><span>{formatINR(order.total)}</span></div>
              </div>
            </div>

            {/* Shipping address */}
            <div className="clay-card-cream p-6 sm:p-8" data-testid="order-detail-shipping">
              <h2 className="font-serif-display text-2xl text-[#8B2956] mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Shipping Address
              </h2>
              <div className="text-sm text-[#2E2825]/80 leading-relaxed">
                <div className="font-medium text-[#2E2825]">{order.customer_name}</div>
                {shipping.line1 && <div>{shipping.line1}</div>}
                {shipping.line2 && <div>{shipping.line2}</div>}
                <div>
                  {[shipping.city, shipping.state, shipping.postal_code].filter(Boolean).join(', ')}
                </div>
                <div>{shipping.country}</div>
                {order.phone && <div className="mt-1">Phone: {order.phone}</div>}
              </div>
            </div>

            {/* Tracking */}
            {(order.tracking_number || order.courier || order.estimated_delivery) && (
              <div className="clay-card p-6 sm:p-8" data-testid="order-detail-tracking">
                <h2 className="font-serif-display text-2xl text-[#2E2825] mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" /> Tracking
                </h2>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  {order.tracking_number && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-[#2E2825]/50">Tracking Number</div>
                      <div className="font-medium text-[#2E2825] mt-1">{order.tracking_number}</div>
                    </div>
                  )}
                  {order.courier && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-[#2E2825]/50">Courier</div>
                      <div className="font-medium text-[#2E2825] mt-1">{order.courier}</div>
                    </div>
                  )}
                  {order.estimated_delivery && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-[#2E2825]/50">Estimated Delivery</div>
                      <div className="font-medium text-[#2E2825] mt-1">{formatDate(order.estimated_delivery)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="clay-card p-6 sm:p-8" data-testid="order-detail-timeline">
              <h2 className="font-serif-display text-2xl text-[#2E2825] mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Timeline
              </h2>
              {timeline.length === 0 ? (
                <p className="text-sm text-[#2E2825]/60">No updates yet.</p>
              ) : (
                <ol className="relative border-l-2 border-[#EFE6D6] ml-3 space-y-5">
                  {timeline.map((t, i) => (
                    <li key={i} className="ml-5 relative">
                      <span
                        className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 border-white"
                        style={{ background: '#8B2956', boxShadow: '0 2px 4px rgba(139,41,86,0.3)' }}
                      />
                      <div className="font-medium text-[#2E2825]">{t.label || t.status}</div>
                      {t.note && <div className="text-sm text-[#2E2825]/70">{t.note}</div>}
                      <div className="text-xs text-[#2E2825]/50 mt-0.5">{formatDate(t.at)}</div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
