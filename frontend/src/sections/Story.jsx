import React from "react";
import { motion } from "framer-motion";
import { Leaf, Scissors, Hand, Heart } from "lucide-react";

const values = [
    {
        icon: Scissors,
        title: "Woven by hand",
        text: "Every saree passes through a single weaver family over 12–18 days on pit looms.",
        color: "#D17B67",
        bg: "#F7CFC1",
    },
    {
        icon: Leaf,
        title: "Grown, never synthesised",
        text: "Garden Glow herbs are hand-picked, sun-dried and cold-infused — no chemicals, ever.",
        color: "#8A9A5B",
        bg: "#D2DFA8",
    },
    {
        icon: Hand,
        title: "Fair to artisans",
        text: "Weavers and herbalists earn 2× the regional average and hold co-op ownership.",
        color: "#D4A373",
        bg: "#EED4B0",
    },
    {
        icon: Heart,
        title: "Made in small batches",
        text: "We never overproduce. What you receive was created with intention — for you.",
        color: "#8B2956",
        bg: "#EBB5C8",
    },
];

const Story = () => (
    <section
        id="story"
        className="relative py-24 md:py-32"
        data-testid="story-section"
    >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-12 gap-12 items-start">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="lg:col-span-5 lg:sticky lg:top-32"
                >
                    <span className="clay-pill">Our Story</span>
                    <h2
                        className="mt-4 font-serif-display text-4xl sm:text-5xl text-[#2E2825] leading-tight"
                        data-testid="story-heading"
                    >
                        Two traditions,
                        <br />
                        <em className="italic text-[#8B2956]">one home.</em>
                    </h2>
                    <p className="mt-6 text-base text-[#2E2825]/75 leading-relaxed">
                        Founded by Priyasakshi in her grandmother's courtyard,
                        Lakshmi Sakshi began with a simple question: what if the
                        care we take with our silks was the same care we took
                        with our skin?
                    </p>
                    <p className="mt-4 text-base text-[#2E2825]/75 leading-relaxed">
                        Today, our looms and our garden work side by side. Silks
                        take shape in the same sunlight where our tamarai and
                        tulasi bloom — and both find their way to your daily
                        ritual.
                    </p>

                    <div className="mt-8 clay-card-cream p-6">
                        <div className="font-serif-display italic text-xl text-[#8B2956] leading-snug">
                            "A saree is worn on the body. A herb is worn from
                            within. Both are the same wish — to feel radiant."
                        </div>
                        <div className="mt-3 text-xs uppercase tracking-widest text-[#2E2825]/60">
                            — Priyasakshi, Founder
                        </div>
                    </div>
                </motion.div>

                <div className="lg:col-span-7 grid sm:grid-cols-2 gap-5">
                    {values.map((v, i) => (
                        <motion.div
                            key={v.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={`clay-card p-6 ${i % 2 === 1 ? "sm:mt-10" : ""}`}
                            data-testid={`value-card-${i}`}
                        >
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                                style={{
                                    background: v.bg,
                                    boxShadow: `inset 0 -4px 8px rgba(0,0,0,0.08), inset 0 4px 8px rgba(255,255,255,0.5)`,
                                }}
                            >
                                <v.icon
                                    className="w-6 h-6"
                                    style={{ color: v.color }}
                                    strokeWidth={2}
                                />
                            </div>
                            <h3 className="font-serif-display text-2xl text-[#2E2825] leading-tight">
                                {v.title}
                            </h3>
                            <p className="mt-2 text-sm text-[#2E2825]/70 leading-relaxed">
                                {v.text}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    </section>
);

export default Story;
