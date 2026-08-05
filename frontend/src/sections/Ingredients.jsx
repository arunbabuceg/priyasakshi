import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sprout, Leaf } from 'lucide-react';
import { getIngredients } from '@/services/ingredientsService';

export default function Ingredients() {
  const [items, setItems] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    getIngredients()
      .then((res) => mounted && setItems(res.ingredients || []))
      .catch(() => mounted && setItems([]));
    return () => {
      mounted = false;
    };
  }, []);

  const visible = expanded ? items : items.slice(0, 24);

  return (
    <section id="ingredients" className="relative py-16 md:py-32" data-testid="ingredients-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 lg:sticky lg:top-32"
          >
            <span className="clay-pill inline-flex items-center gap-2">
              <Sprout className="w-3.5 h-3.5" />
              103 herbs, 1 bottle
            </span>
            <h2 className="mt-4 font-serif-display text-4xl sm:text-5xl text-[#2E2825] leading-tight">
              Every drop —
              <br />
              <em className="italic text-[#9B8BB4]">a garden.</em>
            </h2>
            <p className="mt-6 text-base text-[#2E2825]/75 leading-relaxed">
              Our Tamarai Hair Oil is cold-infused with{' '}
              <span className="font-semibold text-[#8B2956]">{items.length || 103}</span>{' '}
              sun-dried herbs — flowers, roots, leaves and seeds — gathered from our garden and
              the wild groves of Tamil Nadu.
            </p>
            <div className="mt-6 flex gap-3">
              <div className="clay-card-cream px-5 py-3 flex items-center gap-2" data-testid="ingredients-count">
                <Leaf className="w-4 h-4 text-[#9B8BB4]" />
                <span className="font-serif-display text-xl text-[#8B2956]">{items.length || 103}</span>
                <span className="text-xs uppercase tracking-widest text-[#2E2825]/60">herbs</span>
              </div>
              <div className="clay-card-cream px-5 py-3 flex items-center gap-2">
                <span className="font-serif-display text-xl text-[#8B2956]">40</span>
                <span className="text-xs uppercase tracking-widest text-[#2E2825]/60">days infused</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <div className="clay-card p-6 sm:p-8" data-testid="ingredients-list-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm text-[#2E2825]/85">
                {visible.map((it, i) => (
                  <div key={it} className="flex items-baseline gap-2 py-1" data-testid={`ingredient-${i}`}>
                    <span className="font-serif-display text-[#9B8BB4] w-7 text-right shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>{it}</span>
                  </div>
                ))}
              </div>
              {items.length > 24 && (
                <div className="mt-6 pt-6 border-t border-[#EADFE5] text-center">
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="clay-btn-olive h-11 px-6 text-sm"
                    data-testid="ingredients-toggle"
                  >
                    {expanded ? 'Show less' : `View all ${items.length} herbs`}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
