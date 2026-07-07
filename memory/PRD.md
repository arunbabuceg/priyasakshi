# Lakshmi Sakshi — Product Requirements

## Problem Statement
Elegant claymorphism e-commerce website for Lakshmi Sakshi — handwoven silk sarees + Garden Glow organic skincare. Full checkout with Stripe.

## Personas
1. Silk buyer looking for authentic handloom Kanchipuram sarees
2. Skincare enthusiast seeking herbal, chemical-free products
3. Diaspora Indian buying gifts (returns to shop for both)

## Architecture
- FastAPI backend + React 19 (CRA) + MongoDB
- Stripe checkout via emergentintegrations
- Products defined server-side (price tamper-proof)
- Claymorphism design system (Cormorant Garamond + Outfit)

## Completed (2026-07-07)
- ✅ Single-page site: Hero, Story, Sarees, Skincare, Ingredients (103 herbs), Testimonials, Contact, Footer
- ✅ 11 products (3 sarees + 8 skincare) with real product images
- ✅ Persistent cart (localStorage) with slide-over drawer
- ✅ Product detail dialog with quantity controls
- ✅ Full Stripe checkout flow (shipping form → Stripe → success/cancel)
- ✅ Success page polls status; Cancel page returns to shop
- ✅ Newsletter + Contact form (stored in MongoDB)
- ✅ Currency: INR ₹ (Indian numbering, no decimals)
- ✅ Free shipping over ₹5,000; else ₹99 flat
- ✅ 103-herb ingredients section with expand/collapse

## Backlog
- P1: Admin panel to add/edit products & view orders
- P1: Email confirmation via Resend on successful order
- P1: Product image gallery (multiple images per product)
- P2: User accounts with order history
- P2: Wishlist / save-for-later
- P2: Instagram feed integration
- P2: Coupon codes / discount system
