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
 *     longDescription:  string    full copy for the product page
 *     images:           string[]  image URLs (gallery-ready)
 *     tag:              string?   optional badge ("Bestseller", "New")
 *     stock:            number    informational only until inventory ships
 *     specifications:   object[]  {label, value} spec rows for the product page
 *     shippingInfo:     string[]  bullet points shown on the product page
 *   }
 *
 * To add a product: push a new entry into the exported array with an image URL.
 */
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
      'A regal heritage silk from our Kanchipuram artisans — deep magenta body, olive-green temple border and antique gold zari kolam motifs. Woven on traditional pit looms over 18 days by a single weaver family. Comes with a matching unstitched blouse piece.',
    images: ['https://images.pexels.com/photos/5447529/pexels-photo-5447529.jpeg?auto=compress&cs=tinysrgb&h=900&w=720'],
    tag: 'Bestseller',
    stock: 8,
    specifications: [
      { label: 'Material', value: 'Pure Kanchipuram silk' },
      { label: 'Zari', value: 'Antique gold (silver dipped in gold)' },
      { label: 'Weave', value: 'Pit loom, 18 days' },
      { label: 'Length', value: '5.5m + 0.8m blouse' },
      { label: 'Care', value: 'Dry clean only' },
    ],
    shippingInfo: [
      'Dispatched within 3–5 business days from Kanchipuram',
      'Free shipping across India on orders above ₹5,000',
      'International delivery in 10–14 business days',
      'Unworn sarees returnable within 7 days of delivery',
    ],
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
    images: ['https://images.pexels.com/photos/6167463/pexels-photo-6167463.jpeg?auto=compress&cs=tinysrgb&h=900&w=720'],
    tag: 'Handloom',
    stock: 6,
    specifications: [
      { label: 'Material', value: 'Silk-cotton blend' },
      { label: 'Zari', value: 'Fine gold lines' },
      { label: 'Weave', value: 'Handloom, 12 days' },
      { label: 'Length', value: '5.5m + 0.8m blouse' },
      { label: 'Care', value: 'Dry clean recommended' },
    ],
    shippingInfo: [
      'Dispatched within 3–5 business days from Kanchipuram',
      'Free shipping across India on orders above ₹5,000',
      'International delivery in 10–14 business days',
      'Unworn sarees returnable within 7 days of delivery',
    ],
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
      'A bridal-worthy Kanchipuram silk in sun-kissed yellow with vermillion red korvai border. Woven with pure zari (silver dipped in gold) using a triple-shuttle technique — one of our most prized pieces.',
    images: ['https://images.pexels.com/photos/28943531/pexels-photo-28943531.jpeg?auto=compress&cs=tinysrgb&h=900&w=720'],
    tag: 'Premium',
    stock: 4,
    specifications: [
      { label: 'Material', value: 'Pure Kanchipuram silk' },
      { label: 'Zari', value: 'Pure zari (silver dipped in gold)' },
      { label: 'Weave', value: 'Triple-shuttle korvai, 20 days' },
      { label: 'Length', value: '5.5m + 0.8m blouse' },
      { label: 'Care', value: 'Dry clean only' },
    ],
    shippingInfo: [
      'Dispatched within 3–5 business days from Kanchipuram',
      'Free shipping across India on orders above ₹5,000',
      'International delivery in 10–14 business days',
      'Unworn sarees returnable within 7 days of delivery',
    ],
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
      'Our signature hair oil infused with 100+ herbs — for deep root nourishment.',
    longDescription: tamaraiLongDescription,
    images: ['https://images.pexels.com/photos/31401742/pexels-photo-31401742.jpeg?auto=compress&cs=tinysrgb&h=900&w=720'],
    tag: 'Signature',
    stock: 30,
    specifications: [
      { label: 'Volume', value: '100ml' },
      { label: 'Base oils', value: 'Virgin coconut & sesame' },
      { label: 'Infusion', value: '103 herbs, 40 days cold-infused' },
      { label: 'Use', value: 'Weekly, overnight' },
      { label: 'Shelf life', value: '18 months' },
    ],
    shippingInfo: [
      'Dispatched within 2–3 business days',
      'Free shipping across India on orders above ₹5,000',
      'Non-returnable for hygiene reasons; exchange if damaged in transit',
    ],
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
    images: ['https://images.pexels.com/photos/13014206/pexels-photo-13014206.jpeg?auto=compress&cs=tinysrgb&h=900&w=720'],
    tag: '20% Off',
    stock: 45,
    specifications: [
      { label: 'Weight', value: '60g' },
      { label: 'Key herbs', value: 'Orithal tamarai, turmeric, sandalwood' },
      { label: 'Use', value: 'Weekly face mask / scrub' },
      { label: 'Skin type', value: 'All types' },
      { label: 'Shelf life', value: '12 months' },
    ],
    shippingInfo: [
      'Dispatched within 2–3 business days',
      'Free shipping across India on orders above ₹5,000',
      'Non-returnable for hygiene reasons; exchange if damaged in transit',
    ],
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
    images: ['https://images.pexels.com/photos/8101534/pexels-photo-8101534.jpeg?auto=compress&cs=tinysrgb&h=900&w=720'],
    tag: 'New',
    stock: 25,
    specifications: [
      { label: 'Volume', value: '30ml' },
      { label: 'Key actives', value: 'Holy basil, ganga tulasi, squalane, vitamin E' },
      { label: 'Use', value: 'Daily, morning & night' },
      { label: 'Skin type', value: 'All types' },
      { label: 'Shelf life', value: '12 months' },
    ],
    shippingInfo: [
      'Dispatched within 2–3 business days',
      'Free shipping across India on orders above ₹5,000',
      'Non-returnable for hygiene reasons; exchange if damaged in transit',
    ],
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
      'Cold-infused krishna kranthi (blue clitoria) petals in a base of jojoba and rosehip oils. Anti-ageing, brightening and deeply calming — a nightly ritual for radiant skin. 30ml.',
    images: ['https://images.pexels.com/photos/7796984/pexels-photo-7796984.jpeg?auto=compress&cs=tinysrgb&h=900&w=720'],
    tag: 'Anti-ageing',
    stock: 20,
    specifications: [
      { label: 'Volume', value: '30ml' },
      { label: 'Base oils', value: 'Jojoba & rosehip' },
      { label: 'Key herb', value: 'Krishna kranthi (blue clitoria)' },
      { label: 'Use', value: 'Nightly' },
      { label: 'Shelf life', value: '15 months' },
    ],
    shippingInfo: [
      'Dispatched within 2–3 business days',
      'Free shipping across India on orders above ₹5,000',
      'Non-returnable for hygiene reasons; exchange if damaged in transit',
    ],
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
      'A rare tribal formulation of poduthalai (Phyla Nodiflora) infused into cold-pressed base oils. Day 2 — hair feels softer and shinier, dandruff visibly reduces. Day 12 — regular application makes hair more manageable. Day 25 — noticeable strengthening and reduced hair fall. 100ml.',
    images: ['https://images.pexels.com/photos/8490090/pexels-photo-8490090.jpeg?auto=compress&cs=tinysrgb&h=900&w=720'],
    tag: 'Tribal Recipe',
    stock: 20,
    specifications: [
      { label: 'Volume', value: '100ml' },
      { label: 'Key herb', value: 'Poduthalai (Phyla Nodiflora)' },
      { label: 'Use', value: '2–3 times weekly' },
      { label: 'Shelf life', value: '18 months' },
    ],
    shippingInfo: [
      'Dispatched within 2–3 business days',
      'Free shipping across India on orders above ₹5,000',
      'Non-returnable for hygiene reasons; exchange if damaged in transit',
    ],
  },
  {
    id: 'skin-neeli-mahabringaraj',
    slug: 'skin-neeli-mahabringaraj',
    name: 'Neeli Mahabringaraj Hair Oil',
    category: 'skincare',
    price: 2399,
    currency: 'INR',
    shortDescription:
      'Strengthens hair, promotes growth and prevents hair fall — a classical ayurvedic blend.',
    longDescription:
      'A classical ayurvedic blend of neeli (indigofera) and mahabringaraj (eclipta) slow-cooked into a nourishing base of sesame and coconut oils. Strengthens the hair shaft, promotes healthy new growth and prevents fall. 100ml.',
    images: ['https://images.pexels.com/photos/4408447/pexels-photo-4408447.jpeg?auto=compress&cs=tinysrgb&h=900&w=720'],
    tag: 'Ayurvedic',
    stock: 25,
    specifications: [
      { label: 'Volume', value: '100ml' },
      { label: 'Base oils', value: 'Sesame & coconut' },
      { label: 'Key herbs', value: 'Neeli (indigofera), Mahabringaraj (eclipta)' },
      { label: 'Use', value: 'Weekly, overnight' },
      { label: 'Shelf life', value: '18 months' },
    ],
    shippingInfo: [
      'Dispatched within 2–3 business days',
      'Free shipping across India on orders above ₹5,000',
      'Non-returnable for hygiene reasons; exchange if damaged in transit',
    ],
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
    images: ['https://images.pexels.com/photos/6634681/pexels-photo-6634681.jpeg?auto=compress&cs=tinysrgb&h=900&w=720'],
    tag: 'Traditional',
    stock: 30,
    specifications: [
      { label: 'Weight', value: '80g' },
      { label: 'Key herb', value: 'Kuppaimeni (Acalypha Indica)' },
      { label: 'Use', value: 'Face pack 2–3 times weekly' },
      { label: 'Skin type', value: 'All types' },
      { label: 'Shelf life', value: '12 months' },
    ],
    shippingInfo: [
      'Dispatched within 2–3 business days',
      'Free shipping across India on orders above ₹5,000',
      'Non-returnable for hygiene reasons; exchange if damaged in transit',
    ],
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
      'Sun-dried tulasi, moringa, hibiscus and licorice root — steep for 5 minutes for a daily glow ritual that supports skin and digestion. 80g loose leaf.',
    images: ['https://images.pexels.com/photos/11213970/pexels-photo-11213970.jpeg?auto=compress&cs=tinysrgb&h=900&w=720'],
    tag: 'Wellness',
    stock: 35,
    specifications: [
      { label: 'Weight', value: '80g loose leaf' },
      { label: 'Ingredients', value: 'Tulasi, moringa, hibiscus, licorice root' },
      { label: 'Use', value: '1 cup daily' },
      { label: 'Servings', value: '~40 cups' },
      { label: 'Shelf life', value: '12 months' },
    ],
    shippingInfo: [
      'Dispatched within 2–3 business days',
      'Free shipping across India on orders above ₹5,000',
      'Non-returnable for hygiene reasons; exchange if damaged in transit',
    ],
  },
];
