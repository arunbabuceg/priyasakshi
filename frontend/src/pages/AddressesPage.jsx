import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Plus, Pencil, Trash2, X, Loader as Loader2 } from 'lucide-react';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '@/services/addressService';
import { ClayShapes } from '@/components/ClayShapes';

const emptyForm = {
  label: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  phone: '',
};

export default function AddressesPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // address id or 'new' or null
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    getAddresses().then((res) => {
      setAddresses(res.data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditing('new');
  };

  const openEdit = (addr) => {
    setForm({ ...addr });
    setEditing(addr.id);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    const res =
      editing === 'new'
        ? await createAddress(payload)
        : await updateAddress(editing, payload);
    setSaving(false);
    if (res.ok) {
      toast.success(editing === 'new' ? 'Address added' : 'Address updated');
      closeForm();
      load();
    } else {
      toast.error(res.error || 'Could not save address');
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteAddress(id);
    if (res.ok) {
      toast.success('Address deleted');
      load();
    } else {
      toast.error(res.error || 'Could not delete address');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5F8] relative overflow-hidden px-4 py-28 md:py-32">
      <ClayShapes variant="hero" />
      <div className="relative max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/account')}
          className="clay-btn-ghost h-10 px-4 inline-flex items-center gap-2 text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="clay-card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-serif-display text-4xl text-[#8B2956]">Saved Addresses</h1>
            <button
              onClick={openNew}
              className="clay-btn-primary h-11 px-5 flex items-center gap-2 text-sm"
              data-testid="address-add-btn"
            >
              <Plus className="w-4 h-4" /> Add New
            </button>
          </div>

          {loading ? (
            <div className="mt-10 flex flex-col items-center text-[#2E2825]/60">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              Loading addresses…
            </div>
          ) : addresses.length === 0 && editing !== 'new' ? (
            <div className="mt-10 flex flex-col items-center text-center py-10">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                style={{
                  background: 'linear-gradient(180deg, #C9B5DD 0%, #7B6B9A 100%)',
                  boxShadow: '0 20px 30px rgba(140,110,170,0.3), inset 0 -6px 12px rgba(60,40,80,0.25), inset 0 6px 12px rgba(255,255,255,0.5)',
                }}
              >
                <MapPin className="w-9 h-9 text-white" />
              </div>
              <h3 className="font-serif-display text-2xl text-[#2E2825]">No saved addresses</h3>
              <p className="text-sm text-[#2E2825]/60 mt-2 max-w-xs">
                Add an address to speed up checkout next time.
              </p>
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              <AnimatePresence>
                {addresses.map((a) => (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="clay-card-cream p-5"
                    data-testid={`address-card-${a.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ background: '#fff', boxShadow: 'inset 0 -3px 6px rgba(138,115,130,0.15), inset 0 3px 6px rgba(255,255,255,0.9)' }}
                        >
                          <MapPin className="w-4 h-4 text-[#8B2956]" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-serif-display text-lg text-[#2E2825]">{a.label}</div>
                          <div className="text-sm text-[#2E2825]/75 leading-relaxed mt-1">
                            {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
                            {[a.city, a.state, a.postal_code].filter(Boolean).join(', ')}<br />
                            {a.country}
                            {a.phone && <div className="mt-1">Phone: {a.phone}</div>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => openEdit(a)}
                          className="w-9 h-9 rounded-full clay-btn-ghost flex items-center justify-center"
                          aria-label="Edit address"
                          data-testid={`address-edit-${a.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="w-9 h-9 rounded-full clay-btn-ghost flex items-center justify-center text-[#8B2956]"
                          aria-label="Delete address"
                          data-testid={`address-delete-${a.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>

      {/* Add/Edit modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeForm}
            data-testid="address-modal-overlay"
          >
            <motion.div
              className="clay-card p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              data-testid="address-modal"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif-display text-2xl text-[#8B2956]">
                  {editing === 'new' ? 'Add Address' : 'Edit Address'}
                </h2>
                <button onClick={closeForm} className="w-9 h-9 rounded-full clay-btn-ghost flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleSave}>
                <Field label="Label (e.g. Home, Office)" value={form.label} onChange={(v) => setForm((f) => ({ ...f, label: v }))} testId="address-label" />
                <Field label="Address line 1" value={form.line1} onChange={(v) => setForm((f) => ({ ...f, line1: v }))} testId="address-line1" />
                <Field label="Address line 2 (optional)" value={form.line2 || ''} onChange={(v) => setForm((f) => ({ ...f, line2: v }))} testId="address-line2" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="City" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} testId="address-city" />
                  <Field label="State" value={form.state} onChange={(v) => setForm((f) => ({ ...f, state: v }))} testId="address-state" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Postal code" value={form.postal_code} onChange={(v) => setForm((f) => ({ ...f, postal_code: v }))} testId="address-postal" />
                  <Field label="Country" value={form.country} onChange={(v) => setForm((f) => ({ ...f, country: v }))} testId="address-country" />
                </div>
                <Field label="Phone" value={form.phone || ''} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} testId="address-phone" />
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full clay-btn-primary h-14 flex items-center justify-center gap-2 disabled:opacity-70"
                  data-testid="address-save-btn"
                >
                  {saving ? 'Saving…' : 'Save Address'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Field = ({ label, value, onChange, testId }) => (
  <label className="block">
    <span className="text-xs uppercase tracking-widest text-[#2E2825]/60 ml-3">{label}</span>
    <input
      className="clay-input mt-1.5"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid={testId}
      required
    />
  </label>
);
