import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Instagram, Send } from "lucide-react";
import { toast } from "sonner";
import { sendContact, subscribeNewsletter } from "../lib/api";

const Contact = () => {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [sending, setSending] = useState(false);
    const [subEmail, setSubEmail] = useState("");
    const [subLoading, setSubLoading] = useState(false);

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) {
            toast.error("Please fill all fields");
            return;
        }
        setSending(true);
        try {
            await sendContact(form);
            toast.success("Thank you — we'll write back within a day.");
            setForm({ name: "", email: "", message: "" });
        } catch (err) {
            toast.error("Couldn't send message. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!subEmail) return;
        setSubLoading(true);
        try {
            await subscribeNewsletter(subEmail);
            toast.success("Welcome to the family");
            setSubEmail("");
        } catch (err) {
            toast.error("Could not subscribe. Please try again.");
        } finally {
            setSubLoading(false);
        }
    };

    return (
        <section
            id="contact"
            className="relative py-24 md:py-32"
            data-testid="contact-section"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid lg:grid-cols-2 gap-10">
                    {/* Contact form */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="clay-card p-8 sm:p-10"
                    >
                        <span className="clay-pill">Contact</span>
                        <h2 className="mt-4 font-serif-display text-4xl text-[#2E2825] leading-tight">
                            Write to us —
                            <br />
                            <em className="italic text-[#8B2956]">
                                we reply personally.
                            </em>
                        </h2>
                        <form
                            className="mt-8 space-y-4"
                            onSubmit={handleContactSubmit}
                        >
                            <div>
                                <label className="text-xs uppercase tracking-widest text-[#2E2825]/60 ml-3">
                                    Name
                                </label>
                                <input
                                    className="clay-input mt-1.5"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({ ...form, name: e.target.value })
                                    }
                                    data-testid="contact-name"
                                />
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-[#2E2825]/60 ml-3">
                                    Email
                                </label>
                                <input
                                    className="clay-input mt-1.5"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({ ...form, email: e.target.value })
                                    }
                                    data-testid="contact-email"
                                />
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-[#2E2825]/60 ml-3">
                                    Message
                                </label>
                                <textarea
                                    className="clay-input mt-1.5 min-h-[120px] resize-none"
                                    value={form.message}
                                    onChange={(e) =>
                                        setForm({ ...form, message: e.target.value })
                                    }
                                    data-testid="contact-message"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={sending}
                                className="clay-btn-primary h-14 px-8 flex items-center gap-2 disabled:opacity-70"
                                data-testid="contact-submit"
                            >
                                <Send className="w-4 h-4" />
                                {sending ? "Sending..." : "Send Message"}
                            </button>
                        </form>
                    </motion.div>

                    {/* Details + newsletter */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="space-y-6"
                    >
                        <div
                            className="clay-card-cream p-8"
                            data-testid="contact-details-card"
                        >
                            <h3 className="font-serif-display text-3xl text-[#8B2956]">
                                Our courtyard
                            </h3>
                            <div className="mt-6 space-y-4 text-sm text-[#2E2825]/80">
                                <Info
                                    icon={MapPin}
                                    text="12, Weavers Street, Kanchipuram, Tamil Nadu 631502, India"
                                    testId="contact-address"
                                />
                                <Info
                                    icon={Phone}
                                    text="+91 98400 12345"
                                    testId="contact-phone"
                                />
                                <Info
                                    icon={Mail}
                                    text="hello@lakshmisakshi.com"
                                    testId="contact-email-info"
                                />
                                <Info
                                    icon={Instagram}
                                    text="@lakshmi.sakshi"
                                    testId="contact-instagram"
                                />
                            </div>
                        </div>

                        <div
                            className="clay-card p-8"
                            style={{
                                background:
                                    "linear-gradient(180deg, #F7CFC1 0%, #EBA8C5 100%)",
                            }}
                        >
                            <h3 className="font-serif-display text-3xl text-[#8B2956]">
                                Slow letters,
                                <br />
                                once a month.
                            </h3>
                            <p className="mt-3 text-sm text-[#2E2825]/70">
                                New arrivals, herbal rituals, and stories from
                                our looms. Never spam.
                            </p>
                            <form
                                onSubmit={handleSubscribe}
                                className="mt-5 flex gap-3"
                            >
                                <input
                                    type="email"
                                    placeholder="Your email"
                                    className="clay-input flex-1"
                                    value={subEmail}
                                    onChange={(e) => setSubEmail(e.target.value)}
                                    data-testid="newsletter-email"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={subLoading}
                                    className="clay-btn-olive h-12 px-5 flex items-center gap-2 disabled:opacity-70"
                                    data-testid="newsletter-submit"
                                >
                                    <Send className="w-4 h-4" />
                                    Join
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

const Info = ({ icon: Icon, text, testId }) => (
    <div className="flex items-start gap-3">
        <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
                background: "#fff",
                boxShadow:
                    "inset 0 -3px 6px rgba(138,115,104,0.15), inset 0 3px 6px rgba(255,255,255,0.9), 0 4px 8px rgba(138,115,104,0.08)",
            }}
        >
            <Icon className="w-4 h-4 text-[#8B2956]" />
        </div>
        <span className="pt-2" data-testid={testId}>
            {text}
        </span>
    </div>
);

export default Contact;
