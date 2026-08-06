import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { resetPassword } from '@/services/authService';
import { ClayShapes } from '@/components/ClayShapes';

export default function ResetPasswordPage() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await resetPassword(token, password);
    setSubmitting(false);
    if (res.ok) {
      toast.success('Password reset — you can now sign in');
      navigate('/login');
    } else {
      toast.error(res.error || 'Reset failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5F8] relative overflow-hidden flex items-center justify-center px-4 py-20">
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
        <h1 className="font-serif-display text-4xl text-[#8B2956] leading-tight">New password</h1>
        <p className="text-sm text-[#2E2825]/70 mt-2">Choose a new password for your account.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-[#2E2825]/60 ml-3">Password</span>
            <div className="relative mt-1.5">
              <Lock className="w-4 h-4 text-[#2E2825]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                className="clay-input !pl-11 !pr-11"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="reset-password"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowPwd((s) => !s); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2E2825]/40 hover:text-[#2E2825]/70 z-10"
                tabIndex={-1}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full clay-btn-primary h-14 flex items-center justify-center disabled:opacity-70"
            data-testid="reset-submit"
          >
            {submitting ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
