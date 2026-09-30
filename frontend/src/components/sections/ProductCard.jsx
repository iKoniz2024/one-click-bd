"use client";

import Link from 'next/link';
import { useState, useEffect } from "react";

import { motion } from "framer-motion";
import { Trophy, Flame, Star, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatBDT } from "@/utils/currency";
import { useQueryClient } from "@tanstack/react-query";
import { getProductById } from "@/services/product.api";
import OrderModal from "@/components/ui/OrderModal";
import { useAuth } from "@/hooks/useAuth";
import { useAddToCart } from "@/hooks/useAddToCart";

function StockBar({ stock, maxStock }) {
  if (stock === 0) return null;
  const ref = maxStock || 100;
  const percentage = Math.min((stock / ref) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={`text-[11px] ${stock <= 5 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
          {stock <= 5 ? `${stock} left` : `${stock} in stock`}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500 bg-secondary"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

const badgeConfig = {
  "best-seller": {
    label: "Best Seller",
    icon: Trophy,
    className: "bg-primary text-primary-foreground",
    ring: "ring-2 ring-primary/30",
  },
  "top-rated": {
    label: "Top Rated",
    icon: Star,
    className: "bg-primary text-primary-foreground",
    ring: "ring-2 ring-primary/30",
  },
  popular: {
    label: "Popular",
    icon: Flame,
    className: "bg-secondary text-secondary-foreground",
    ring: "ring-2 ring-secondary/30",
  },
};

export default function ProductCard({ product, index, badge }) {
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
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

  const effectiveBadge = badge !== undefined ? badge : product.badge;

  const hasVariants = (product?.sizes?.length > 0) || (product?.colors?.length > 0);

  const handleAddToCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVariants) {
      setShowModal(true);
    } else {
      addToCart(product);
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
            transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
          }),
        }}
      >
        <Link
          href={`/product/${product._id}`}
          className="group block h-full"
          onMouseEnter={handlePrefetch}
          onTouchStart={handlePrefetch}
        >
          <div className={`flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${badgeConfig[effectiveBadge]?.ring ?? ""}`}>
            {/* Section 1: Fixed Consistent Image Section */}
            <div className="relative aspect-square h-36 sm:h-44 w-full shrink-0 overflow-hidden bg-muted/30 flex items-center justify-center border-b border-border/40">
              <img
                src={product.thumbnail || product.images?.[0] || undefined}
                alt={product.title}
                className="h-full w-full object-contain p-2 transition-transform duration-300 ease-out group-hover:scale-110 sm:group-hover:scale-115"
                loading="lazy"
              />

              {hasDiscount && (
                <div className="absolute left-0 top-3 z-10 rounded-r bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground shadow-sm">
                  -{Math.round(product.discountPercentage)}%
                </div>
              )}

              {effectiveBadge && badgeConfig[effectiveBadge] && (
                <div className={`absolute top-3 z-20 ${hasDiscount ? "left-14" : "left-2.5"}`}>
                  <Badge className={`gap-1 text-[10px] font-semibold px-2 py-0.5 ${badgeConfig[effectiveBadge].className}`}>
                    {(() => { const Icon = badgeConfig[effectiveBadge].icon; return <Icon className="size-3" />; })()}
                    {badgeConfig[effectiveBadge].label}
                  </Badge>
                </div>
              )}

              {product.stock <= 5 && product.stock > 0 && (
                <div className="absolute right-2.5 top-2.5 z-10">
                  <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.5">
                    Only {product.stock} left
                  </Badge>
                </div>
              )}

              {isOutOfStock && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                  <Badge variant="destructive" className="text-xs font-semibold">
                    Out of Stock
                  </Badge>
                </div>
              )}
            </div>

            {/* Section 2: Compact Product Information Section */}
            <div className="flex flex-1 flex-col p-2 sm:p-3 gap-1">
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate h-4 leading-4">
                {product.brand || "\u00A0"}
              </p>

              <h3 className="line-clamp-2 text-xs font-semibold text-foreground sm:text-sm leading-tight h-8 sm:h-10 overflow-hidden">
                {product.title}
              </h3>

              {/* Desktop Layout (Original: Price line + StockBar line) */}
              <div className="hidden sm:block space-y-1 mt-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm sm:text-base font-bold text-foreground">
                    {formatBDT(hasDiscount ? discountedPrice : product.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-[11px] sm:text-xs text-muted-foreground line-through">
                      {formatBDT(product.price)}
                    </span>
                  )}
                </div>
                <StockBar stock={product.stock} maxStock={100} />
              </div>

              {/* Mobile Layout (Price Div on left stacked if discount, Stock Div on right) */}
              <div className="flex sm:hidden items-center justify-between gap-1 mt-0.5">
                <div className="flex flex-col">
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

              {!isAdmin && (
                <div className="mt-auto pt-1 flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleAddToCartClick}
                    className="flex size-8 sm:h-9 sm:w-auto shrink-0 items-center justify-center rounded-lg border-2 border-primary text-primary transition-colors hover:bg-primary/10 disabled:opacity-50 sm:px-2.5"
                    title="Add to Cart"
                  >
                    <ShoppingCart className="size-3.5 sm:hidden" />
                    <span className="hidden sm:inline text-xs font-bold whitespace-nowrap">
                      Add to Cart
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowModal(true);
                    }}
                    className="flex-1 rounded-lg bg-primary py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 shadow-sm text-center whitespace-nowrap px-1"
                  >
                    {isOutOfStock ? "Unavailable" : "অর্ডার করুন"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Link>
      </motion.div>

      {!isAdmin && showModal && (
        <OrderModal
          product={product}
          open={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
