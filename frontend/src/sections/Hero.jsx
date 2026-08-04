import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Sparkles } from 'lucide-react';
import { ClayShapes, KolamStar } from '@/components/ClayShapes';
import { hero } from '@/data/hero';

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32"
      data-testid="hero-section"
    >
      <ClayShapes variant="hero" />
      <div className="grain-overlay absolute inset-0" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6"
          >
            <span className="clay-pill inline-flex items-center gap-2 mb-6" data-testid="hero-eyebrow">
              <Sparkles className="w-3.5 h-3.5" />
              {hero.eyebrow}
            </span>
            <h1
              className="font-serif-display text-[#8B2956] text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight"
              data-testid="hero-title"
            >
              {hero.headingTop} <em className="italic text-[#D17B67]">{hero.headingTopAccent}</em>
              <br />
              {hero.headingBottom} <em className="italic text-[#8A9A5B]">{hero.headingBottomAccent}</em>
            </h1>
            <p
              className="mt-6 text-base sm:text-lg text-[#2E2825]/75 max-w-xl leading-relaxed"
              data-testid="hero-subtitle"
            >
              {hero.subtitle}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={() => scrollTo('sarees')}
                className="clay-btn-primary h-14 px-8 text-base"
                data-testid="hero-cta-sarees"
              >
                {hero.ctaSarees}
              </button>
              <button
                onClick={() => scrollTo('skincare')}
                className="clay-btn-olive h-14 px-8 text-base"
                data-testid="hero-cta-skincare"
              >
                {hero.ctaSkincare}
              </button>
            </div>

            <div className="mt-12 flex items-center gap-6 text-sm text-[#2E2825]/60">
              {hero.stats.map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <div className="w-px h-8 bg-[#2E2825]/15" />}
                  <Stat value={s.value} label={s.label} />
                </React.Fragment>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="lg:col-span-6 relative"
          >
            <HeroCollage />
          </motion.div>
        </div>

        <motion.button
          onClick={() => scrollTo('story')}
          className="mx-auto mt-16 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#2E2825]/50 hover:text-[#8B2956] transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          data-testid="hero-scroll-down"
        >
          scroll to discover
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </motion.button>
      </div>
    </section>
  );
}

const Stat = ({ value, label }) => (
  <div>
    <div className="font-serif-display text-2xl text-[#8B2956] leading-none">{value}</div>
    <div className="text-[10px] uppercase tracking-widest mt-1">{label}</div>
  </div>
);

const COLLAGE_POSITIONS = [
  { top: 0, left: 0, width: '60%', ratio: '3/4', z: 20, rot: -3, y: [0, -10, 0], rotate: [-3, -1, -3], duration: 6 },
  { top: '18%', right: 0, width: '46%', ratio: '3/4', z: 10, rot: 5, y: [0, 12, 0], rotate: [4, 6, 4], duration: 7 },
  { bottom: 0, left: '18%', width: '42%', ratio: '1/1', z: 30, rot: 3, y: [0, -8, 0], rotate: [2, 4, 2], duration: 5.5 },
];

const HeroCollage = () => (
  <div className="relative w-full aspect-square max-w-[520px] mx-auto">
    {hero.collage.map((tile, i) => {
      const pos = COLLAGE_POSITIONS[i];
      if (!pos) return null;
      return (
        <motion.div
          key={tile.alt}
          className="absolute clay-card p-3"
          style={{
            top: pos.top,
            left: pos.left,
            right: pos.right,
            bottom: pos.bottom,
            width: pos.width,
            aspectRatio: pos.ratio,
            zIndex: pos.z,
            transform: `rotate(${pos.rot}deg)`,
          }}
          animate={{ y: pos.y, rotate: pos.rotate }}
          transition={{ duration: pos.duration, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-full h-full rounded-[20px] overflow-hidden" style={{ background: tile.bg }}>
            <img src={tile.image} alt={tile.alt} className="w-full h-full object-cover" />
          </div>
        </motion.div>
      );
    })}
    <motion.div className="absolute -top-4 right-[35%] z-40 animate-spin-slow">
      <KolamStar size={70} color="#8A9A5B" />
    </motion.div>
    <motion.div className="absolute bottom-8 -right-2 z-40">
      <KolamStar size={50} color="#D17B67" />
    </motion.div>
  </div>
);
