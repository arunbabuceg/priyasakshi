# Priya Sakshi

> Handwoven Kanchipuram silk sarees & Garden Glow herbal skincare — a family-run atelier in Tamil Nadu.

A production-ready e-commerce codebase built on:

- **Frontend** — Vite + React 18 + Tailwind CSS + Framer Motion
- **Backend**  — FastAPI + MongoDB (Motor) + Resend (feature-flagged)
- **Deploys**  — Vercel (frontend), Render (backend), MongoDB Atlas

All presentation content — products, hero copy, testimonials, ingredients —
lives in [`frontend/src/data`](frontend/src/data). Edit those files and
redeploy the frontend; the backend never needs to change.

## Repository layout

```
priya-sakshi/
├── backend/            FastAPI service (auth-ready, email-ready)
│   ├── app/            Application code (config, db, models, routes, services)
│   ├── tests/          pytest smoke tests
│   └── requirements.txt
├── frontend/           Vite + React 18
│   ├── src/
│   │   ├── assets/     local images (products, banners, icons)
│   │   ├── components/ UI atoms & compositions
│   │   ├── context/    React contexts (Cart)
│   │   ├── data/       source-of-truth for products, testimonials, copy
│   │   ├── hooks/      reusable React hooks
│   │   ├── lib/        api client + small utilities
│   │   ├── pages/      routed pages
│   │   ├── sections/   landing-page sections
│   │   └── services/   data-access layer (swap here for future API)
│   └── __tests__/      Vitest + React Testing Library
├── render.yaml         one-click Render blueprint for the API
└── DEPLOYMENT.md       step-by-step deploy guide
```

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
cp .env.example .env    # then edit MONGO_URL etc.
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

## Future-ready hooks

Every feature that is not yet enabled has a clearly-named seam so it can be
turned on without a rewrite:

| Feature            | Seam to edit                                                    |
| ------------------ | --------------------------------------------------------------- |
| Payments (Stripe/Razorpay) | `frontend/src/services/paymentService.js` + backend `services/order_service.py` |
| Email notifications | `backend/app/services/email_service.py` (set `EMAIL_ENABLED=true` + `RESEND_API_KEY`) |
| Products in MongoDB| `frontend/src/services/productService.js` (swap static import for `apiClient.get`) |
| User accounts      | New `backend/app/routes/auth.py` + `frontend/src/context/AuthContext.jsx` |
| Admin panel        | New `/admin` route + protected `backend/app/routes/admin.py`   |
| Coupons / Wishlist | New service files under `backend/app/services/`                 |

## Deploying

See [`DEPLOYMENT.md`](DEPLOYMENT.md).

## License

© Priya Sakshi. All rights reserved.
