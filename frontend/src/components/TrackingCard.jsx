import React from 'react';
import { Truck, ExternalLink } from 'lucide-react';
import { getCourierName, getTrackingLink } from '@/lib/couriers';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

/** Tracking details for an order; prompts to wait when no courier is assigned. */
export default function TrackingCard({ order }) {
  const link = getTrackingLink(order?.courier, order?.tracking_number);
  const hasCourier = Boolean(order?.courier);

  return (
    <div className="clay-card p-6 sm:p-8" data-testid="order-detail-tracking">
      <h2 className="font-serif-display text-2xl text-[#2E2825] mb-4 flex items-center gap-2">
        <Truck className="w-5 h-5" /> Tracking
      </h2>

      {!hasCourier ? (
        <p className="text-sm text-[#2E2825]/60" data-testid="tracking-pending">
          Tracking details will be available once your order is shipped.
        </p>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#2E2825]/50">Courier</div>
              <div className="font-medium text-[#2E2825] mt-1" data-testid="tracking-courier">
                {getCourierName(order.courier)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-[#2E2825]/50">Tracking Number</div>
              <div className="font-medium text-[#2E2825] mt-1 break-all" data-testid="tracking-number">
                {order.tracking_number || '—'}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-[#2E2825]/50">Estimated Delivery</div>
              <div className="font-medium text-[#2E2825] mt-1" data-testid="tracking-eta">
                {order.estimated_delivery ? formatDate(order.estimated_delivery) : 'To be confirmed'}
              </div>
            </div>
          </div>

          {link && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="clay-btn-primary h-12 px-6 inline-flex items-center gap-2 text-sm"
                data-testid="track-package-btn"
              >
                Track Package <ExternalLink className="w-4 h-4" />
              </a>
              {!link.prefilled && order.tracking_number && (
                <span className="text-xs text-[#2E2825]/60" data-testid="tracking-copy-hint">
                  Enter tracking number <strong className="text-[#2E2825]">{order.tracking_number}</strong> on the courier page.
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
