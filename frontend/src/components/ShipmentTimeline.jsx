import React from 'react';
import { Check, Ban, RotateCcw } from 'lucide-react';
import { getShipmentStatusKey } from '@/lib/orderBadges';

// Customer-facing fulfillment journey. "Order Received" is internal only —
// customers see the order as "Order Placed" until it is being prepared.
const STEPS = [
  { key: 'order_placed', label: 'Order Placed' },
  { key: 'payment_successful', label: 'Payment Successful' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

// How far along the journey each stored shipment status sits.
const REACHED_INDEX = {
  waiting_for_payment: 0,
  order_received: 1,
  preparing: 2,
  packed: 3,
  shipped: 4,
  out_for_delivery: 5,
  delivered: 6,
};

const TERMINAL = {
  cancelled: { label: 'Cancelled', note: 'This order has been cancelled.', Icon: Ban, color: '#DC2626' },
  returned: { label: 'Returned', note: 'This order has been returned.', Icon: RotateCcw, color: '#6B7280' },
};

export default function ShipmentTimeline({ order }) {
  const status = getShipmentStatusKey(order);
  const terminal = TERMINAL[status];
  const paid = order?.payment_status === 'paid';

  // A paid order has cleared the payment step even if fulfillment hasn't started.
  let reached = REACHED_INDEX[status] ?? 0;
  if (paid && reached < 1) reached = 1;

  return (
    <div data-testid="shipment-timeline">
      {terminal ? (
        <div className="flex items-center gap-3">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#F5EBF0', color: terminal.color }}
          >
            <terminal.Icon className="w-4 h-4" />
          </span>
          <div>
            <div className="font-medium text-[#2E2825]">{terminal.label}</div>
            <div className="text-sm text-[#2E2825]/60">{terminal.note}</div>
          </div>
        </div>
      ) : (
        <ol className="space-y-0">
          {STEPS.map((step, i) => {
            const done = i <= reached;
            const isLast = i === STEPS.length - 1;
            return (
              <li key={step.key} className="flex gap-3" data-testid={`timeline-step-${step.key}`}>
                <div className="flex flex-col items-center">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                    style={
                      done
                        ? { background: '#8B2956', color: '#fff', boxShadow: '0 3px 6px rgba(139,41,86,0.28)' }
                        : { background: '#F5EBF0', color: '#B9A2AE', boxShadow: 'inset 0 2px 4px rgba(138,115,130,0.18)' }
                    }
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                  </span>
                  {!isLast && (
                    <span
                      className="w-0.5 flex-1 min-h-[18px] my-1 rounded-full"
                      style={{ background: i < reached ? '#8B2956' : '#EADFE5' }}
                    />
                  )}
                </div>
                <div className={`pb-3 text-sm ${done ? 'text-[#2E2825] font-medium' : 'text-[#2E2825]/40'}`}>
                  {step.label}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
