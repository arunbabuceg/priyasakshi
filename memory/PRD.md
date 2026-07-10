# Priya Sakshi — Product Requirements

## Problem Statement
Production-ready e-commerce site for Priya Sakshi — handwoven Kanchipuram
silk sarees + Garden Glow organic skincare. Payments are intentionally
disabled until a provider is chosen; the codebase is architected so that
payments, authentication, an admin panel, coupons, wishlist, inventory and
reviews can be plugged in later without a rewrite.

## Architecture
- **Frontend**: Vite + React 18 + Tailwind + Framer Motion, all product /
  hero / testimonial / ingredient data lives in `src/data/*.js`.
- **Backend**: FastAPI + Motor (MongoDB), modular `routes / models /
  services` layout, Resend email service feature-flagged behind
  `EMAIL_ENABLED`.
- **Deploys**: Vercel (frontend), Render (backend), MongoDB Atlas.
- **No Emergent dependencies remain** — no `@emergentbase/*`, no
  `emergentintegrations`, no emergent scripts or badge, no proprietary
  images (assets are all local under `src/assets/images/`).

## Completed (July 2026)
- ✅ Migrated CRA + CRACO → Vite (npm install, npm run dev, npm run build)
- ✅ Rebranded Lakshmi Sakshi → Priya Sakshi everywhere
- ✅ Removed all Emergent dependencies and assets
- ✅ Moved product catalog + 103 herbs + copy from backend to frontend
- ✅ Local product images (~1.6MB) under `src/assets/images/products/`
- ✅ Product schema supports `images: []` gallery from day one
- ✅ Cart context, drawer, drawer checkout form all functional
- ✅ Checkout submits to `/api/orders` and displays
      “Online payments will be available soon.”
- ✅ Resend email service prepared but disabled until API key provided
- ✅ Newsletter + Contact endpoints unchanged and working
- ✅ Backend refactored into `app/{config,db,routes,models,services}`
- ✅ Vitest + React Testing Library tests for Cart / ProductDialog / Checkout
- ✅ pytest smoke tests for backend
- ✅ ESLint 9 flat config, zero warnings

## Backlog (future work, seam ready)
- P1: Enable Resend (add key)
- P1: Wire Razorpay or Stripe via `services/paymentService.js`
- P1: Admin panel at `/admin` — product CRUD, orders list, inventory
- P2: User accounts + order history
- P2: Coupons / discount codes
- P2: Wishlist / save-for-later
- P2: Product reviews
- P2: Move products from static file into MongoDB (swap `productService.js`)
