from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
    CheckoutSessionRequest,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
CURRENCY = "inr"
FREE_SHIPPING_THRESHOLD = 5000.0
FLAT_SHIPPING_FEE = 99.0

app = FastAPI(title="Lakshmi Sakshi API")
api_router = APIRouter(prefix="/api")


# ---------------------- Models ----------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    category: str  # "saree" | "skincare"
    price: float  # INR
    currency: str = "inr"
    short_description: str
    long_description: str
    image: str
    tag: Optional[str] = None
    stock: int = 20


class CartItem(BaseModel):
    product_id: str
    quantity: int


class CheckoutRequest(BaseModel):
    items: List[CartItem]
    origin_url: str
    customer_name: str
    customer_email: EmailStr
    shipping_address: str
    shipping_city: str
    shipping_state: str
    shipping_postal_code: str
    shipping_country: str
    phone: Optional[str] = None


class CheckoutSessionResp(BaseModel):
    url: str
    session_id: str


class PaymentStatusResp(BaseModel):
    status: str
    payment_status: str
    amount_total: float
    currency: str
    order_id: Optional[str] = None


# ---------------------- Herbal Ingredients (103 herbs in Tamarai oil) ----------------------
HERBAL_INGREDIENTS = [
    "Aloevera", "Pumpkin seeds", "Vajranthi Flowers",
    "Tuna Cactus (Chapathi Kalli / Kalli)", "Banyan tree Root",
    "Vetpalai Plant Leave", "Mudhiyar Koonthal", "Karpooravalli",
    "Sophora", "Brahmi", "Kesavardhini", "Rosemary", "Indigo Plant",
    "Kandankathiri", "Datura (Oomatham poo & seeds)", "Arborvitae Twig",
    "Wild Melons", "Aavaram poo and Leaves",
    "Water Leaf Spinach / Cylon Pasalai / Tharai Pasalai / Madras Keerai",
    "Stinging Nettle / Purple Dead Nettle / Pei Viratti", "Castor Seeds",
    "Nithya Kalayani Flower", "Aprajitha Flower (Sangu Poo)",
    "Phyllanthus Reticulatus / Karunelli Leaves", "Vallarai Plant",
    "Arappu Flower", "Thiruneetru Pachilai", "Malai Vembu leaf and seeds",
    "Neem Flower", "Tridax Procumbens (Thalaivetti Poo)",
    "Comfrey / Dandelion-like Violet Flower", "Bringaraj",
    "Guava Leaves and Flowers", "Moringa Leaves and Flowers",
    "Lemon", "Amla", "Fenugreek", "Lemon Leaves", "Amla Leaves",
    "Curry Leaves and Seeds", "Karunjeeragam / Kalonji", "Almonds",
    "Fenugreek Sprouts", "Fenugreek Leaves", "Lemon Grass",
    "Mehandi / Maruthani Ilai / Henna", "Mustard Seeds & Oil",
    "Fennel Seed and Plant", "Ganga Tulasi / American Mint", "Reetha",
    "Hibiscus Flower", "Hibiscus Leaves", "Shikakai Powder",
    "Rose / Paneer Rose", "Rice Water", "Wheat Grass",
    "Arugampul / Floor Grass", "Ashwagandha", "Green Tulsi",
    "Black Tulsi", "Pacha Payiru / Green Gram", "Mint", "Nochi Leaves",
    "Vetiver", "Pacha Karpooram", "Dhavanam",
    "Shallots / Chinna Vengayam", "Yellow and Red Onions", "Onion Skin",
    "Bay Leaves", "Tea Leaves", "Cloves", "Star Anise Seeds", "Garlic",
    "Manjista", "Arnica", "Marigold", "Betel Leaves", "Jasmine",
    "Pavazhavalli / Coral Jasmine Leaves", "Samandhi / Daisy", "Walnut",
    "Manathakali Seeds", "Dried Hibiscus Leaves and Flower",
    "Mango Leaves", "Wavy Cress / Water Cress", "Nandhiyavattai Flower",
    "Carrot", "Vilvam / Bilvah",
    "Spathodea Campanulata / Silk Fire Flower", "Poppy Seeds / Kaskas",
    "Keezhanelli", "Phyllanthus Acidus / Arai Nellikai",
    "Ginger", "Coconut / Coconut Oil", "Peanuts", "Red Sandalwood",
    "Mudakathan Keerai", "Kunnikittati / Micrococca Mercurialis",
    "Elaichi / Cardamom", "Rosary Peas", "Ponnangani Spinach",
    "Vishnu Kranthi Plant and Flower",
]


# ---------------------- Product Catalog (fixed on backend) ----------------------
PRODUCTS: List[Product] = [
    # ---------- Sarees ----------
    Product(
        id="saree-magenta-olive",
        name="Magenta & Olive Heritage Silk",
        category="saree",
        price=15999.0,
        short_description="Hand-woven pure silk saree with traditional kolam motifs and contrast olive pallu.",
        long_description="A regal heritage silk from our Kanchipuram artisans — deep magenta body, olive-green temple border and antique gold zari kolam motifs. Woven on traditional pit looms over 18 days by a single weaver family. Comes with a matching unstitched blouse piece.",
        image="https://customer-assets.emergentagent.com/job_18200c57-2ee7-4069-8631-396ac96bb510/artifacts/pajd7p83_WhatsApp%20Image%202026-07-07%20at%203.34.01%20PM%20%281%29.webp",
        tag="Bestseller",
        stock=8,
    ),
    Product(
        id="saree-blue-yellow",
        name="Indigo & Marigold Handloom",
        category="saree",
        price=13999.0,
        short_description="Soft handloom silk cotton with marigold pallu and delicate zari stripes.",
        long_description="Lightweight indigo silk-cotton handloom, perfect for daytime festivities. The marigold pallu is offset with fine gold zari lines and a temple-border finish.",
        image="https://images.unsplash.com/photo-1610189012906-4c0aa9b9781e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwzfHx0cmFkaXRpb25hbCUyMGluZGlhbiUyMHNpbGslMjBzYXJlZSUyMGhhbmRsb29tfGVufDB8fHx8MTc4MzQxOTM1MXww&ixlib=rb-4.1.0&q=85",
        tag="Handloom",
        stock=6,
    ),
    Product(
        id="saree-yellow-red",
        name="Sunlit Kanchipuram Silk",
        category="saree",
        price=18999.0,
        short_description="Pure Kanchipuram silk in golden yellow with a vermillion red border.",
        long_description="A bridal-worthy Kanchipuram silk in sun-kissed yellow with vermillion red korvai border. Woven with pure zari (silver dipped in gold) using a triple-shuttle technique — one of our most prized pieces.",
        image="https://images.unsplash.com/photo-1597897569252-9df44c7de0db?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMGluZGlhbiUyMHNpbGslMjBzYXJlZSUyMGhhbmRsb29tfGVufDB8fHx8MTc4MzQxOTM1MXww&ixlib=rb-4.1.0&q=85",
        tag="Premium",
        stock=4,
    ),

    # ---------- Skincare (Garden Glow) ----------
    Product(
        id="skin-tamarai-oil",
        name="Tamarai 100-Herb Hair Oil",
        category="skincare",
        price=1999.0,
        short_description="Our signature hair oil infused with 100+ herbs — for deep root nourishment.",
        long_description=(
            "Our flagship formula: 103 sun-dried herbs cold-infused for 40 days into virgin coconut and "
            "sesame base oils. Strengthens roots, soothes the scalp, adds gloss and helps prevent hair "
            "fall. 100ml. Weekly ritual: warm gently, massage into scalp, leave overnight, wash with our "
            "reetha-shikakai rinse.\n\n103 herbs inside: "
            + ", ".join(HERBAL_INGREDIENTS) + "."
        ),
        image="https://customer-assets.emergentagent.com/job_18200c57-2ee7-4069-8631-396ac96bb510/artifacts/5j4zouim_WhatsApp%20Image%202026-07-07%20at%203.32.49%20PM%20%281%29.jpeg",
        tag="Signature",
        stock=30,
    ),
    Product(
        id="skin-orithal-powder",
        name="Orithal Tamarai Face Powder",
        category="skincare",
        price=1499.0,
        short_description="A gentle exfoliating herbal powder for radiant, blemish-free skin.",
        long_description="Stone-ground orithal tamarai leaves blended with turmeric, sandalwood and rose petals. Mix with milk or rose water for a weekly ritual that brightens complexion and calms inflammation. 60g.",
        image="https://customer-assets.emergentagent.com/job_18200c57-2ee7-4069-8631-396ac96bb510/artifacts/3zmus17t_WhatsApp%20Image%202026-07-07%20at%203.32.49%20PM%20%283%29.jpeg",
        tag="20% Off",
        stock=45,
    ),
    Product(
        id="skin-ganga-tulasi",
        name="Ganga Tulasi Face Serum",
        category="skincare",
        price=2499.0,
        short_description="Hydrating serum with holy basil, ganga tulasi and squalane for a dewy finish.",
        long_description="A featherweight herbal serum that pairs holy basil and ganga tulasi extracts with plant squalane and vitamin E. Locks in moisture, protects the skin barrier and leaves a natural dewy finish. 30ml.",
        image="https://customer-assets.emergentagent.com/job_18200c57-2ee7-4069-8631-396ac96bb510/artifacts/xhzryqin_WhatsApp%20Image%202026-07-07%20at%203.32.51%20PM.jpeg",
        tag="New",
        stock=25,
    ),
    Product(
        id="skin-krishna-kranthi",
        name="Krishna Kranthi Facial Oil",
        category="skincare",
        price=2299.0,
        short_description="Hydrating facial oil for a rejuvenated, glowing complexion.",
        long_description="Cold-infused krishna kranthi (blue clitoria) petals in a base of jojoba and rosehip oils. Anti-ageing, brightening and deeply calming — a nightly ritual for radiant skin. 30ml.",
        image="https://customer-assets.emergentagent.com/job_18200c57-2ee7-4069-8631-396ac96bb510/artifacts/ixm6ndc4_WhatsApp%20Image%202026-07-07%20at%203.32.52%20PM%20%281%29.jpeg",
        tag="Anti-ageing",
        stock=20,
    ),
    # ---------- NEW products ----------
    Product(
        id="skin-tribal-poduthalai",
        name="Tribal Poduthalai Hair Oil",
        category="skincare",
        price=2199.0,
        short_description="A tribal recipe that visibly softens, strengthens and reduces dandruff in 25 days.",
        long_description=(
            "A rare tribal formulation of poduthalai (Phyla Nodiflora) infused into cold-pressed base oils. "
            "Day 2 — hair feels softer and shinier, dandruff visibly reduces. "
            "Day 12 — regular application makes hair more manageable. "
            "Day 25 — noticeable strengthening and reduced hair fall. 100ml."
        ),
        image="https://customer-assets.emergentagent.com/job_jewelry/artifacts/d83s34iu_WhatsApp%20Image%202026-07-07%20at%203.32.50%20PM%20%282%29.jpeg",
        tag="Tribal Recipe",
        stock=20,
    ),
    Product(
        id="skin-neeli-mahabringaraj",
        name="Neeli Mahabringaraj Hair Oil",
        category="skincare",
        price=2399.0,
        short_description="Strengthens hair, promotes growth and prevents hair fall — a classical ayurvedic blend.",
        long_description=(
            "A classical ayurvedic blend of neeli (indigofera) and mahabringaraj (eclipta) slow-cooked "
            "into a nourishing base of sesame and coconut oils. Strengthens the hair shaft, promotes "
            "healthy new growth and prevents fall. 100ml."
        ),
        image="https://customer-assets.emergentagent.com/job_jewelry/artifacts/p3kopiku_WhatsApp%20Image%202026-07-07%20at%203.32.50%20PM.jpeg",
        tag="Ayurvedic",
        stock=25,
    ),
    Product(
        id="skin-kuppaimeni-powder",
        name="Kuppaimeni Herbal Mix Powder",
        category="skincare",
        price=1299.0,
        short_description="Traditional herbal powder for skin problems, unwanted facial hair and daily face care.",
        long_description=(
            "A traditional medicine powder built on generations of knowledge and skills. Kuppaimeni "
            "(Acalypha Indica) is stone-ground with complementary herbs to help with skin problems, "
            "improve skin health, gently remove facial hair and support daily face care. 80g."
        ),
        image="https://customer-assets.emergentagent.com/job_jewelry/artifacts/wgc1q2rf_WhatsApp%20Image%202026-07-07%20at%203.32.51%20PM%20%281%29.jpeg",
        tag="Traditional",
        stock=30,
    ),
    Product(
        id="skin-garden-glow-blend",
        name="Garden Glow Herbal Blend",
        category="skincare",
        price=1799.0,
        short_description="A ready-to-brew herbal wellness tea for glow from within.",
        long_description="Sun-dried tulasi, moringa, hibiscus and licorice root — steep for 5 minutes for a daily glow ritual that supports skin and digestion. 80g loose leaf.",
        image="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwxfHxuYXR1cmFsJTIwb3JnYW5pYyUyMHNraW5jYXJlJTIwaGVyYnMlMjBvaWxzfGVufDB8fHx8MTc4MzQxOTM1MXww&ixlib=rb-4.1.0&q=85",
        tag="Wellness",
        stock=35,
    ),
]

PRODUCT_MAP: Dict[str, Product] = {p.id: p for p in PRODUCTS}


# ---------------------- Routes ----------------------
@api_router.get("/")
async def root():
    return {"message": "Lakshmi Sakshi API is running"}


@api_router.get("/products", response_model=List[Product])
async def list_products(category: Optional[str] = None):
    if category:
        return [p for p in PRODUCTS if p.category == category]
    return PRODUCTS


@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    if product_id not in PRODUCT_MAP:
        raise HTTPException(status_code=404, detail="Product not found")
    return PRODUCT_MAP[product_id]


@api_router.get("/ingredients")
async def get_ingredients():
    return {"count": len(HERBAL_INGREDIENTS), "ingredients": HERBAL_INGREDIENTS}


def _compute_totals(items: List[CartItem]):
    subtotal = 0.0
    line_items = []
    for it in items:
        if it.quantity <= 0:
            continue
        p = PRODUCT_MAP.get(it.product_id)
        if not p:
            raise HTTPException(status_code=400, detail=f"Invalid product {it.product_id}")
        line_total = round(p.price * it.quantity, 2)
        subtotal += line_total
        line_items.append(
            {
                "product_id": p.id,
                "name": p.name,
                "unit_price": p.price,
                "quantity": it.quantity,
                "line_total": line_total,
                "image": p.image,
            }
        )
    subtotal = round(subtotal, 2)
    shipping = 0.0 if subtotal >= FREE_SHIPPING_THRESHOLD else FLAT_SHIPPING_FEE
    total = round(subtotal + shipping, 2)
    return line_items, subtotal, shipping, total


@api_router.post("/checkout/session", response_model=CheckoutSessionResp)
async def create_checkout(payload: CheckoutRequest, request: Request):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    line_items, subtotal, shipping, total = _compute_totals(payload.items)
    if total <= 0:
        raise HTTPException(status_code=400, detail="Invalid order total")

    order_id = str(uuid.uuid4())

    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/cancel"

    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"

    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    metadata = {
        "order_id": order_id,
        "customer_email": payload.customer_email,
        "customer_name": payload.customer_name,
        "source": "lakshmi_sakshi_web",
    }

    checkout_req = CheckoutSessionRequest(
        amount=float(total),
        currency=CURRENCY,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )

    try:
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_req)
    except Exception as e:
        logging.exception("Stripe checkout creation failed")
        raise HTTPException(status_code=500, detail=f"Payment provider error: {e}")

    order_doc = {
        "id": order_id,
        "session_id": session.session_id,
        "customer_name": payload.customer_name,
        "customer_email": payload.customer_email,
        "phone": payload.phone,
        "shipping": {
            "address": payload.shipping_address,
            "city": payload.shipping_city,
            "state": payload.shipping_state,
            "postal_code": payload.shipping_postal_code,
            "country": payload.shipping_country,
        },
        "items": line_items,
        "subtotal": subtotal,
        "shipping_fee": shipping,
        "total": total,
        "currency": CURRENCY,
        "status": "pending",
        "payment_status": "initiated",
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.orders.insert_one(order_doc)

    txn_doc = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "session_id": session.session_id,
        "amount": total,
        "currency": CURRENCY,
        "metadata": metadata,
        "payment_status": "initiated",
        "status": "pending",
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.payment_transactions.insert_one(txn_doc)

    return CheckoutSessionResp(url=session.url, session_id=session.session_id)


@api_router.get("/checkout/status/{session_id}", response_model=PaymentStatusResp)
async def get_checkout_status(session_id: str, request: Request):
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Session not found")

    if txn.get("payment_status") == "paid":
        return PaymentStatusResp(
            status=txn.get("status", "complete"),
            payment_status="paid",
            amount_total=float(txn.get("amount", 0)),
            currency=txn.get("currency", CURRENCY),
            order_id=txn.get("order_id"),
        )

    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    try:
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    except Exception as e:
        logging.exception("Stripe status fetch failed")
        raise HTTPException(status_code=500, detail=f"Payment provider error: {e}")

    new_status = status.status
    new_payment_status = status.payment_status

    if txn.get("payment_status") != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "status": new_status,
                    "payment_status": new_payment_status,
                    "updated_at": now_iso(),
                }
            },
        )
        await db.orders.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "status": new_status,
                    "payment_status": new_payment_status,
                    "updated_at": now_iso(),
                }
            },
        )

    return PaymentStatusResp(
        status=new_status,
        payment_status=new_payment_status,
        amount_total=float(status.amount_total) / 100.0,
        currency=status.currency,
        order_id=txn.get("order_id"),
    )


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    try:
        event = await stripe_checkout.handle_webhook(body, signature)
    except Exception as e:
        logging.exception("Webhook parsing failed")
        raise HTTPException(status_code=400, detail=str(e))

    session_id = event.session_id
    if session_id:
        existing = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if existing and existing.get("payment_status") != "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "payment_status": event.payment_status,
                        "status": "complete" if event.payment_status == "paid" else existing.get("status"),
                        "updated_at": now_iso(),
                    }
                },
            )
            await db.orders.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "payment_status": event.payment_status,
                        "status": "complete" if event.payment_status == "paid" else "pending",
                        "updated_at": now_iso(),
                    }
                },
            )

    return {"received": True}


# ---------------------- Newsletter ----------------------
class NewsletterSubscribe(BaseModel):
    email: EmailStr
    name: Optional[str] = None


@api_router.post("/newsletter/subscribe")
async def subscribe_newsletter(payload: NewsletterSubscribe):
    doc = {
        "id": str(uuid.uuid4()),
        "email": payload.email,
        "name": payload.name,
        "created_at": now_iso(),
    }
    await db.newsletter.update_one(
        {"email": payload.email},
        {"$set": doc},
        upsert=True,
    )
    return {"ok": True, "message": "Subscribed"}


# ---------------------- Contact ----------------------
class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    message: str


@api_router.post("/contact")
async def contact(payload: ContactMessage):
    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "email": payload.email,
        "message": payload.message,
        "created_at": now_iso(),
    }
    await db.contact_messages.insert_one(doc)
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
