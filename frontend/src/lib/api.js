import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
    baseURL: API,
    headers: { "Content-Type": "application/json" },
});

export const fetchProducts = async (category) => {
    const params = category ? { category } : {};
    const { data } = await api.get("/products", { params });
    return data;
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
