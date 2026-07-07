# Deploying Lakshmi Sakshi

Two independent deployments:

| Piece      | Host   | Root folder | Runtime           |
| ---------- | ------ | ----------- | ----------------- |
| Frontend   | Vercel | `frontend/` | Node 18 (CRA)     |
| Backend    | Render | `backend/`  | Python 3.11 / FastAPI |
| Database   | MongoDB Atlas (free M0 tier is enough) | — | — |

---

## 1. Provision MongoDB (5 min)

1. Sign up at <https://cloud.mongodb.com>.
2. Create a **Free M0 cluster** in the region closest to Render (Singapore works well).
3. **Database Access** → Add a user with a strong password. Save the username / password.
4. **Network Access** → Add IP `0.0.0.0/0` (allow from anywhere — Render's IPs are dynamic on the free tier).
5. **Databases → Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<user>` / `<password>` with real values. Keep this — you'll paste it into Render.

---

## 2. Deploy the backend to Render (5 min)

**Repo layout expected**: `backend/` at the repo root (with `server.py`, `requirements.txt`, `Procfile`, `runtime.txt`).

### Option A — one-click via `render.yaml` (recommended)
1. Push the repo to GitHub.
2. Go to <https://dashboard.render.com/blueprints> → **New Blueprint** → connect your GitHub repo.
3. Render reads `render.yaml` at the repo root and creates the `lakshmi-sakshi-api` web service automatically.
4. When prompted, fill in the secret env vars:
   - `MONGO_URL` → the Atlas string from step 1.
   - `STRIPE_API_KEY` → `sk_test_...` for testing, `sk_live_...` for production.
   - `CORS_ORIGINS` → leave `*` for now (tighten later once you have your Vercel URL, e.g. `https://lakshmisakshi.com,https://lakshmisakshi.vercel.app`).
   - `DB_NAME` is pre-set to `lakshmi_sakshi`.
5. Click **Apply**. Render builds and deploys in ~3 min. Health check hits `/api/`.
6. Copy the public URL Render assigns, e.g. `https://lakshmi-sakshi-api.onrender.com`. You'll need this for the frontend.

### Option B — manual (if you don't want to use blueprints)
1. Dashboard → **New → Web Service** → connect the repo.
2. Configure:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/api/`
3. Add the same env vars listed above.
4. Deploy.

### Verify backend
```
curl https://<your-render-url>/api/
# → {"message":"Lakshmi Sakshi API is running"}

curl https://<your-render-url>/api/products | head -c 200
# → [{"id":"saree-magenta-olive", ...
```

> ⚠️ Free-tier Render web services **sleep after 15 min of inactivity** and take ~30–60 s to wake up on the first request. Upgrade to the Starter plan ($7/mo) to keep it warm in production.

---

## 3. Deploy the frontend to Vercel (3 min)

**Repo layout expected**: `frontend/` at the repo root (with `package.json`, `vercel.json`, `craco.config.js`).

1. Push the repo to GitHub (if not already).
2. <https://vercel.com/new> → **Import** your repo.
3. **Configure Project**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Create React App` (auto-detected).
   - **Build Command**: `yarn build` (auto, comes from `vercel.json`).
   - **Output Directory**: `build` (auto).
4. **Environment Variables** → add:
   ```
   REACT_APP_BACKEND_URL = https://<your-render-url>.onrender.com
   ```
   ⚠️ No trailing slash. Use the exact Render URL from step 2. Apply to `Production`, `Preview` and `Development`.
5. Click **Deploy**. First build takes ~2 min.
6. Once deployed, Vercel gives you a URL like `https://lakshmi-sakshi.vercel.app`.

### Tighten CORS
Go back to Render → Environment → update:
```
CORS_ORIGINS = https://lakshmi-sakshi.vercel.app,https://your-custom-domain.com
```
Save → Render redeploys automatically.

---

## 4. Connect a custom domain

### On Vercel (frontend / main domain)
1. Vercel dashboard → your project → **Settings → Domains**.
2. Enter your domain (`lakshmisakshi.com`). Vercel shows the required DNS records:
   - **Apex** (`lakshmisakshi.com`) → `A` record `76.76.21.21`
   - **www** → `CNAME` record `cname.vercel-dns.com`
3. Add those records at your registrar (GoDaddy, Namecheap, Cloudflare, etc.). Delete any conflicting A/CNAME records first.
4. DNS propagates in 5–30 min. Vercel auto-issues an SSL cert once verified.

### On Render (backend — usually a subdomain)
Optional but recommended: use `api.lakshmisakshi.com`.
1. Render dashboard → your web service → **Settings → Custom Domain**.
2. Add `api.lakshmisakshi.com`. Render shows a CNAME target.
3. At your registrar add:
   ```
   Type: CNAME   Host: api   Value: <render-cname-target>
   ```
4. Once verified, update Vercel's env var:
   ```
   REACT_APP_BACKEND_URL = https://api.lakshmisakshi.com
   ```
5. Redeploy the frontend from Vercel (env var change requires a redeploy).

---

## 5. Local development

### Backend
```bash
cd backend
cp .env.example .env      # then edit values (esp. MONGO_URL)
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

### Frontend
```bash
cd frontend
cp .env.example .env.local
# set REACT_APP_BACKEND_URL=http://localhost:8001
yarn install
yarn start
```

---

## 6. Stripe (INR payments)

The default `sk_test_emergent` key is a shared test key. For production:

1. Create a Stripe account at <https://stripe.com>.
2. **Settings → Business → Country**: India (required for INR).
3. **Developers → API keys** → copy the **Live secret key** (`sk_live_...`).
4. In Render → Environment → set `STRIPE_API_KEY` to the live key.

Note: Stripe requires KYC + a registered Indian business (proprietorship / LLP / Pvt Ltd) before it enables live INR payments.

---

## 7. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Frontend renders but products area is empty; console shows `Network Error` / CORS block | `REACT_APP_BACKEND_URL` is wrong or `CORS_ORIGINS` doesn't list the Vercel URL. Update the env var and redeploy. |
| `TypeError: X.map is not a function` | Backend didn't respond with an array — check `/api/products` returns JSON list. The frontend now falls back to `[]` on failure, so this bug is guarded. |
| Vercel build fails at install step | Ensure Node 18 is used (`.nvmrc` handles this). `@emergentbase/visual-edits` is in `optionalDependencies` so a fetch failure will not block the build. |
| Render deploy loops in "starting" | Check logs — usually `MONGO_URL` unset or wrong. The backend now fails fast with a clear message. |
| Stripe checkout returns "Payment provider error" | The Stripe key doesn't match the currency country. Use an Indian Stripe account for INR. |

---

## 8. Env var checklist

**Frontend (Vercel)**
| Key | Example |
| --- | --- |
| `REACT_APP_BACKEND_URL` | `https://lakshmi-sakshi-api.onrender.com` |

**Backend (Render)**
| Key | Example |
| --- | --- |
| `MONGO_URL` | `mongodb+srv://user:pw@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority` |
| `DB_NAME` | `lakshmi_sakshi` |
| `STRIPE_API_KEY` | `sk_test_...` (or `sk_live_...`) |
| `CORS_ORIGINS` | `https://lakshmisakshi.com,https://lakshmi-sakshi.vercel.app` |

That's it — push once, and both platforms will redeploy on every commit to `main`.
