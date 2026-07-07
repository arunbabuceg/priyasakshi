import React from "react";
import { motion } from "framer-motion";
import { ClayShapes, KolamStar } from "../components/ClayShapes";
import { ArrowDown, Sparkles } from "lucide-react";

const Hero = () => {
    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <section
            id="hero"
            className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32"
            data-testid="hero-section"
        >
            <ClayShapes variant="hero" />
            <div className="grain-overlay absolute inset-0" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid lg:grid-cols-12 gap-10 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="lg:col-span-6"
                    >
                        <span
                            className="clay-pill inline-flex items-center gap-2 mb-6"
                            data-testid="hero-eyebrow"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Handcrafted in South India
                        </span>
                        <h1
                            className="font-serif-display text-[#8B2956] text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight"
                            data-testid="hero-title"
                        >
                            Woven <em className="italic text-[#D17B67]">heritage.</em>
                            <br />
                            Grown <em className="italic text-[#8A9A5B]">glow.</em>
                        </h1>
                        <p
                            className="mt-6 text-base sm:text-lg text-[#2E2825]/75 max-w-xl leading-relaxed"
                            data-testid="hero-subtitle"
                        >
                            Lakshmi Sakshi is a family-run atelier blending
                            hand-woven Kanchipuram silks with slow-crafted{" "}
                            <span className="italic">Garden Glow</span> herbal skincare —
                            two traditions, one home ritual.
                        </p>

                        <div className="mt-10 flex flex-wrap gap-4">
                            <button
                                onClick={() => scrollTo("sarees")}
                                className="clay-btn-primary h-14 px-8 text-base"
                                data-testid="hero-cta-sarees"
                            >
                                Explore Sarees
                            </button>
                            <button
                                onClick={() => scrollTo("skincare")}
                                className="clay-btn-olive h-14 px-8 text-base"
                                data-testid="hero-cta-skincare"
                            >
                                Shop Garden Glow
                            </button>
                        </div>

                        <div className="mt-12 flex items-center gap-6 text-sm text-[#2E2825]/60">
                            <Stat value="120+" label="Weaver families" />
                            <div className="w-px h-8 bg-[#2E2825]/15" />
                            <Stat value="18 days" label="Per saree" />
                            <div className="w-px h-8 bg-[#2E2825]/15" />
                            <Stat value="100%" label="Herbal formulas" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="lg:col-span-6 relative"
                    >
                        <HeroCollage />
                    </motion.div>
                </div>

                <motion.button
                    onClick={() => scrollTo("story")}
                    className="mx-auto mt-16 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#2E2825]/50 hover:text-[#8B2956] transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    data-testid="hero-scroll-down"
                >
                    scroll to discover
                    <ArrowDown className="w-4 h-4 animate-bounce" />
                </motion.button>
            </div>
        </section>
    );
};

const Stat = ({ value, label }) => (
    <div>
        <div className="font-serif-display text-2xl text-[#8B2956] leading-none">
            {value}
        </div>
        <div className="text-[10px] uppercase tracking-widest mt-1">
            {label}
        </div>
    </div>
);

const HeroCollage = () => (
    <div className="relative w-full aspect-square max-w-[520px] mx-auto">
        {/* Main saree image */}
        <motion.div
            className="absolute top-0 left-0 w-[60%] aspect-[3/4] clay-card p-3 z-20"
            animate={{ y: [0, -10, 0], rotate: [-3, -1, -3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            style={{ transform: "rotate(-3deg)" }}
        >
            <div
                className="w-full h-full rounded-[20px] overflow-hidden"
                style={{ background: "#EBA8C5" }}
            >
                <img
                    src="https://customer-assets.emergentagent.com/job_18200c57-2ee7-4069-8631-396ac96bb510/artifacts/pajd7p83_WhatsApp%20Image%202026-07-07%20at%203.34.01%20PM%20%281%29.webp"
                    alt="Magenta silk saree"
                    className="w-full h-full object-cover"
                />
            </div>
        </motion.div>

        {/* Skincare bottle */}
        <motion.div
            className="absolute top-[18%] right-0 w-[46%] aspect-[3/4] clay-card p-3 z-10"
            animate={{ y: [0, 12, 0], rotate: [4, 6, 4] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            style={{ transform: "rotate(5deg)" }}
        >
            <div
                className="w-full h-full rounded-[20px] overflow-hidden"
                style={{ background: "#F3D2A8" }}
            >
                <img
                    src="https://customer-assets.emergentagent.com/job_18200c57-2ee7-4069-8631-396ac96bb510/artifacts/xhzryqin_WhatsApp%20Image%202026-07-07%20at%203.32.51%20PM.jpeg"
                    alt="Tamarai hair oil"
                    className="w-full h-full object-cover"
                />
            </div>
        </motion.div>

        {/* Floating serum */}
        <motion.div
            className="absolute bottom-0 left-[18%] w-[42%] aspect-square clay-card p-3 z-30"
            animate={{ y: [0, -8, 0], rotate: [2, 4, 2] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ transform: "rotate(3deg)" }}
        >
            <div
                className="w-full h-full rounded-[20px] overflow-hidden"
                style={{ background: "#C7D6A1" }}
            >
                <img
                    src="https://customer-assets.emergentagent.com/job_18200c57-2ee7-4069-8631-396ac96bb510/artifacts/5j4zouim_WhatsApp%20Image%202026-07-07%20at%203.32.49%20PM%20%281%29.jpeg"
                    alt="Ganga Tulasi serum"
                    className="w-full h-full object-cover"
                />
            </div>
        </motion.div>

        {/* Kolam star ornaments */}
        <motion.div
            className="absolute -top-4 right-[35%] z-40 animate-spin-slow"
        >
            <KolamStar size={70} color="#8A9A5B" />
        </motion.div>
        <motion.div className="absolute bottom-8 -right-2 z-40">
            <KolamStar size={50} color="#D17B67" />
        </motion.div>
    </div>
);

export default Hero;
