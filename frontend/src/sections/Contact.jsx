import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Drama as Instagram, Send } from 'lucide-react';
import { toast } from 'sonner';
import { sendContactMessage } from '@/services/contactService';
import { subscribeNewsletter } from '@/services/newsletterService';
import { site } from '@/data/site';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [subEmail, setSubEmail] = useState('');
  const [subLoading, setSubLoading] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill all fields');
      return;
    }
    setSending(true);
    const res = await sendContactMessage(form);
    setSending(false);
    if (res.ok) {
      toast.success("Thank you \u2014 we'll write back within a day.");
      setForm({ name: '', email: '', message: '' });
    } else {
      toast.error(res.error || "Couldn't send message. Please try again.");
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subEmail) return;
    setSubLoading(true);
    const res = await subscribeNewsletter(subEmail);
    setSubLoading(false);
    if (res.ok) {
      toast.success('Welcome to the family');
      setSubEmail('');
    } else {
      toast.error(res.error || 'Could not subscribe. Please try again.');
    }
  };

  return (
    <section id="contact" className="relative py-16 md:py-32" data-testid="contact-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="clay-card p-8 sm:p-10"
          >
            <span className="clay-pill">Contact</span>
            <h2 className="mt-4 font-serif-display text-4xl text-[#2E2825] leading-tight">
              Write to us —
              <br />
              <em className="italic text-[#8B2956]">we reply personally.</em>
            </h2>
            <form className="mt-8 space-y-4" onSubmit={handleContactSubmit}>
              <FieldLabel label="Name">
                <input
                  className="clay-input mt-1.5"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="contact-name"
                />
              </FieldLabel>
              <FieldLabel label="Email">
                <input
                  className="clay-input mt-1.5"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  data-testid="contact-email"
                />
              </FieldLabel>
              <FieldLabel label="Message">
                <textarea
                  className="clay-input mt-1.5 min-h-[120px] resize-none"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  data-testid="contact-message"
                />
              </FieldLabel>
              <button
                type="submit"
                disabled={sending}
                className="clay-btn-primary h-14 px-8 flex items-center gap-2 disabled:opacity-70"
                data-testid="contact-submit"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending\u2026' : 'Send Message'}
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="clay-card-cream p-8" data-testid="contact-details-card">
              <h3 className="font-serif-display text-3xl text-[#8B2956]">Our courtyard</h3>
              <div className="mt-6 space-y-4 text-sm text-[#2E2825]/80">
                <Info icon={MapPin} text={site.contact.address} testId="contact-address" />
                <Info icon={Phone} text={site.contact.phone} testId="contact-phone" />
                <Info icon={Mail} text={site.contact.email} testId="contact-email-info" />
                <Info icon={Instagram} text={site.contact.instagram} testId="contact-instagram" />
              </div>
            </div>

            <div
              className="clay-card p-8"
              style={{ background: 'linear-gradient(180deg, #F7CFC1 0%, #EBA8C5 100%)' }}
            >
              <h3 className="font-serif-display text-3xl text-[#8B2956]">
                Slow letters,
                <br />
                once a month.
              </h3>
              <p className="mt-3 text-sm text-[#2E2825]/70">
                New arrivals, herbal rituals, and stories from our looms. Never spam.
              </p>
              <form onSubmit={handleSubscribe} className="mt-5 flex gap-3">
                <input
                  type="email"
                  placeholder="Your email"
                  className="clay-input flex-1"
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                  data-testid="newsletter-email"
                  required
                />
                <button
                  type="submit"
                  disabled={subLoading}
                  className="clay-btn-olive h-12 px-5 flex items-center gap-2 disabled:opacity-70"
                  data-testid="newsletter-submit"
                >
                  <Send className="w-4 h-4" />
                  Join
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const FieldLabel = ({ label, children }) => (
  <div>
    <label className="text-xs uppercase tracking-widest text-[#2E2825]/60 ml-3">{label}</label>
    {children}
  </div>
);

const Info = ({ icon: Icon, text, testId }) => (
  <div className="flex items-start gap-3">
    <div
      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{
        background: '#fff',
        boxShadow: 'inset 0 -3px 6px rgba(138,115,104,0.15), inset 0 3px 6px rgba(255,255,255,0.9), 0 4px 8px rgba(138,115,104,0.08)',
      }}
    >
      <Icon className="w-4 h-4 text-[#8B2956]" />
    </div>
    <span className="pt-2" data-testid={testId}>
      {text}
    </span>
  </div>
);
