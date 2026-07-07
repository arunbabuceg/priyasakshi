import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getCheckoutStatus } from "../lib/api";
import { useCart } from "../context/CartContext";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { ClayShapes, KolamStar } from "../components/ClayShapes";
import { motion } from "framer-motion";
import { formatINR } from "../lib/format";

const MAX_ATTEMPTS = 8;
const INTERVAL_MS = 2000;

export default function SuccessPage() {
    const [params] = useSearchParams();
    const sessionId = params.get("session_id");
    const { clear } = useCart();
    const [status, setStatus] = useState({ state: "loading" });
    const clearedRef = useRef(false);

    useEffect(() => {
        if (!sessionId) {
            setStatus({ state: "error", message: "Missing session id" });
            return;
        }
        let cancelled = false;

        const poll = async (attempts = 0) => {
            if (attempts >= MAX_ATTEMPTS) {
                if (!cancelled)
                    setStatus({
                        state: "timeout",
                        message:
                            "Payment status check timed out. Please check your email for confirmation.",
                    });
                return;
            }
            try {
                const data = await getCheckoutStatus(sessionId);
                if (cancelled) return;
                if (data.payment_status === "paid") {
                    if (!clearedRef.current) {
                        clearedRef.current = true;
                        clear();
                    }
                    setStatus({ state: "paid", data });
                    return;
                }
                if (data.status === "expired") {
                    setStatus({
                        state: "expired",
                        message:
                            "Your payment session expired. Please try again.",
                    });
                    return;
                }
                setStatus({ state: "pending" });
                setTimeout(() => poll(attempts + 1), INTERVAL_MS);
            } catch (e) {
                if (!cancelled)
                    setStatus({
                        state: "error",
                        message:
                            e?.response?.data?.detail ||
                            e.message ||
                            "Something went wrong",
                    });
            }
        };
        poll();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    return (
        <div
            className="min-h-screen bg-[#FAF7F2] relative overflow-hidden flex items-center justify-center px-4 py-20"
            data-testid="success-page"
        >
            <ClayShapes variant="hero" />
            <motion.div
                className="clay-card p-10 sm:p-14 max-w-lg w-full text-center relative z-10"
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6 }}
            >
                {(status.state === "loading" || status.state === "pending") && (
                    <>
                        <div
                            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                            style={{
                                background:
                                    "linear-gradient(180deg, #F3D2A8 0%, #D4A373 100%)",
                                boxShadow:
                                    "0 20px 30px rgba(180,140,90,0.3), inset 0 -6px 12px rgba(100,60,20,0.25), inset 0 6px 12px rgba(255,255,255,0.5)",
                            }}
                            data-testid="success-loading-icon"
                        >
                            <Loader2 className="w-9 h-9 text-white animate-spin" />
                        </div>
                        <h1 className="mt-6 font-serif-display text-4xl text-[#2E2825]">
                            Confirming your order…
                        </h1>
                        <p className="mt-3 text-[#2E2825]/70">
                            Please hold on for a moment while we speak to Stripe.
                        </p>
                    </>
                )}

                {status.state === "paid" && (
                    <>
                        <div className="flex justify-center mb-4 animate-spin-slow">
                            <KolamStar size={70} color="#8A9A5B" />
                        </div>
                        <div
                            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                            style={{
                                background:
                                    "linear-gradient(180deg, #B4C77E 0%, #6F7E46 100%)",
                                boxShadow:
                                    "0 20px 30px rgba(120,140,70,0.35), inset 0 -6px 12px rgba(40,60,20,0.3), inset 0 6px 12px rgba(255,255,255,0.5)",
                            }}
                            data-testid="success-paid-icon"
                        >
                            <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>
                        <h1
                            className="mt-6 font-serif-display text-5xl text-[#8B2956]"
                            data-testid="success-title"
                        >
                            Thank you.
                        </h1>
                        <p className="mt-3 text-[#2E2825]/70 leading-relaxed">
                            Your order for{" "}
                            <span className="font-semibold text-[#2E2825]">
                                {formatINR(status.data.amount_total)}
                            </span>{" "}
                            has been received. We've sent a confirmation to your
                            email, and we'll be in touch shortly with dispatch
                            details.
                        </p>
                        {status.data.order_id && (
                            <div
                                className="mt-6 clay-pill inline-block"
                                data-testid="success-order-id"
                            >
                                Order · {status.data.order_id.slice(0, 8)}
                            </div>
                        )}
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Link
                                to="/"
                                className="clay-btn-primary h-13 px-6 py-3.5 inline-block"
                                data-testid="success-back-home"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </>
                )}

                {(status.state === "expired" ||
                    status.state === "error" ||
                    status.state === "timeout") && (
                    <>
                        <div
                            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                            style={{
                                background:
                                    "linear-gradient(180deg, #F7CFC1 0%, #B96654 100%)",
                                boxShadow:
                                    "0 20px 30px rgba(180,90,70,0.3), inset 0 -6px 12px rgba(100,30,20,0.3), inset 0 6px 12px rgba(255,255,255,0.4)",
                            }}
                        >
                            <XCircle className="w-9 h-9 text-white" />
                        </div>
                        <h1 className="mt-6 font-serif-display text-3xl text-[#2E2825]">
                            {status.state === "expired"
                                ? "Session expired"
                                : "We couldn't verify your payment"}
                        </h1>
                        <p className="mt-3 text-[#2E2825]/70 text-sm">
                            {status.message ||
                                "Please try again or contact us."}
                        </p>
                        <Link
                            to="/"
                            className="mt-8 inline-block clay-btn-primary h-13 px-6 py-3.5"
                        >
                            Back to Home
                        </Link>
                    </>
                )}
            </motion.div>
        </div>
    );
}
