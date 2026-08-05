import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Lock, User as UserIcon, Phone, Loader as Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getProfile, updateProfile, changePassword } from '@/services/profileService';
import { ClayShapes } from '@/components/ClayShapes';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const [form, setForm] = useState({ name: '', phone: '' });
  const [pwd, setPwd] = useState({ current_password: '', new_password: '', confirm: '' });

  useEffect(() => {
    let mounted = true;
    getProfile()
      .then((res) => {
        if (!mounted) return;
        if (res.ok) {
          setProfile(res.data);
          setForm({ name: res.data.name || '', phone: res.data.phone || '' });
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    const res = await updateProfile({ name: form.name, phone: form.phone });
    setSavingProfile(false);
    if (res.ok) {
      setProfile(res.data);
      setUser((u) => ({ ...u, name: res.data.name, phone: res.data.phone }));
      toast.success('Profile updated');
    } else {
      toast.error(res.error || 'Could not update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwd.new_password !== pwd.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPwd(true);
    const res = await changePassword(pwd.current_password, pwd.new_password);
    setSavingPwd(false);
    if (res.ok) {
      toast.success('Password changed');
      setPwd({ current_password: '', new_password: '', confirm: '' });
    } else {
      toast.error(res.error || 'Could not change password');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] relative overflow-hidden px-4 py-28 md:py-32">
      <ClayShapes variant="hero" />
      <div className="relative max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/account')}
          className="clay-btn-ghost h-10 px-4 inline-flex items-center gap-2 text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {loading ? (
          <div className="clay-card p-10 flex flex-col items-center text-[#2E2825]/60">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            Loading profile…
          </div>
        ) : (
          <div className="space-y-5">
            {/* Profile info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="clay-card p-6 sm:p-8"
              data-testid="profile-info-card"
            >
              <h1 className="font-serif-display text-3xl text-[#8B2956]">Profile</h1>

              <label className="block mt-6">
                <span className="text-xs uppercase tracking-widest text-[#2E2825]/60 ml-3">Email (not editable)</span>
                <div className="relative mt-1.5">
                  <Mail className="w-4 h-4 text-[#2E2825]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <input
                    className="clay-input !pl-11 opacity-70 cursor-not-allowed"
                    value={profile?.email || user?.email || ''}
                    readOnly
                    data-testid="profile-email"
                  />
                </div>
              </label>

              <form className="mt-4 space-y-4" onSubmit={handleProfileSave}>
                <Field
                  icon={UserIcon}
                  label="Full name"
                  value={form.name}
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  testId="profile-name"
                />
                <Field
                  icon={Phone}
                  label="Phone"
                  value={form.phone}
                  onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                  testId="profile-phone"
                />
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="clay-btn-primary h-14 px-8 flex items-center gap-2 disabled:opacity-70"
                  data-testid="profile-save"
                >
                  {savingProfile ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </motion.div>

            {/* Change password */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="clay-card-cream p-6 sm:p-8"
              data-testid="profile-password-card"
            >
              <h2 className="font-serif-display text-2xl text-[#8B2956] flex items-center gap-2">
                <Lock className="w-5 h-5" /> Change Password
              </h2>
              <form className="mt-5 space-y-4" onSubmit={handlePasswordChange}>
                <Field
                  label="Current password"
                  type="password"
                  value={pwd.current_password}
                  onChange={(v) => setPwd((p) => ({ ...p, current_password: v }))}
                  testId="profile-current-password"
                />
                <Field
                  label="New password"
                  type="password"
                  value={pwd.new_password}
                  onChange={(v) => setPwd((p) => ({ ...p, new_password: v }))}
                  testId="profile-new-password"
                />
                <Field
                  label="Confirm new password"
                  type="password"
                  value={pwd.confirm}
                  onChange={(v) => setPwd((p) => ({ ...p, confirm: v }))}
                  testId="profile-confirm-password"
                />
                <button
                  type="submit"
                  disabled={savingPwd}
                  className="clay-btn-olive h-14 px-8 flex items-center gap-2 disabled:opacity-70"
                  data-testid="profile-change-password"
                >
                  {savingPwd ? 'Changing…' : 'Change Password'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

const Field = ({ icon: Icon, label, value, onChange, type = 'text', testId }) => (
  <label className="block">
    <span className="text-xs uppercase tracking-widest text-[#2E2825]/60 ml-3">{label}</span>
    <div className="relative mt-1.5">
      {Icon && <Icon className="w-4 h-4 text-[#2E2825]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />}
      <input
        className={`clay-input ${Icon ? '!pl-11' : ''}`}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        required
      />
    </div>
  </label>
);
