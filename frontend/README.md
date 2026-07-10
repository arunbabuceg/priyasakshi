# Priya Sakshi — Frontend

Vite + React 18 + Tailwind. All presentation content (products, hero copy,
testimonials, ingredients) lives in [`src/data`](src/data). Swap those files
to edit the site — no backend or redeploy of the API required.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build → ./dist
npm run preview    # preview the production build
npm run lint       # ESLint (zero warnings)
npm run test       # Vitest + React Testing Library
```

## Environment

Only variables prefixed with `VITE_` are exposed to the browser bundle.

| Name              | Purpose                                    | Example                        |
| ----------------- | ------------------------------------------ | ------------------------------ |
| `VITE_BACKEND_URL`| Base URL of the FastAPI backend (no `/api`)| `https://priya-api.onrender.com` |

Copy `.env.example` → `.env` and edit.

## Adding / editing a product

1. Drop the new image files into `src/assets/images/products/`.
2. Import them at the top of [`src/data/products.js`](src/data/products.js).
3. Add a new object to the `products` array. Every product supports multiple
   images via the `images: []` array — the first entry is the primary.

See the file header for the full schema.

## Future → MongoDB migration

All UI reads products through [`src/services/productService.js`](src/services/productService.js).
When you're ready to move the catalog into MongoDB, replace the body of that
file with `axios` calls — no component changes required.
