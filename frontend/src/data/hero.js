/**
 * Hero section content + local image references used in the floating collage.
 * Swap the imports below to change the hero visuals.
 */
import sareeImg from '@/assets/images/products/saree-magenta-olive-1.webp';
import oilImg from '@/assets/images/products/ganga-tulasi-serum-1.jpeg';
import serumImg from '@/assets/images/products/tamarai-oil-1.jpeg';

export const hero = {
  eyebrow: 'Handcrafted in South India',
  headingTop: 'Woven',
  headingTopAccent: 'heritage.',
  headingBottom: 'Grown',
  headingBottomAccent: 'glow.',
  subtitle:
    'Priya Sakshi is a family-run atelier blending hand-woven Kanchipuram silks with slow-crafted Garden Glow herbal skincare \u2014 two traditions, one home ritual.',
  ctaSarees: 'Explore Sarees',
  ctaSkincare: 'Shop Garden Glow',
  stats: [
    { value: '120+', label: 'Weaver families' },
    { value: '18 days', label: 'Per saree' },
    { value: '100%', label: 'Herbal formulas' },
  ],
  collage: [
    { image: sareeImg, alt: 'Magenta silk saree', bg: '#EBA8C5' },
    { image: oilImg, alt: 'Tamarai hair oil', bg: '#F3D2A8' },
    { image: serumImg, alt: 'Ganga Tulasi serum', bg: '#C7D6A1' },
  ],
};
