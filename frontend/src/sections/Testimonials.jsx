import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
    {
        text: "The magenta silk arrived wrapped in muslin with a hand-written note. I cried. It fits like it was woven for me — because it was.",
        name: "Ananya R.",
        city: "Chennai",
        color: "#EBA8C5",
    },
    {
        text: "The Tamarai hair oil is the only thing that has ever tamed my scalp. Three months in, I feel like myself again.",
        name: "Divya K.",
        city: "Bengaluru",
        color: "#F3D2A8",
    },
    {
        text: "I've bought sarees from every corner of India. Lakshmi Sakshi is the only house that answers my emails within an hour.",
        name: "Meera P.",
        city: "Mumbai",
        color: "#C7D6A1",
    },
];

const Testimonials = () => (
    <section
        id="testimonials"
        className="relative py-24 md:py-32 overflow-hidden"
        data-testid="testimonials-section"
    >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center max-w-2xl mx-auto"
            >
                <span className="clay-pill">Praise</span>
                <h2 className="mt-4 font-serif-display text-4xl sm:text-5xl text-[#2E2825] leading-tight">
                    Loved by <em className="italic text-[#8B2956]">women</em>{" "}
                    across the world.
                </h2>
            </motion.div>

            <div className="mt-14 grid md:grid-cols-3 gap-6">
                {testimonials.map((t, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.12 }}
                        className={`clay-card p-8 ${i === 1 ? "md:mt-10" : ""}`}
                        data-testid={`testimonial-${i}`}
                    >
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                            style={{
                                background: t.color,
                                boxShadow:
                                    "inset 0 -4px 8px rgba(0,0,0,0.08), inset 0 4px 8px rgba(255,255,255,0.5)",
                            }}
                        >
                            <Quote className="w-5 h-5 text-[#8B2956]" />
                        </div>
                        <p className="font-serif-display text-lg text-[#2E2825] leading-relaxed italic">
                            "{t.text}"
                        </p>
                        <div className="mt-6 pt-6 border-t border-[#EFE6D6]">
                            <div className="font-semibold text-[#8B2956]">
                                {t.name}
                            </div>
                            <div className="text-xs uppercase tracking-widest text-[#2E2825]/50 mt-1">
                                {t.city}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

export default Testimonials;
