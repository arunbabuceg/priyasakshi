import React from 'react';
import Nav from '@/components/Nav';
import Hero from '@/sections/Hero';
import Story from '@/sections/Story';
import ProductSection from '@/sections/ProductSection';
import Ingredients from '@/sections/Ingredients';
import Testimonials from '@/sections/Testimonials';
import Contact from '@/sections/Contact';
import Footer from '@/sections/Footer';
import CartDrawer from '@/components/CartDrawer';
import { categories } from '@/data/categories';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF5F8] text-[#2E2825] font-sans-body">
      <Nav />
      <main>
        <Hero />
        <Story />
        {categories.map((c) => (
          <ProductSection
            key={c.id}
            id={c.slug}
            category={c.id}
            eyebrow={c.eyebrow}
            title={c.title}
            highlight={c.highlight}
            subtitle={c.subtitle}
            accentColor={c.accentColor}
          />
        ))}
        <Ingredients />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
