import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ClayShapes, KolamStar } from '@/components/ClayShapes';
import { useCart } from '@/context/CartContext';
import { verifyPayment } from '@/services/paymentService';

/**
 * PaymentPendingPage — shown when Razorpay reports a successful payment but
 * the server verification call failed due to a network error (no response).
 *
 * The basket is intentionally preserved so the order can be retried. The
 * shopper can re-run the verification here using the cached Razorpay handle
 * (order/payment/signature) passed via router state.
 */
export default function PaymentPendingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clear, setIsOpen } = useCart();
  const [retrying, setRetrying] = useState(false);

  const {
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = location.state || {};

  const canRetry = !!(orderId && razorpayOrderId && razorpayPaymentId && razorpaySignature);

  const retryVerification = async () => {
    if (!canRetry) return;
    setRetrying(true);
    try {
      const result = await verifyPayment({
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });
      if (result.ok && result.data?.success) {
        clear();
        setIsOpen(false);
        navigate('/success', { replace: true });
      } else if (result.retryable) {
        toast.error('Still no connection to the server. Please try again in a moment.');
      } else {
        toast.error(result.error || 'Payment verification failed.');
        navigate('/payment-failure', {
          replace: true,
          state: { reason: result.error },
        });
      }
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#FAF5F8] relative overflow-hidden flex items-center justify-center px-4 py-20"
      data-testid="payment-pending-page"
    >
      <ClayShapes variant="hero" />
      <motion.div
        className="clay-card p-10 sm:p-14 max-w-lg w-full text-center relative z-10"
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-center mb-4 animate-spin-slow">
          <KolamStar size={70} color="#9B8BB4" />
        </div>
        <div
          className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, #E8C4D0 0%, #D9B5C0 100%)',
            boxShadow:
              '0 20px 30px rgba(180,140,160,0.3), inset 0 -6px 12px rgba(100,60,80,0.25), inset 0 6px 12px rgba(255,255,255,0.5)',
          }}
          data-testid="payment-pending-icon"
        >
          <Clock className="w-9 h-9 text-white" />
        </div>
        <h1
          className="mt-6 font-serif-display text-4xl sm:text-5xl text-[#8B2956] leading-tight"
          data-testid="payment-pending-title"
        >
          Your payment is being confirmed.
        </h1>
        <p className="mt-4 text-[#2E2825]/75 leading-relaxed">
          We received your payment but could not reach our server to confirm it. Don&apos;t worry
          &mdash; your money is safe. Please retry the confirmation below once you are back online.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {canRetry && (
            <button
              type="button"
              onClick={retryVerification}
              disabled={retrying}
              className="clay-btn-primary px-6 py-3.5 inline-flex items-center gap-2 disabled:opacity-70"
              data-testid="payment-pending-retry"
            >
              <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
              {retrying ? 'Confirming…' : 'Confirm payment'}
            </button>
          )}
          <Link
            to="/"
            className="clay-btn-ghost px-6 py-3.5 inline-flex items-center gap-2"
            data-testid="payment-pending-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
