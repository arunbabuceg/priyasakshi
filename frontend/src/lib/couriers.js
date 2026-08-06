/**
 * Courier catalog — single source of truth for the admin dropdown, the
 * customer tracking card and any tracking link we render.
 *
 * `track(number)` returns a URL that pre-fills the tracking number when the
 * courier supports it; couriers without a pre-fillable endpoint expose only
 * `home`, so the UI opens their tracking page and shows the number beside the
 * button for the customer to paste.
 */

export const COURIERS = [
  {
    code: 'india_post',
    name: 'India Post',
    home: 'https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx',
    track: null,
  },
  {
    code: 'speed_post',
    name: 'Speed Post',
    home: 'https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx',
    track: null,
  },
  {
    code: 'dtdc',
    name: 'DTDC',
    home: 'https://www.dtdc.in/track',
    track: null,
  },
  {
    code: 'professional_couriers',
    name: 'Professional Couriers',
    home: 'https://www.tpcindia.com/',
    track: null,
  },
  {
    code: 'st_courier',
    name: 'ST Courier',
    home: 'https://www.stcourier.com/track/shipment',
    track: null,
  },
  {
    code: 'blue_dart',
    name: 'Blue Dart',
    home: 'https://www.bluedart.com/tracking',
    track: (n) => `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${n}`,
  },
  {
    code: 'delhivery',
    name: 'Delhivery',
    home: 'https://www.delhivery.com/tracking',
    track: (n) => `https://www.delhivery.com/track/package/${n}`,
  },
  {
    code: 'xpressbees',
    name: 'XpressBees',
    home: 'https://www.xpressbees.com/shipment/tracking',
    track: (n) => `https://www.xpressbees.com/shipment/tracking?awbNo=${n}`,
  },
  {
    code: 'ecom_express',
    name: 'Ecom Express',
    home: 'https://ecomexpress.in/tracking/',
    track: (n) => `https://ecomexpress.in/tracking/?awb_field=${n}`,
  },
  {
    code: 'shadowfax',
    name: 'Shadowfax',
    home: 'https://tracker.shadowfax.in/',
    track: (n) => `https://tracker.shadowfax.in/#/tracker/${n}`,
  },
  {
    code: 'fedex',
    name: 'FedEx',
    home: 'https://www.fedex.com/en-in/tracking.html',
    track: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
  },
  {
    code: 'dhl',
    name: 'DHL',
    home: 'https://www.dhl.com/in-en/home/tracking.html',
    track: (n) => `https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id=${n}`,
  },
];

const slug = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const BY_KEY = COURIERS.reduce((acc, c) => {
  acc[c.code] = c;
  acc[slug(c.name)] = c;
  return acc;
}, {});

// Free-text couriers typed before the dropdown existed.
const LEGACY_ALIASES = {
  bluedart: 'blue_dart',
  blue_dart_express: 'blue_dart',
  indiapost: 'india_post',
  india_speed_post: 'speed_post',
  speedpost: 'speed_post',
  dtdc_express: 'dtdc',
  professional: 'professional_couriers',
  the_professional_couriers: 'professional_couriers',
  tpc: 'professional_couriers',
  stcourier: 'st_courier',
  ecom: 'ecom_express',
  ecomexpress: 'ecom_express',
  xpress_bees: 'xpressbees',
  fed_ex: 'fedex',
};

/** Resolve a stored courier value (code or legacy free text) to a catalog entry. */
export function getCourier(value) {
  const key = slug(value);
  if (!key) return null;
  return BY_KEY[key] || BY_KEY[LEGACY_ALIASES[key]] || null;
}

/** Display name for a stored courier value; unknown values render as typed. */
export function getCourierName(value) {
  return getCourier(value)?.name || value || '';
}

/**
 * Tracking link for an order.
 * Returns null when there is nothing to link to, otherwise
 * `{ url, prefilled }` — `prefilled: false` means the number must be pasted.
 */
export function getTrackingLink(courierValue, trackingNumber) {
  const courier = getCourier(courierValue);
  const number = String(trackingNumber || '').trim();
  if (!courier) return null;
  if (courier.track && number) return { url: courier.track(encodeURIComponent(number)), prefilled: true };
  return { url: courier.home, prefilled: false };
}
