import axios from "axios";

// Read backend URL from env at runtime. Never crash if it is missing —
// return safe defaults so the UI keeps rendering.
const RAW_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const BACKEND_URL = RAW_BACKEND_URL.replace(/\/$/, "");
export const API = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

export const api = axios.create({
    baseURL: API,
    headers: { "Content-Type": "application/json" },
    timeout: 20000,
});

// -------- helpers --------
const ensureArray = (data, key) => {
    if (Array.isArray(data)) return data;
    if (data && key && Array.isArray(data[key])) return data[key];
    return [];
};

// -------- endpoints --------
export const fetchProducts = async (category) => {
    try {
        const params = category ? { category } : {};
        const { data } = await api.get("/products", { params });
        return ensureArray(data);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[api] fetchProducts failed:", err?.message);
        return [];
    }
};

export const fetchIngredients = async () => {
    try {
        const { data } = await api.get("/ingredients");
        return ensureArray(data, "ingredients");
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[api] fetchIngredients failed:", err?.message);
        return [];
    }
};

export const createCheckoutSession = async (payload) => {
    const { data } = await api.post("/checkout/session", payload);
    return data;
};

export const getCheckoutStatus = async (sessionId) => {
    const { data } = await api.get(`/checkout/status/${sessionId}`);
    return data;
};

export const subscribeNewsletter = async (email) => {
    const { data } = await api.post("/newsletter/subscribe", { email });
    return data;
};

export const sendContact = async (payload) => {
    const { data } = await api.post("/contact", payload);
    return data;
};
