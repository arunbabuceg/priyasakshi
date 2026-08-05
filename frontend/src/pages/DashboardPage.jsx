import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, User as UserIcon, MapPin, LogOut, Mail, Hop as Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ClayShapes } from '@/components/ClayShapes';

const NAV_CARDS = [
  { to: '/account/orders', icon: Package, label: 'My Orders', desc: 'Track and review your purchases', accent: '#D17B67', bg: '#F7CFC1' },
  { to: '/account/profile', icon: UserIcon, label: 'Profile', desc: 'Update your name, phone and password', accent: '#8B2956', bg: '#EBB5C8' },
  { to: '/account/addresses', icon: MapPin, label: 'Saved Addresses', desc: 'Manage shipping addresses', accent: '#8A9A5B', bg: '#D2DFA8' },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAF7F2] relative overflow-hidden px-4 py-28 md:py-32">
      <ClayShapes variant="hero" />
      <div className="relative max-w-5xl mx-auto">
        <Link
          to="/"
          className="clay-btn-ghost h-10 px-4 inline-flex items-center gap-2 text-sm mb-6"
          data-testid="dashboard-back-home"
        >
          <Home className="w-4 h-4" /> Back to Home
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="clay-card p-8 sm:p-10"
        >
          <span className="clay-pill">Account</span>
          <h1 className="mt-4 font-serif-display text-4xl sm:text-5xl text-[#8B2956] leading-tight">
            Hello, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-[#2E2825]/70">
            <Mail className="w-4 h-4" />
            {user?.email}
          </div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {NAV_CARDS.map((c, i) => (
              <motion.div
                key={c.to}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link
                  to={c.to}
                  className="clay-card p-6 block h-full hover:-translate-y-1 transition-transform group"
                  data-testid={`dashboard-card-${c.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{
                      background: c.bg,
                      boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.08), inset 0 4px 8px rgba(255,255,255,0.5)',
                    }}
                  >
                    <c.icon className="w-6 h-6" style={{ color: c.accent }} strokeWidth={2} />
                  </div>
                  <h3 className="font-serif-display text-2xl text-[#2E2825] group-hover:text-[#8B2956] transition-colors">
                    {c.label}
                  </h3>
                  <p className="mt-2 text-sm text-[#2E2825]/65">{c.desc}</p>
                </Link>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.24 }}
            >
              <button
                onClick={logout}
                className="clay-card p-6 w-full text-left h-full hover:-translate-y-1 transition-transform group"
                data-testid="dashboard-card-logout"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: 'linear-gradient(180deg, #F3D2A8 0%, #D4A373 100%)',
                    boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.08), inset 0 4px 8px rgba(255,255,255,0.5)',
                  }}
                >
                  <LogOut className="w-6 h-6 text-[#8B2956]" strokeWidth={2} />
                </div>
                <h3 className="font-serif-display text-2xl text-[#2E2825] group-hover:text-[#8B2956] transition-colors">
                  Logout
                </h3>
                <p className="mt-2 text-sm text-[#2E2825]/65">Sign out of your account</p>
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
