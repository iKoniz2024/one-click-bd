"use client";

import Link from 'next/link';
import { useState, useEffect } from "react";

import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getProductById } from "@/services/product.api";
import { formatBDT } from "@/utils/currency";
import OrderModal from "@/components/ui/OrderModal";
import { useAuth } from "@/hooks/useAuth";
import { useAddToCart } from "@/hooks/useAddToCart";

import { Check } from "lucide-react";

export default function NewArrivalsProductCard({ product, index }) {
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { addToCart } = useAddToCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = mounted && user?.role === "admin";
  const hasDiscount = product.discountPercentage > 0;
  const discountedPrice = hasDiscount
    ? (product.price * (1 - product.discountPercentage / 100)).toFixed(2)
    : null;
  const isOutOfStock = product.stock === 0;

  const hasVariants = (product?.sizes?.length > 0) || (product?.colors?.length > 0);

  const handleAddToCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVariants) {
      setShowModal(true);
    } else {
      addToCart(product);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
    }
  };

  const handlePrefetch = () => {
    if (product?._id) {
      queryClient.prefetchQuery({
        queryKey: ["product", String(product._id)],
        queryFn: () => getProductById(product._id),
        staleTime: 10 * 60 * 1000,
      });
    }
  };

  return (
    <>
      <motion.div
        custom={index}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
          }),
        }}
        className="shrink-0 w-37.5 sm:w-45"
      >
        <Link
          href={`/product/${product._id}`}
          className="group block h-full"
          onMouseEnter={handlePrefetch}
          onTouchStart={handlePrefetch}
        >
          <div className="flex h-full flex-col justify-between overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            {/* Section 1: Fixed Consistent Image Section */}
            <div className="relative h-32 sm:h-40 w-full shrink-0 overflow-hidden bg-muted/30 flex items-center justify-center border-b border-border/40">
              <img
                src={product.thumbnail || product.images?.[0] || null}
                alt={product.title}
                className="h-full w-full object-contain p-1.5 transition-transform duration-300 ease-out group-hover:scale-110 sm:group-hover:scale-115"
                loading="lazy"
              />
              {hasDiscount && (
                <div className="absolute left-0 top-3 z-10 rounded-r bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground shadow-sm">
                  -{Math.round(product.discountPercentage)}%
                </div>
              )}
              {isOutOfStock && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                  <span className="rounded bg-foreground px-2 py-1 text-[10px] font-semibold text-background">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col p-2 sm:p-2.5 gap-1.5">
              <p className="hidden sm:block text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate h-3.5 leading-3.5">
                {product.brand || "\u00A0"}
              </p>

              {/* Title Section (Consistent 2-line height allocation with vertical centering) */}
              <div className="h-8 sm:h-9 overflow-hidden flex items-center">
                <h4 className="line-clamp-2 text-xs font-semibold text-foreground leading-tight sm:leading-snug">
                  {product.title}
                </h4>
              </div>

              <div>
                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center gap-1 h-6">
                  <span className="text-xs sm:text-sm font-bold text-foreground">
                    {formatBDT(hasDiscount ? discountedPrice : product.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-[10px] text-muted-foreground line-through">
                      {formatBDT(product.price)}
                    </span>
                  )}
                </div>

                {/* Mobile Layout (Fixed slot height for mobile price/stock) */}
                <div className="flex sm:hidden items-center justify-between gap-1 h-7">
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-bold text-foreground leading-tight">
                      {formatBDT(hasDiscount ? discountedPrice : product.price)}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] text-muted-foreground line-through leading-tight">
                        {formatBDT(product.price)}
                      </span>
                    )}
                  </div>
                  {product.stock > 0 && (
                    <span className={`text-[10px] shrink-0 whitespace-nowrap ${product.stock <= 5 ? "font-medium text-destructive" : "text-muted-foreground"}`}>
                      {product.stock <= 5 ? `${product.stock} left` : `${product.stock} in stock`}
                    </span>
                  )}
                </div>
              </div>

              {!isAdmin && (
                <div className="mt-auto pt-1 flex items-center gap-1.5 z-10 relative">
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleAddToCartClick}
                    className={`flex size-7.5 sm:size-8 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-150 active:scale-95 disabled:opacity-50 ${
                      justAdded
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-primary text-primary hover:bg-primary/10"
                    }`}
                    title="Add to Cart"
                  >
                    {justAdded ? <Check className="size-3.5 sm:size-4" /> : <ShoppingCart className="size-3.5 sm:size-4" />}
                  </button>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowModal(true);
                    }}
                    className="flex-1 rounded-lg bg-primary py-1.5 text-[11px] sm:text-xs font-bold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-95 disabled:opacity-50 text-center whitespace-nowrap px-1"
                  >
                    {isOutOfStock ? "Unavailable" : "অর্ডার করুন"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Link>
      </motion.div>

      {!isAdmin && (
        <OrderModal
          product={product}
          open={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
