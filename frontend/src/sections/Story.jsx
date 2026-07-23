import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Scissors, Hand, Heart } from 'lucide-react';
import { about } from '@/data/about';

const ICONS = { Leaf, Scissors, Hand, Heart };

export default function Story() {
  return (
    <section id="story" className="relative py-16 md:py-32" data-testid="story-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5 lg:sticky lg:top-32"
          >
            <span className="clay-pill">{about.eyebrow}</span>
            <h2
              className="mt-4 font-serif-display text-4xl sm:text-5xl text-[#2E2825] leading-tight"
              data-testid="story-heading"
            >
              {about.headingTop}
              <br />
              <em className="italic text-[#8B2956]">{about.headingBottomAccent}</em>
            </h2>
            {about.paragraphs.map((p, i) => (
              <p key={i} className={`${i === 0 ? 'mt-6' : 'mt-4'} text-base text-[#2E2825]/75 leading-relaxed`}>
                {p}
              </p>
            ))}

            <div className="mt-8 clay-card-cream p-6">
              <div className="font-serif-display italic text-xl text-[#8B2956] leading-snug">
                “{about.quote.text}”
              </div>
              <div className="mt-3 text-xs uppercase tracking-widest text-[#2E2825]/60">
                — {about.quote.author}
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-5">
            {about.values.map((v, i) => {
              const Icon = ICONS[v.icon] || Leaf;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`clay-card p-6 ${i % 2 === 1 ? 'sm:mt-10' : ''}`}
                  data-testid={`value-card-${i}`}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{
                      background: v.bg,
                      boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.08), inset 0 4px 8px rgba(255,255,255,0.5)',
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: v.color }} strokeWidth={2} />
                  </div>
                  <h3 className="font-serif-display text-2xl text-[#2E2825] leading-tight">{v.title}</h3>
                  <p className="mt-2 text-sm text-[#2E2825]/70 leading-relaxed">{v.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
