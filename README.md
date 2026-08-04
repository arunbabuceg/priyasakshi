# Priya Sakshi

> Handwoven Kanchipuram silk sarees & Garden Glow herbal skincare — a family-run atelier in Tamil Nadu.

A production-ready e-commerce codebase built on:

- **Frontend** — Vite + React 18 + Tailwind CSS + Framer Motion
- **Backend**  — FastAPI + MongoDB (Motor) + JWT auth + Titan SMTP email
- **Deploys**  — Vercel (frontend), Render (backend), MongoDB Atlas

All presentation content — products, hero copy, testimonials, ingredients —
lives in [`frontend/src/data`](frontend/src/data). Edit those files and
redeploy the frontend; the backend never needs to change for content edits.

## Repository layout

```
priya-sakshi/
├── backend/            FastAPI service (auth, orders, email, contact, newsletter)
│   ├── app/            Application code (config, db, routes, models, services)
│   ├── tests/          pytest smoke tests
│   └── requirements.txt
├── frontend/           Vite + React 18
│   ├── src/
│   │   ├── assets/     local images (products, banners, icons)
│   │   ├── components/ UI atoms & compositions
│   │   ├── context/    React contexts (Cart, Auth)
│   │   ├── data/       source-of-truth for products, testimonials, copy
│   │   ├── hooks/      reusable React hooks
│   │   ├── lib/        api client + small utilities
│   │   ├── pages/      routed pages (home, auth, password reset, verify email)
│   │   ├── sections/   landing-page sections
│   │   └── services/   data-access layer (auth, order, contact, newsletter, payment)
│   └── __tests__/      Vitest + React Testing Library
├── render.yaml         one-click Render blueprint for the API
└── DEPLOYMENT.md       step-by-step deploy guide
```

## Features

- **Authentication** — JWT-based register / login / logout, email verification,
  forgot password, reset password. Tokens are stored in secure HTTP-only
  cookies; login persists across refresh. Passwords hashed with bcrypt.
- **Email** — Transactional email via Titan SMTP (STARTTLS, port 587).
  - Contact form submissions are sent to `arunbabuceg@gmail.com`.
  - Every new order sends a full notification email to `arunbabuceg@gmail.com`.
  - Customers automatically receive a responsive branded order confirmation.
- **Orders** — Orders are recorded in MongoDB; the payment step is intentionally
  disabled and shows "Online payments will be available soon." The payment
  layer is modular so Razorpay/Stripe can be plugged in later with minimal
  changes (see `frontend/src/services/paymentService.js`).
- **Mobile** — Tightened section spacing on mobile; the product modal is fully
  touch-scrollable and never freezes the page.

## Environment variables

### Backend (`backend/.env`)

See [`backend/.env.example`](backend/.env.example).

| Variable | Purpose | Example |
| --- | --- | --- |
| `MONGO_URL` | MongoDB connection string | `mongodb+srv://...` |
| `DB_NAME` | Database name | `priya_sakshi` |
| `CORS_ORIGINS` | Allowed origins (comma-separated or `*`) | `*` |
| `BRAND_NAME` | Brand name | `Priya Sakshi` |
| `BRAND_FROM_EMAIL` | Sender display address | `hello@priyasakshi.com` |
| `CONTACT_TO_EMAIL` | Where contact + order notifications are sent | `arunbabuceg@gmail.com` |
| `FRONTEND_URL` | Frontend base URL (for email links) | `http://localhost:3000` |
| `SMTP_HOST` | Titan SMTP host | `smtp.titan.email` |
| `SMTP_PORT` | Titan SMTP port | `587` |
| `SMTP_USER` | Titan email address | `you@yourdomain.com` |
| `SMTP_PASS` | Titan email password | `••••••••` |
| `JWT_SECRET` | Secret used to sign JWTs (use a long random string) | `...` |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `1440` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `30` |
| `VERIFICATION_TOKEN_EXPIRE_HOURS` | Email verification link lifetime | `24` |
| `PASSWORD_RESET_TOKEN_EXPIRE_HOURS` | Password reset link lifetime | `1` |

> Never hardcode SMTP credentials or JWT secrets. Always load them from
> environment variables. Do not commit `.env`.

### Frontend (`frontend/.env`)

See [`frontend/.env.example`](frontend/.env.example).

| Variable | Purpose | Example |
| --- | --- | --- |
| `VITE_BACKEND_URL` | Base URL of the FastAPI backend (no `/api`) | `http://localhost:8001` |

## Running locally

### Prerequisites

- Node.js ≥ 18.18
- Python ≥ 3.11
- MongoDB (Atlas or `mongod` running locally on `27017`)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # then edit MONGO_URL, SMTP_*, JWT_SECRET
uvicorn server:app --reload
# API on http://localhost:8001/api/
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env    # point VITE_BACKEND_URL to your backend
npm run dev
# http://localhost:3000
```

### Tests & linting

```bash
# Frontend
cd frontend
npm run lint
npm run test

# Backend
cd backend
pytest
```

## Authentication setup

1. Set `JWT_SECRET` to a long random string in `backend/.env`.
2. Set `FRONTEND_URL` to your frontend origin (used to build email links).
3. Register at `/register` — a verification email is sent (if SMTP is configured).
4. Login persists via HTTP-only cookies set by the backend; the frontend calls
   `GET /api/auth/me` on load to restore the session.
5. Auth routes: `/login`, `/register`, `/forgot-password`, `/reset-password`,
   `/verify-email`.

The `AuthContext` exposes `{ user, loading, login, register, logout }` so future
modules (order history, wishlist, profile) can read the current user without
refactoring.

## Titan SMTP configuration

Emails are sent through Titan's SMTP server using STARTTLS.

```
SMTP_HOST=smtp.titan.email
SMTP_PORT=587
SMTP_USER=<your-titan-email-address>
SMTP_PASS=<your-titan-email-password>
```

If `SMTP_USER` / `SMTP_PASS` are not set, email calls become logged no-ops so
local development works without a mailbox. Contact-form and order-notification
emails are delivered to `CONTACT_TO_EMAIL` (default `arunbabuceg@gmail.com`).

## Editing site content

| I want to change…        | File                                    |
| ------------------------ | --------------------------------------- |
| Product prices / names   | `frontend/src/data/products.js`         |
| Product images           | `frontend/src/assets/images/products/` → update imports in `products.js` |
| Hero headline / stats    | `frontend/src/data/hero.js`             |
| Story / About            | `frontend/src/data/about.js`            |
| Testimonials             | `frontend/src/data/testimonials.js`     |
| 103-herb ingredient list | `frontend/src/data/ingredients.js`      |
| Brand name / contact     | `frontend/src/data/site.js`             |

No backend redeploy required for any of the above.

## Payment (future-ready)

Payments are intentionally disabled. To enable a provider later, edit only:

1. `frontend/src/services/paymentService.js` — implement `startCheckout(orderPayload)`
   for your provider (Razorpay `checkout.js`, Stripe redirect, etc.) and flip
   `PAYMENTS_ENABLED = true`.
2. `frontend/src/components/CheckoutForm.jsx` — the `if (PAYMENTS_ENABLED)`
   branch already exists; drop the provider call there.
3. Backend `services/order_service.py` — wire the payment webhook to mark
   orders as paid.

No payment-specific logic is hardcoded elsewhere.

## Deploying

See [`DEPLOYMENT.md`](DEPLOYMENT.md). Remember to set all environment
variables (including `JWT_SECRET` and the `SMTP_*` group) on Render, and
`VITE_BACKEND_URL` on Vercel.

## License

© Priya Sakshi. All rights reserved.
