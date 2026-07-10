# Deploying Priya Sakshi

Three independent moving parts:

| Piece    | Host        | Root folder | Runtime               |
| -------- | ----------- | ----------- | --------------------- |
| Frontend | Vercel      | `frontend/` | Node ≥ 18 (Vite)      |
| Backend  | Render      | `backend/`  | Python 3.11 / FastAPI |
| Database | MongoDB Atlas free tier | — | —        |

---

## 1. Provision MongoDB (~5 min)

1. Sign up at <https://cloud.mongodb.com>.
2. Create a free **M0 cluster** in the region closest to Render (Singapore works well for India).
3. **Database Access** → add a user with a strong password.
4. **Network Access** → add `0.0.0.0/0` (Render free-tier IPs are dynamic).
5. **Databases → Connect → Drivers** → copy the connection string, e.g.
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

## 2. Deploy the backend to Render (~5 min)

Repo layout expects `backend/` at the repo root (with `server.py`, `requirements.txt`, `Procfile`, `runtime.txt`).

### One-click via `render.yaml`

1. Push the repo to GitHub.
2. <https://dashboard.render.com/blueprints> → **New Blueprint** → connect the repo.
3. Render reads `render.yaml` and provisions the `priya-sakshi-api` web service.
4. Fill in the secret env vars when prompted:
   - `MONGO_URL`  → the Atlas string from step 1
   - `CORS_ORIGINS` → leave `*` for now (tighten once the Vercel URL is known, e.g. `https://priya-sakshi.vercel.app,https://priyasakshi.com`)
   - `EMAIL_ENABLED` → `false` (leave off until you have a Resend key)
   - `RESEND_API_KEY` → leave blank
   - `BRAND_FROM_EMAIL` → `hello@yourdomain.com` (defaults are fine)
5. Click **Apply**. Render builds and deploys in ~3 min. Health-check path is `/api/`.
6. Copy the public URL Render assigns, e.g. `https://priya-sakshi-api.onrender.com`.

### Verify

```bash
curl https://<your-render-url>/api/
# {"message":"Priya Sakshi API is running"}
```

> ⚠️ Free-tier Render services sleep after 15 min of inactivity and take ~30–60 s to wake up. Upgrade to the Starter plan ($7/mo) to keep it warm.

---

## 3. Deploy the frontend to Vercel (~3 min)

1. Push the repo to GitHub (if not already).
2. <https://vercel.com/new> → **Import** the repo.
3. **Configure Project**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite` (auto-detected via `vercel.json`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables** → add:
   ```
   VITE_BACKEND_URL = https://<your-render-url>.onrender.com
   ```
5. Deploy. Vercel gives you `https://<project>.vercel.app`.

### Verify

Open the deployed URL, add a saree to the basket, click Checkout, submit the form — the toast says *“Online payments will be available soon.”* and the order is stored on the backend (visible in MongoDB Atlas → collection `orders`).

---

## 4. Enabling email later (Resend)

1. Sign up at <https://resend.com> and create an API key.
2. On Render → the API service → **Environment**:
   - `RESEND_API_KEY` = your key
   - `EMAIL_ENABLED` = `true`
   - `BRAND_FROM_EMAIL` = `hello@yourdomain.com` (must be a domain you've verified in Resend)
3. Redeploy. New newsletter subscribers now receive a welcome email; contact-form submissions are relayed to `BRAND_FROM_EMAIL`.

---

## 5. Enabling payments later

Only two files need to change:

1. `frontend/src/services/paymentService.js` — implement `startCheckout(orderPayload)` for your provider (Razorpay `checkout.js`, Stripe redirect, PayPal, etc.) and flip `PAYMENTS_ENABLED = true`.
2. `frontend/src/components/CheckoutForm.jsx` — the `if (PAYMENTS_ENABLED)` branch already exists; drop the provider call there.

The backend `/api/orders` endpoint already records orders — wire the payment webhook into `backend/app/services/order_service.py` to mark them as paid.
