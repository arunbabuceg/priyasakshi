import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Loader as Loader2 } from 'lucide-react';
import { getMyOrders } from '@/services/orderHistoryService';
import { formatINR } from '@/lib/format';
import { ClayShapes } from '@/components/ClayShapes';
import { getPaymentBadge, getShipmentBadge, readShipmentStatus } from '@/lib/orderBadges';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};



export default function MyOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getMyOrders()
      .then((res) => mounted && setOrders(res.data || []))
      .catch(() => mounted && setOrders([]))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF5F8] relative overflow-hidden px-4 py-28 md:py-32">
      <ClayShapes variant="hero" />
      <div className="relative max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/account')}
          className="clay-btn-ghost h-10 px-4 inline-flex items-center gap-2 text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="clay-card p-6 sm:p-8">
          <h1 className="font-serif-display text-4xl text-[#8B2956] leading-tight">My Orders</h1>

          {loading ? (
            <div className="mt-10 flex flex-col items-center text-[#2E2825]/60">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              Loading your orders…
            </div>
          ) : orders.length === 0 ? (
            <div className="mt-10 flex flex-col items-center text-center py-10">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                style={{
                  background: 'linear-gradient(180deg, #E8C4D0 0%, #D9B5C0 100%)',
                  boxShadow: '0 20px 30px rgba(180,140,160,0.3), inset 0 -6px 12px rgba(100,60,80,0.25), inset 0 6px 12px rgba(255,255,255,0.5)',
                }}
              >
                <Package className="w-9 h-9 text-white" />
              </div>
              <h3 className="font-serif-display text-2xl text-[#2E2825]">No orders yet</h3>
              <p className="text-sm text-[#2E2825]/60 mt-2 max-w-xs">
                When you place an order it will appear here with its status and tracking details.
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-6 clay-btn-primary h-12 px-6"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <ul className="mt-8 space-y-4">
              {orders.map((o, i) => {
                const pay = getPaymentBadge(o.payment_status);
                const ship = getShipmentBadge(readShipmentStatus(o));
                return (
                  <motion.li
                    key={o.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <button
                      onClick={() => navigate(`/account/orders/${o.id}`)}
                      className="clay-card-cream p-5 w-full text-left flex flex-col sm:flex-row sm:items-center gap-4 hover:-translate-y-0.5 transition-transform"
                      data-testid={`order-row-${o.id}`}
                    >
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: '#fff', boxShadow: 'inset 0 -3px 6px rgba(138,115,130,0.15), inset 0 3px 6px rgba(255,255,255,0.9)' }}
                      >
                        <Package className="w-5 h-5 text-[#8B2956]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-serif-display text-lg text-[#2E2825] truncate">
                          Order #{String(o.id).slice(0, 8)}
                        </div>
                        <div className="text-xs text-[#2E2825]/60 mt-0.5">{formatDate(o.created_at)}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="clay-pill inline-flex items-center gap-1"
                          style={{ background: pay.bg, color: pay.color }}
                          data-testid={`order-payment-${o.id}`}
                        >
                          <pay.Icon className="w-3.5 h-3.5" />
                          {pay.label}
                        </span>
                        <span
                          className="clay-pill inline-flex items-center gap-1"
                          style={{ background: ship.bg, color: ship.color }}
                          data-testid={`order-shipment-${o.id}`}
                        >
                          <ship.Icon className="w-3.5 h-3.5" />
                          {ship.label}
                        </span>
                        <span className="font-serif-display text-xl text-[#8B2956] ml-1" data-testid={`order-amount-${o.id}`}>
                          {formatINR(o.total)}
                        </span>
                      </div>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
