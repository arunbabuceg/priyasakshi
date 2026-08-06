import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Minus, ShoppingBag, Truck, ShieldCheck, RotateCcw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { getProductById, getProducts } from '@/services/productService';
import { formatINR } from '@/lib/format';
import { ClayShapes } from '@/components/ClayShapes';
import ProductCard from '@/components/ProductCard';
import ProductGallery from '@/components/ProductGallery';

const PALETTES = [
  { bg: '#F5D9DD', accent: '#C99AA0' },
  { bg: '#E4D9F0', accent: '#9B8BB4' },
  { bg: '#EBA8C5', accent: '#8B2956' },
  { bg: '#F5EBF0', accent: '#D9B5C0' },
];

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { items, add, updateQty } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getProductById(slug).then((p) => {
      if (!mounted) return;
      setProduct(p);
      if (p) {
        getProducts({ category: p.category }).then((all) => {
          if (!mounted) return;
          setRelated((all || []).filter((x) => x.id !== p.id).slice(0, 3));
        });
      }
      setLoading(false);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      mounted = false;
    };
  }, [slug]);

  const pal = useMemo(() => {
    if (!product) return PALETTES[0];
    const idx = (product.id?.length || 0) % PALETTES.length;
    return PALETTES[idx];
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF5F8] flex items-center justify-center px-4">
        <div className="font-serif-display text-2xl text-[#8B2956]">Loading…</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF5F8] flex items-center justify-center px-4 py-20">
        <div className="clay-card p-10 max-w-md text-center">
          <h1 className="font-serif-display text-3xl text-[#8B2956]">Product not found</h1>
          <p className="mt-3 text-sm text-[#2E2825]/70">
            We couldn&apos;t find the product you&apos;re looking for.
          </p>
          <Link to="/" className="mt-6 clay-btn-primary h-12 px-6 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const existing = items.find((i) => i.product.id === product.id);
  const qty = existing?.quantity || 0;

  const handleAdd = () => {
    add(product, 1);
    toast.success(`${product.name} added to your basket`);
  };

  return (
    <div className="min-h-screen bg-[#FAF5F8] relative overflow-hidden pt-28 pb-20">
      <ClayShapes variant="hero" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="clay-btn-ghost h-10 px-4 inline-flex items-center gap-2 text-sm mb-6"
          data-testid="product-back-btn"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="clay-card p-6"
            style={{ background: pal.bg }}
            data-testid="product-page-gallery"
          >
            <ProductGallery images={product.images} alt={product.name} testId="product-page-gallery" />
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col"
          >
            {product.tag && <span className="clay-pill self-start mb-4">{product.tag}</span>}
            <h1 className="font-serif-display text-4xl sm:text-5xl text-[#2E2825] leading-tight" data-testid="product-page-name">
              {product.name}
            </h1>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-serif-display text-4xl font-semibold text-[#8B2956]" data-testid="product-page-price">
                {formatINR(product.price)}
              </span>
              <span className="text-xs uppercase tracking-widest text-[#2E2825]/50">INR</span>
            </div>

            <p className="mt-6 text-base text-[#2E2825]/80 leading-relaxed whitespace-pre-line" data-testid="product-page-description">
              {product.longDescription}
            </p>

            {/* Add to cart */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3" data-testid="product-page-add-section">
              {qty > 0 ? (
                <div
                  className="clay-btn-ghost flex items-center justify-between h-14 px-3 gap-3 flex-1"
                  data-testid="product-page-qty-controls"
                >
                  <button
                    className="w-10 h-10 rounded-full clay-btn-ochre flex items-center justify-center"
                    onClick={() => updateQty(product.id, qty - 1)}
                    data-testid="product-page-qty-decrement"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-serif-display text-2xl" data-testid="product-page-qty-value">
                    {qty}
                  </span>
                  <button
                    className="w-10 h-10 rounded-full clay-btn-ochre flex items-center justify-center"
                    onClick={handleAdd}
                    data-testid="product-page-qty-increment"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAdd}
                  className="clay-btn-primary flex-1 h-14 px-6 flex items-center justify-center gap-2"
                  data-testid="product-page-add-to-cart"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Add to Basket
                </button>
              )}
              <button
                onClick={() => navigate('/')}
                className="clay-btn-ghost h-14 px-6"
                data-testid="product-page-keep-browsing"
              >
                Keep Browsing
              </button>
            </div>

            {/* Specifications */}
            {product.specifications?.length > 0 && (
              <div className="mt-10" data-testid="product-page-specs">
                <h2 className="font-serif-display text-2xl text-[#8B2956] mb-4">Specifications</h2>
                <dl className="clay-card-cream p-5 divide-y divide-[#E0D2DD]">
                  {product.specifications.map((s) => (
                    <div key={s.label} className="flex justify-between py-2.5 text-sm">
                      <dt className="text-[#2E2825]/60">{s.label}</dt>
                      <dd className="font-medium text-[#2E2825] text-right">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Shipping info */}
            {product.shippingInfo?.length > 0 && (
              <div className="mt-8" data-testid="product-page-shipping">
                <h2 className="font-serif-display text-2xl text-[#8B2956] mb-4">Shipping & Returns</h2>
                <ul className="clay-card p-5 space-y-3">
                  {product.shippingInfo.map((line) => (
                    <li key={line} className="flex items-start gap-3 text-sm text-[#2E2825]/80">
                      <Check className="w-4 h-4 text-[#9B8BB4] flex-shrink-0 mt-0.5" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              <TrustBadge icon={Truck} label="Free shipping over ₹5,000" />
              <TrustBadge icon={ShieldCheck} label="100% natural ingredients" />
              <TrustBadge icon={RotateCcw} label="7-day saree returns" />
            </div>
          </motion.div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-20" data-testid="product-page-related">
            <h2 className="font-serif-display text-3xl text-[#2E2825] mb-8">You may also love</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const TrustBadge = ({ icon: Icon, label }) => (
  <div className="clay-card-cream p-4 flex flex-col items-center gap-2">
    <Icon className="w-5 h-5 text-[#8B2956]" />
    <span className="text-xs text-[#2E2825]/70 leading-tight">{label}</span>
  </div>
);


export default ProductPage