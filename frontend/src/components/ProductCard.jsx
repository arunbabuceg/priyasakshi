import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/lib/format';

const PALETTES = [
  { bg: '#F5D9DD', accent: '#C99AA0' },
  { bg: '#E4D9F0', accent: '#9B8BB4' },
  { bg: '#EBA8C5', accent: '#8B2956' },
  { bg: '#F5EBF0', accent: '#D9B5C0' },
];

export default function ProductCard({ product, index = 0, onOpen }) {
  const { add } = useCart();
  const pal = PALETTES[index % PALETTES.length];
  const primaryImage = product.images?.[0];

  const handleAdd = (e) => {
    e.stopPropagation();
    add(product, 1);
    toast.success(`${product.name} added to your basket`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.06 }}
      whileHover={{ y: -6 }}
      onClick={() => onOpen?.(product)}
      className="clay-card p-5 cursor-pointer group relative overflow-hidden"
      data-testid={`product-card-${product.id}`}
    >
      {product.tag && (
        <div className="absolute top-4 right-4 z-10 clay-pill" data-testid={`product-tag-${product.id}`}>
          {product.tag}
        </div>
      )}

      <div
        className="relative rounded-[24px] overflow-hidden mb-5 aspect-[4/5] flex items-center justify-center"
        style={{
          background: pal.bg,
          boxShadow: 'inset 0 8px 16px rgba(0,0,0,0.06), inset 0 -8px 16px rgba(255,255,255,0.35)',
        }}
      >
        <motion.img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.06, rotate: -1 }}
          transition={{ duration: 0.6 }}
          loading="lazy"
        />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3
            className="font-serif-display text-xl leading-tight text-[#2E2825] group-hover:text-[#8B2956] transition-colors"
            data-testid={`product-name-${product.id}`}
          >
            {product.name}
          </h3>
          <p className="text-xs text-[#2E2825]/60 mt-1 line-clamp-2">{product.shortDescription}</p>
          <div
            className="mt-3 font-serif-display text-2xl font-semibold"
            style={{ color: pal.accent }}
            data-testid={`product-price-${product.id}`}
          >
            {formatINR(product.price)}
          </div>
        </div>

        <button
          onClick={handleAdd}
          className="clay-btn-primary h-12 w-12 flex-shrink-0 flex items-center justify-center"
          data-testid={`add-to-cart-btn-${product.id}`}
          aria-label={`Add ${product.name} to cart`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
