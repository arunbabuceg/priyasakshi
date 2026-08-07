import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { ClayShapes } from '@/components/ClayShapes';


/**
 * CancelPage — kept for future payment-provider integration. Currently
 * displays the same friendly "coming soon" copy since payments are disabled.
 */
export default function CancelPage() {
  return (
    <div
      className="min-h-screen bg-[#FAF5F8] relative overflow-hidden flex items-center justify-center px-4 py-20"
      data-testid="cancel-page"
    >
      <ClayShapes variant="hero" />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="clay-card p-10 sm:p-14 max-w-lg w-full text-center relative z-10"
      >
        <div
          className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, #E8C4D0 0%, #D9B5C0 100%)',
            boxShadow: '0 20px 30px rgba(180,140,160,0.3), inset 0 -6px 12px rgba(100,60,80,0.25), inset 0 6px 12px rgba(255,255,255,0.5)',
          }}
        >
          <ShoppingBag className="w-9 h-9 text-white" />
        </div>
        <h1 className="mt-6 font-serif-display text-4xl text-[#2E2825]">
          No harm done —
          <br />
          <em className="italic text-[#8B2956]">your basket is waiting.</em>
        </h1>
        <p className="mt-4 text-[#2E2825]/70">
          Online payments will be available soon. Nothing has been charged.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="clay-btn-primary px-6 py-3.5 inline-flex items-center gap-2"
            data-testid="cancel-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
