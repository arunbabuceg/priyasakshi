import React from "react";
import { motion } from "framer-motion";

/**
 * ClayShapes — decorative floating 3D clay ornaments used as background accents.
 * Purely presentational; no interactive elements.
 */
export const ClayShapes = ({ variant = "hero" }) => {
    if (variant === "hero") {
        return (
            <>
                {/* soft color blobs */}
                <div
                    className="clay-blob"
                    style={{
                        width: 320,
                        height: 320,
                        background: "#F3C1A6",
                        top: -60,
                        left: -80,
                    }}
                />
                <div
                    className="clay-blob"
                    style={{
                        width: 280,
                        height: 280,
                        background: "#C7D6A1",
                        bottom: -80,
                        right: -60,
                    }}
                />
                <div
                    className="clay-blob"
                    style={{
                        width: 220,
                        height: 220,
                        background: "#E8B6C7",
                        top: "40%",
                        right: "10%",
                        opacity: 0.4,
                    }}
                />

                {/* 3D clay ornaments */}
                <motion.div
                    className="absolute hidden md:block"
                    style={{ top: "12%", right: "8%" }}
                    animate={{ y: [0, -14, 0], rotate: [0, 6, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                >
                    <LotusClay />
                </motion.div>
                <motion.div
                    className="absolute hidden md:block"
                    style={{ bottom: "8%", left: "5%" }}
                    animate={{ y: [0, 12, 0], rotate: [0, -8, 0] }}
                    transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                >
                    <LeafClay />
                </motion.div>
                <motion.div
                    className="absolute hidden md:block"
                    style={{ top: "55%", left: "42%" }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                    <BlobClay />
                </motion.div>
            </>
        );
    }
    return null;
};

export const LotusClay = ({ size = 120 }) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <defs>
            <radialGradient id="lotusGrad" cx="0.3" cy="0.3" r="0.8">
                <stop offset="0%" stopColor="#F7C3B0" />
                <stop offset="100%" stopColor="#D17B67" />
            </radialGradient>
            <radialGradient id="lotusGrad2" cx="0.5" cy="0.3" r="0.8">
                <stop offset="0%" stopColor="#EBA8C5" />
                <stop offset="100%" stopColor="#8B2956" />
            </radialGradient>
        </defs>
        <ellipse cx="60" cy="70" rx="45" ry="18" fill="url(#lotusGrad2)" opacity="0.9" />
        <ellipse cx="60" cy="60" rx="30" ry="34" fill="url(#lotusGrad)" />
        <circle cx="60" cy="50" r="10" fill="#F9E6A0" />
    </svg>
);

export const LeafClay = ({ size = 140 }) => (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none">
        <defs>
            <radialGradient id="leafGrad" cx="0.3" cy="0.3" r="0.8">
                <stop offset="0%" stopColor="#B4C77E" />
                <stop offset="100%" stopColor="#6F7E46" />
            </radialGradient>
        </defs>
        <path
            d="M20 100 Q40 20 120 30 Q100 110 20 100 Z"
            fill="url(#leafGrad)"
        />
        <path
            d="M30 92 Q60 60 110 40"
            stroke="#3F4B25"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.35"
        />
    </svg>
);

export const BlobClay = ({ size = 90 }) => (
    <svg width={size} height={size} viewBox="0 0 90 90" fill="none">
        <defs>
            <radialGradient id="blobGrad" cx="0.35" cy="0.3" r="0.8">
                <stop offset="0%" stopColor="#F3D2A8" />
                <stop offset="100%" stopColor="#B8895B" />
            </radialGradient>
        </defs>
        <path
            d="M45 5 C68 5 85 25 82 50 C79 75 55 88 34 82 C13 76 3 55 10 32 C15 15 28 5 45 5 Z"
            fill="url(#blobGrad)"
        />
    </svg>
);

export const KolamStar = ({ size = 60, color = "#8B2956" }) => (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
        <circle cx="30" cy="30" r="4" fill={color} />
        {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * Math.PI) / 4;
            const x = 30 + Math.cos(angle) * 20;
            const y = 30 + Math.sin(angle) * 20;
            return <circle key={i} cx={x} cy={y} r="2.5" fill={color} opacity="0.85" />;
        })}
    </svg>
);
