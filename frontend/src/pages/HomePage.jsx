import React from "react";
import Nav from "../components/Nav";
import Hero from "../sections/Hero";
import Story from "../sections/Story";
import ProductSection from "../sections/ProductSection";
import Ingredients from "../sections/Ingredients";
import Testimonials from "../sections/Testimonials";
import Contact from "../sections/Contact";
import Footer from "../sections/Footer";
import CartDrawer from "../components/CartDrawer";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[#FAF7F2] text-[#2E2825] font-sans-body">
            <Nav />
            <main>
                <Hero />
                <Story />
                <ProductSection
                    id="sarees"
                    category="saree"
                    eyebrow="Handwoven Silks"
                    title="Kanchipuram"
                    highlight="silks."
                    subtitle="Pure zari, temple borders and pit-loom weaves. Each saree is signed and numbered by its weaver — a keepsake, not just a purchase."
                    accentColor="#8B2956"
                />
                <ProductSection
                    id="skincare"
                    category="skincare"
                    eyebrow="Garden Glow"
                    title="Herbal"
                    highlight="skincare."
                    subtitle="Sun-dried tamarai, tulasi and kranthi petals cold-infused into pure carrier oils. Formulated by our founder in her grandmother's kitchen."
                    accentColor="#8A9A5B"
                />
                <Ingredients />
                <Testimonials />
                <Contact />
            </main>
            <Footer />
            <CartDrawer />
        </div>
    );
}
