import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CircleX, ArrowLeft } from 'lucide-react';
import { ClayShapes, KolamStar } from '@/components/ClayShapes';

/**
 * PaymentFailurePage — shown when Razorpay checkout fails or the server
 * rejects the payment signature. The basket is preserved so the shopper can
 * try again from the checkout.
 */
export default function PaymentFailurePage() {
  const location = useLocation();
  const reason = location.state?.reason || 'We could not process your payment.';

  return (
    <div
      className="min-h-screen bg-[#FAF5F8] relative overflow-hidden flex items-center justify-center px-4 py-20"
      data-testid="payment-failure-page"
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
          data-testid="payment-failure-icon"
        >
          <CircleX className="w-9 h-9 text-white" />
        </div>
        <h1
          className="mt-6 font-serif-display text-4xl sm:text-5xl text-[#8B2956] leading-tight"
          data-testid="payment-failure-title"
        >
          Payment could not be completed.
        </h1>
        <p className="mt-4 text-[#2E2825]/75 leading-relaxed">
          {reason} Your basket is still waiting, so you can try again whenever you are ready.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="clay-btn-primary px-6 py-3.5 inline-flex items-center gap-2"
            data-testid="payment-failure-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
