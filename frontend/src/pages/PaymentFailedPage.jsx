import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, ShoppingBag } from 'lucide-react';
import { ClayShapes } from '@/components/ClayShapes';

export default function PaymentFailedPage() {
  const [params] = useSearchParams();
  const reason = params.get('reason') || '';
  const cancelled = /cancel/i.test(reason);
  const uncertain = /network|timeout|verification|could not|failed to fetch/i.test(reason);

  return (
    <div className="min-h-screen bg-[#FAF5F8] relative overflow-hidden flex items-center justify-center px-4 py-20" data-testid="payment-failed-page">
      <ClayShapes variant="hero" />
      <motion.div
        className="clay-card p-10 sm:p-14 max-w-lg w-full text-center relative z-10"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-[#F5E4E7] mb-5">
          <AlertCircle className="w-10 h-10 text-[#8B2956]" />
        </div>
        <h1 className="font-serif-display text-3xl sm:text-4xl text-[#8B2956]">
          {cancelled ? 'Payment cancelled' : uncertain ? 'We could not confirm your payment' : 'Payment unsuccessful'}
        </h1>
        <p className="mt-4 text-[#2E2825]/75 leading-relaxed">
          {uncertain
            ? 'A connection or verification issue interrupted checkout. Your basket has been kept. Before trying again, check your Razorpay payment history or contact us if money was deducted.'
            : cancelled
              ? 'Checkout was closed before completion. Your basket is still saved, so you can return and try again whenever you are ready.'
              : 'The payment did not complete. Your basket is still saved, and you can return to checkout to try again.'}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="clay-btn-primary px-6 py-3.5 inline-flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Return to shop
          </Link>
          <Link to="/" className="px-6 py-3.5 inline-flex items-center gap-2 rounded-full border border-[#8B2956]/25 text-[#8B2956]">
            <ArrowLeft className="w-4 h-4" /> Continue shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
