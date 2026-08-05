import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/lib/format';
import { createOrder } from '@/services/orderService';
import {
  createRazorpayOrder,
  loadRazorpayCheckout,
  openRazorpayCheckout,
  verifyPayment,
} from '@/services/paymentService';

const PAYMENT_ERROR_MESSAGE = 'We could not process your payment. Please try again.';

const initialForm = {
  customer_name: '',
  customer_email: '',
  phone: '',
  shipping_address: '',
  shipping_city: '',
  shipping_state: '',
  shipping_postal_code: '',
  shipping_country: 'India',
};

export default function CheckoutForm({ onBack }) {
  const { items, subtotal, shipping, total, clear, setIsOpen } = useCart();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const required = [
      'customer_name',
      'customer_email',
      'shipping_address',
      'shipping_city',
      'shipping_state',
      'shipping_postal_code',
      'shipping_country',
    ];
    for (const k of required) {
      if (!form[k] || !form[k].trim()) return `Please fill ${k.replace(/_/g, ' ')}`;
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.customer_email)) return 'Please enter a valid email';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    if (items.length === 0) {
      toast.error('Your basket is empty');
      return;
    }

    setSubmitting(true);

    // 1. Record the order in Mongo first (existing endpoint, unchanged).
    const orderResult = await createOrder({
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      phone: form.phone || undefined,
      items: items.map((i) => ({
        product_id: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        price: i.product.price,
      })),
      shipping: {
        line1: form.shipping_address,
        city: form.shipping_city,
        state: form.shipping_state,
        postal_code: form.shipping_postal_code,
        country: form.shipping_country,
      },
      currency: 'INR',
      subtotal,
      shipping_fee: shipping,
      total,
    });

    if (!orderResult.ok) {
      toast.error(orderResult.error || 'Could not place order');
      setSubmitting(false);
      return;
    }

    const internalOrderId = orderResult.data?.order_id;

    try {
      // 2. Create a Razorpay order tied to that internal order.
      const rzpOrderResult = await createRazorpayOrder({
        orderId: internalOrderId,
        amount: total,
        currency: 'INR',
      });
      if (!rzpOrderResult.ok) throw new Error(rzpOrderResult.error);

      // 3. Load Checkout.js and open Razorpay Standard Checkout.
      await loadRazorpayCheckout();
      const paymentHandle = await openRazorpayCheckout({
        razorpayOrderId: rzpOrderResult.data.order_id,
        amount: rzpOrderResult.data.amount,
        currency: rzpOrderResult.data.currency,
        name: 'Priya Sakshi',
        description: 'Handwoven silk & Garden Glow skincare',
        prefill: {
          name: form.customer_name,
          email: form.customer_email,
          contact: form.phone || undefined,
        },
      });

      // 4. Verify the payment signature server-side.
      const verifyResult = await verifyPayment({
        orderId: internalOrderId,
        razorpayOrderId: paymentHandle.razorpayOrderId,
        razorpayPaymentId: paymentHandle.razorpayPaymentId,
        razorpaySignature: paymentHandle.razorpaySignature,
      });
      if (!verifyResult.ok || !verifyResult.data?.success) {
        throw new Error(verifyResult.error || 'Payment verification failed');
      }

      // 5. Success — clear the basket and redirect.
      clear();
      setIsOpen(false);
      navigate('/success');
    } catch (paymentErr) {
      toast.error(paymentErr?.message || PAYMENT_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto" data-testid="checkout-form">
      <div className="px-6 pt-2 pb-6">
        <button
          type="button"
          onClick={onBack}
          className="clay-btn-ghost h-10 px-4 flex items-center gap-2 text-sm"
          data-testid="checkout-back-btn"
        >
          <ArrowLeft className="w-4 h-4" /> Back to basket
        </button>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <SectionTitle>Contact</SectionTitle>
          <Field
            label="Full name"
            value={form.customer_name}
            onChange={handleChange('customer_name')}
            testId="checkout-name"
            autoComplete="name"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Email"
              type="email"
              value={form.customer_email}
              onChange={handleChange('customer_email')}
              testId="checkout-email"
              autoComplete="email"
            />
            <Field
              label="Phone Number *"
              value={form.phone}
              onChange={handleChange('phone')}
              testId="checkout-phone"
              autoComplete="tel"
            />
          </div>

          <SectionTitle>Shipping</SectionTitle>
          <Field
            label="Address"
            value={form.shipping_address}
            onChange={handleChange('shipping_address')}
            testId="checkout-address"
            autoComplete="street-address"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="City"
              value={form.shipping_city}
              onChange={handleChange('shipping_city')}
              testId="checkout-city"
            />
            <Field
              label="State"
              value={form.shipping_state}
              onChange={handleChange('shipping_state')}
              testId="checkout-state"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Postal code"
              value={form.shipping_postal_code}
              onChange={handleChange('shipping_postal_code')}
              testId="checkout-postal"
            />
            <Field
              label="Country"
              value={form.shipping_country}
              onChange={handleChange('shipping_country')}
              testId="checkout-country"
            />
          </div>

          <div className="mt-6 clay-card-cream p-5 space-y-2 text-sm" data-testid="checkout-summary">
            <div className="flex justify-between">
              <span className="text-[#2E2825]/70">Subtotal</span>
              <span className="font-semibold">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#2E2825]/70">Shipping</span>
              <span className="font-semibold">{shipping === 0 ? 'FREE' : formatINR(shipping)}</span>
            </div>
            <div className="pt-2 border-t border-[#E6D9BF] flex items-baseline justify-between">
              <span className="font-serif-display text-xl">Total</span>
              <span className="font-serif-display text-2xl font-semibold text-[#8B2956]" data-testid="checkout-total">
                {formatINR(total)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full clay-btn-primary h-14 flex items-center justify-center gap-2 disabled:opacity-70"
            data-testid="checkout-submit-btn"
          >
            <Lock className="w-4 h-4" />
            {submitting ? 'Processing\u2026' : `Pay ${formatINR(total)}`}
          </button>
          <p className="text-center text-xs text-[#2E2825]/50 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Secured by Razorpay
          </p>
        </form>
      </div>
    </div>
  );
}

const SectionTitle = ({ children }) => (
  <h4 className="font-serif-display text-lg text-[#8B2956] pt-2">{children}</h4>
);

const Field = ({ label, value, onChange, type = 'text', testId, autoComplete }) => (
  <label className="block">
    <span className="text-xs uppercase tracking-widest text-[#2E2825]/60 ml-3">{label}</span>
    <input
      className="clay-input mt-1.5"
      type={type}
      value={value}
      onChange={onChange}
      data-testid={testId}
      autoComplete={autoComplete}
    />
  </label>
);
