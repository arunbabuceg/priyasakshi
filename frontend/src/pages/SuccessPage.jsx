import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CircleCheck as CheckCircle2, ArrowLeft } from 'lucide-react';
import { ClayShapes, KolamStar } from '@/components/ClayShapes';

/**
 * SuccessPage — shown after POST /api/verify-payment confirms a Razorpay
 * payment. Layout/styling is unchanged from the pre-payment placeholder;
 * only the copy and icon reflect a completed order now.
 */
export default function SuccessPage() {
  return (
    <div
      className="min-h-screen bg-[#FAF7F2] relative overflow-hidden flex items-center justify-center px-4 py-20"
      data-testid="success-page"
    >
      <ClayShapes variant="hero" />
      <motion.div
        className="clay-card p-10 sm:p-14 max-w-lg w-full text-center relative z-10"
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-center mb-4 animate-spin-slow">
          <KolamStar size={70} color="#8A9A5B" />
        </div>
        <div
          className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, #F3D2A8 0%, #D4A373 100%)',
            boxShadow: '0 20px 30px rgba(180,140,90,0.3), inset 0 -6px 12px rgba(100,60,20,0.25), inset 0 6px 12px rgba(255,255,255,0.5)',
          }}
          data-testid="success-icon"
        >
          <CheckCircle2 className="w-9 h-9 text-white" />
        </div>
        <h1
          className="mt-6 font-serif-display text-4xl sm:text-5xl text-[#8B2956] leading-tight"
          data-testid="success-title"
        >
          Order confirmed.
        </h1>
        <p className="mt-4 text-[#2E2825]/75 leading-relaxed">
          Your payment was successful and your order is on its way to being packed. We&apos;ve
          emailed you a confirmation with the details.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="clay-btn-primary px-6 py-3.5 inline-flex items-center gap-2"
            data-testid="success-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
