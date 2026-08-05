import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CircleCheck as CheckCircle2, Loader as Loader2 } from 'lucide-react';
import { verifyEmail } from '@/services/authService';
import { ClayShapes } from '@/components/ClayShapes';

export default function VerifyEmailPage() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    verifyEmail(token).then((res) => {
      setStatus(res.ok ? 'success' : 'error');
      if (res.ok) toast.success('Email verified');
    });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#FAF5F8] relative overflow-hidden flex items-center justify-center px-4 py-20">
      <ClayShapes variant="hero" />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="clay-card p-10 max-w-md w-full text-center relative z-10"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-[#8B2956] mx-auto animate-spin" />
            <h1 className="mt-6 font-serif-display text-3xl text-[#2E2825]">Verifying your email…</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <div
              className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
              style={{ background: 'linear-gradient(180deg,#C9B5DD,#7B6B9A)' }}
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="mt-6 font-serif-display text-3xl text-[#8B2956]">Email verified</h1>
            <p className="mt-2 text-sm text-[#2E2825]/70">Your account is now active.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="font-serif-display text-3xl text-[#2E2825]">Verification failed</h1>
            <p className="mt-2 text-sm text-[#2E2825]/70">The link is invalid or has expired.</p>
          </>
        )}
        <Link to="/" className="mt-8 clay-btn-primary px-6 py-3.5 inline-flex items-center gap-2">
          Back to shop
        </Link>
      </motion.div>
    </div>
  );
}
