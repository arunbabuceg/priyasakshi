import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';
import { forgotPassword } from '@/services/authService';
import { ClayShapes } from '@/components/ClayShapes';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    const res = await forgotPassword(email);
    setSending(false);
    if (res.ok) {
      setSent(true);
      toast.success('If that email exists, a reset link has been sent');
    } else {
      toast.error(res.error || 'Request failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] relative overflow-hidden flex items-center justify-center px-4 py-20">
      <ClayShapes variant="hero" />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="clay-card p-8 sm:p-10 max-w-md w-full relative z-10"
      >
        <Link to="/login" className="clay-btn-ghost h-10 px-4 inline-flex items-center gap-2 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
        <h1 className="font-serif-display text-4xl text-[#8B2956] leading-tight">Reset password</h1>
        <p className="text-sm text-[#2E2825]/70 mt-2">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {sent ? (
          <div className="mt-8 clay-card-cream p-6 text-center">
            <p className="text-sm text-[#2E2825]/80">
              If an account exists for <strong>{email}</strong>, a reset link is on its way.
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-[#2E2825]/60 ml-3">Email</span>
              <div className="relative mt-1.5">
                <Mail className="w-4 h-4 text-[#2E2825]/40 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  className="clay-input pl-11"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="forgot-email"
                  required
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={sending}
              className="w-full clay-btn-primary h-14 flex items-center justify-center disabled:opacity-70"
              data-testid="forgot-submit"
            >
              {sending ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
