import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ClayShapes } from '@/components/ClayShapes';

export default function AuthPage({ mode = 'login' }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = isLogin
      ? await login(form.email, form.password)
      : await register(form.name, form.email, form.password);
    setSubmitting(false);
    if (res.ok) {
      toast.success(isLogin ? 'Welcome back' : 'Account created — check your inbox to verify your email');
      navigate('/');
    } else {
      toast.error(res.error || 'Something went wrong');
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
        <Link to="/" className="clay-btn-ghost h-10 px-4 inline-flex items-center gap-2 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to shop
        </Link>
        <h1 className="font-serif-display text-4xl text-[#8B2956] leading-tight">
          {isLogin ? 'Welcome back.' : 'Create your account.'}
        </h1>
        <p className="text-sm text-[#2E2825]/70 mt-2">
          {isLogin ? 'Sign in to continue your ritual.' : 'Join the Priya Sakshi family.'}
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <Field icon={User} label="Name" value={form.name} onChange={handleChange('name')} type="text" testId="auth-name" />
          )}
          <Field icon={Mail} label="Email" value={form.email} onChange={handleChange('email')} type="email" testId="auth-email" />
          <Field icon={Lock} label="Password" value={form.password} onChange={handleChange('password')} type="password" testId="auth-password" />

          {isLogin && (
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-[#8B2956] hover:underline">
                Forgot password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full clay-btn-primary h-14 flex items-center justify-center gap-2 disabled:opacity-70"
            data-testid="auth-submit"
          >
            {submitting ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#2E2825]/70 mt-6">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link to={isLogin ? '/register' : '/login'} className="text-[#8B2956] font-semibold hover:underline">
            {isLogin ? 'Register' : 'Sign in'}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

const Field = ({ icon: Icon, label, value, onChange, type, testId }) => (
  <label className="block">
    <span className="text-xs uppercase tracking-widest text-[#2E2825]/60 ml-3">{label}</span>
    <div className="relative mt-1.5">
     <Icon className="w-4 h-4 text-[#2E2825]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
<input
  className="clay-input !pl-11"
        type={type}
        value={value}
        onChange={onChange}
        data-testid={testId}
        required
      />
    </div>
  </label>
);
