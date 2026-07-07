import React, { useEffect, useState } from "react";
import { fetchProducts } from "../lib/api";
import ProductCard from "../components/ProductCard";
import ProductDialog from "../components/ProductDialog";
import { motion } from "framer-motion";

const ProductSection = ({
    id,
    category,
    eyebrow,
    title,
    highlight,
    subtitle,
    accentColor = "#8B2956",
}) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetchProducts(category)
            .then((data) => {
                if (!mounted) return;
                setProducts(Array.isArray(data) ? data : []);
            })
            .catch(() => mounted && setProducts([]))
            .finally(() => mounted && setLoading(false));
        return () => {
            mounted = false;
        };
    }, [category]);

    const handleOpen = (p) => {
        setSelected(p);
        setOpen(true);
    };

    return (
        <section
            id={id}
            className="relative py-24 md:py-32"
            data-testid={`section-${id}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="max-w-3xl"
                >
                    <span className="clay-pill" data-testid={`${id}-eyebrow`}>
                        {eyebrow}
                    </span>
                    <h2
                        className="mt-4 font-serif-display text-4xl sm:text-5xl leading-tight text-[#2E2825]"
                        data-testid={`${id}-title`}
                    >
                        {title}{" "}
                        <em
                            className="italic"
                            style={{ color: accentColor }}
                        >
                            {highlight}
                        </em>
                    </h2>
                    <p className="mt-4 text-base text-[#2E2825]/70 leading-relaxed max-w-xl">
                        {subtitle}
                    </p>
                </motion.div>

                {loading ? (
                    <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="clay-card p-5"
                                data-testid={`product-skeleton-${i}`}
                            >
                                <div className="aspect-[4/5] rounded-[24px] bg-[#F3EBDC] animate-pulse" />
                                <div className="mt-4 h-4 bg-[#F3EBDC] rounded animate-pulse" />
                                <div className="mt-2 h-3 w-1/2 bg-[#F3EBDC] rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div
                        className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        data-testid={`${id}-grid`}
                    >
                        {products.map((p, i) => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                index={i}
                                onOpen={handleOpen}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ProductDialog
                product={selected}
                open={open}
                onOpenChange={setOpen}
            />
        </section>
    );
};

export default ProductSection;
