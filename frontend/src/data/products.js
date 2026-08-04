/**
 * Product catalog — the single source of truth for the storefront.
 *
 * Schema:
 *   {
 *     id:               string    stable, kebab-case, used in URLs & cart keys
 *     slug:             string    URL-friendly alias (same as id today)
 *     name:             string    display name
 *     category:         string    matches an id in ./categories.js
 *     price:            number    integer INR (no decimals)
 *     currency:         string    'INR'
 *     shortDescription: string    one-line for cards
 *     longDescription:  string    full copy for the product dialog
 *     images:           string[]  imported local assets (gallery-ready)
 *     tag:              string?   optional badge ("Bestseller", "New")
 *     stock:            number    informational only until inventory ships
 *   }
 *
 * To add a product: drop the image into src/assets/images/products/, import
 * it at the top of this file, and push a new entry into the exported array.
 */
import sareeMagentaOlive1 from '@/assets/images/products/saree-magenta-olive-1.webp';
import sareeBlueYellow1 from '@/assets/images/products/saree-blue-yellow-1.jpg';
import sareeYellowRed1 from '@/assets/images/products/saree-yellow-red-1.jpg';
import tamaraiOil1 from '@/assets/images/products/tamarai-oil-1.jpeg';
import orithalPowder1 from '@/assets/images/products/orithal-powder-1.jpeg';
import gangaTulasiSerum1 from '@/assets/images/products/ganga-tulasi-serum-1.jpeg';
import krishnaKranthiOil1 from '@/assets/images/products/krishna-kranthi-oil-1.jpeg';
import poduthalaiOil1 from '@/assets/images/products/poduthalai-oil-1.jpeg';
import neeliMahabringaraj1 from '@/assets/images/products/neeli-mahabringaraj-1.jpeg';
import kuppaimeniPowder1 from '@/assets/images/products/kuppaimeni-powder-1.jpeg';
import gardenGlowBlend1 from '@/assets/images/products/garden-glow-blend-1.jpg';

import { herbs } from './ingredients';

const tamaraiLongDescription = (
  'Our flagship formula: 103 sun-dried herbs cold-infused for 40 days into virgin coconut and ' +
  'sesame base oils. Strengthens roots, soothes the scalp, adds gloss and helps prevent hair ' +
  'fall. 100ml. Weekly ritual: warm gently, massage into scalp, leave overnight, wash with our ' +
  'reetha-shikakai rinse.\n\n103 herbs inside: ' + herbs.join(', ') + '.'
);

export const products = [
  // ---------- Sarees ----------
  {
    id: 'saree-magenta-olive',
    slug: 'saree-magenta-olive',
    name: 'Magenta & Olive Heritage Silk',
    category: 'saree',
    price: 15999,
    currency: 'INR',
    shortDescription:
      'Hand-woven pure silk saree with traditional kolam motifs and contrast olive pallu.',
    longDescription:
      'A regal heritage silk from our Kanchipuram artisans \u2014 deep magenta body, olive-green temple border and antique gold zari kolam motifs. Woven on traditional pit looms over 18 days by a single weaver family. Comes with a matching unstitched blouse piece.',
    images: [sareeMagentaOlive1],
    tag: 'Bestseller',
    stock: 8,
  },
  {
    id: 'saree-blue-yellow',
    slug: 'saree-blue-yellow',
    name: 'Indigo & Marigold Handloom',
    category: 'saree',
    price: 13999,
    currency: 'INR',
    shortDescription:
      'Soft handloom silk cotton with marigold pallu and delicate zari stripes.',
    longDescription:
      'Lightweight indigo silk-cotton handloom, perfect for daytime festivities. The marigold pallu is offset with fine gold zari lines and a temple-border finish.',
    images: [sareeBlueYellow1],
    tag: 'Handloom',
    stock: 6,
  },
  {
    id: 'saree-yellow-red',
    slug: 'saree-yellow-red',
    name: 'Sunlit Kanchipuram Silk',
    category: 'saree',
    price: 18999,
    currency: 'INR',
    shortDescription:
      'Pure Kanchipuram silk in golden yellow with a vermillion red border.',
    longDescription:
      'A bridal-worthy Kanchipuram silk in sun-kissed yellow with vermillion red korvai border. Woven with pure zari (silver dipped in gold) using a triple-shuttle technique \u2014 one of our most prized pieces.',
    images: [sareeYellowRed1],
    tag: 'Premium',
    stock: 4,
  },

  // ---------- Skincare (Garden Glow) ----------
  {
    id: 'skin-tamarai-oil',
    slug: 'skin-tamarai-oil',
    name: 'Tamarai 100-Herb Hair Oil',
    category: 'skincare',
    price: 1999,
    currency: 'INR',
    shortDescription:
      'Our signature hair oil infused with 100+ herbs \u2014 for deep root nourishment.',
    longDescription: tamaraiLongDescription,
    images: [tamaraiOil1],
    tag: 'Signature',
    stock: 30,
  },
  {
    id: 'skin-orithal-powder',
    slug: 'skin-orithal-powder',
    name: 'Orithal Tamarai Face Powder',
    category: 'skincare',
    price: 1499,
    currency: 'INR',
    shortDescription:
      'A gentle exfoliating herbal powder for radiant, blemish-free skin.',
    longDescription:
      'Stone-ground orithal tamarai leaves blended with turmeric, sandalwood and rose petals. Mix with milk or rose water for a weekly ritual that brightens complexion and calms inflammation. 60g.',
    images: [orithalPowder1],
    tag: '20% Off',
    stock: 45,
  },
  {
    id: 'skin-ganga-tulasi',
    slug: 'skin-ganga-tulasi',
    name: 'Ganga Tulasi Face Serum',
    category: 'skincare',
    price: 2499,
    currency: 'INR',
    shortDescription:
      'Hydrating serum with holy basil, ganga tulasi and squalane for a dewy finish.',
    longDescription:
      'A featherweight herbal serum that pairs holy basil and ganga tulasi extracts with plant squalane and vitamin E. Locks in moisture, protects the skin barrier and leaves a natural dewy finish. 30ml.',
    images: [gangaTulasiSerum1],
    tag: 'New',
    stock: 25,
  },
  {
    id: 'skin-krishna-kranthi',
    slug: 'skin-krishna-kranthi',
    name: 'Krishna Kranthi Facial Oil',
    category: 'skincare',
    price: 2299,
    currency: 'INR',
    shortDescription:
      'Hydrating facial oil for a rejuvenated, glowing complexion.',
    longDescription:
      'Cold-infused krishna kranthi (blue clitoria) petals in a base of jojoba and rosehip oils. Anti-ageing, brightening and deeply calming \u2014 a nightly ritual for radiant skin. 30ml.',
    images: [krishnaKranthiOil1],
    tag: 'Anti-ageing',
    stock: 20,
  },
  {
    id: 'skin-tribal-poduthalai',
    slug: 'skin-tribal-poduthalai',
    name: 'Tribal Poduthalai Hair Oil',
    category: 'skincare',
    price: 2199,
    currency: 'INR',
    shortDescription:
      'A tribal recipe that visibly softens, strengthens and reduces dandruff in 25 days.',
    longDescription:
      'A rare tribal formulation of poduthalai (Phyla Nodiflora) infused into cold-pressed base oils. Day 2 \u2014 hair feels softer and shinier, dandruff visibly reduces. Day 12 \u2014 regular application makes hair more manageable. Day 25 \u2014 noticeable strengthening and reduced hair fall. 100ml.',
    images: [poduthalaiOil1],
    tag: 'Tribal Recipe',
    stock: 20,
  },
  {
    id: 'skin-neeli-mahabringaraj',
    slug: 'skin-neeli-mahabringaraj',
    name: 'Neeli Mahabringaraj Hair Oil',
    category: 'skincare',
    price: 2399,
    currency: 'INR',
    shortDescription:
      'Strengthens hair, promotes growth and prevents hair fall \u2014 a classical ayurvedic blend.',
    longDescription:
      'A classical ayurvedic blend of neeli (indigofera) and mahabringaraj (eclipta) slow-cooked into a nourishing base of sesame and coconut oils. Strengthens the hair shaft, promotes healthy new growth and prevents fall. 100ml.',
    images: [neeliMahabringaraj1],
    tag: 'Ayurvedic',
    stock: 25,
  },
  {
    id: 'skin-kuppaimeni-powder',
    slug: 'skin-kuppaimeni-powder',
    name: 'Kuppaimeni Herbal Mix Powder',
    category: 'skincare',
    price: 1299,
    currency: 'INR',
    shortDescription:
      'Traditional herbal powder for skin problems, unwanted facial hair and daily face care.',
    longDescription:
      'A traditional medicine powder built on generations of knowledge and skills. Kuppaimeni (Acalypha Indica) is stone-ground with complementary herbs to help with skin problems, improve skin health, gently remove facial hair and support daily face care. 80g.',
    images: [kuppaimeniPowder1],
    tag: 'Traditional',
    stock: 30,
  },
  {
    id: 'skin-garden-glow-blend',
    slug: 'skin-garden-glow-blend',
    name: 'Garden Glow Herbal Blend',
    category: 'skincare',
    price: 1799,
    currency: 'INR',
    shortDescription: 'A ready-to-brew herbal wellness tea for glow from within.',
    longDescription:
      'Sun-dried tulasi, moringa, hibiscus and licorice root \u2014 steep for 5 minutes for a daily glow ritual that supports skin and digestion. 80g loose leaf.',
    images: [gardenGlowBlend1],
    tag: 'Wellness',
    stock: 35,
  },
];
