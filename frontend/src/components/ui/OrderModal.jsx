"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { X, Minus, Plus, ShoppingCart } from "lucide-react";

import toast from "react-hot-toast";
import { useAddToCart } from "@/hooks/useAddToCart";
import { formatBDT } from "@/utils/currency";

export default function OrderModal({ product, open, onClose }) {
  const router = useRouter();
  const { addToCart } = useAddToCart();
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [activeDisplayImage, setActiveDisplayImage] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (open && product) {
      setSelectedSize(null);
      setSelectedColor(null);
      setActiveDisplayImage(null);
      setQuantity(1);
    }
  }, [open, product]);

  if (!open || !product) return null;

  const hasDiscount = product.discountPercentage > 0;
  const discountedPrice = hasDiscount
    ? (product.price * (1 - product.discountPercentage / 100)).toFixed(2)
    : null;
  const isOutOfStock = product.stock === 0;

  const validateOptions = () => {
    if (product.colors?.length > 0 && !selectedColor) {
      toast.error("Please select a color");
      return false;
    }
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return false;
    }
    return true;
  };

  const handleAddToCartOnly = async () => {
    if (!validateOptions()) return;
    await addToCart(
      product,
      quantity,
      selectedSize || "",
      selectedColor?.name || "",
      selectedColor?.image || ""
    );
    onClose();
  };

  const handleOrderNow = async () => {
    if (!validateOptions()) return;
    await addToCart(
      product,
      quantity,
      selectedSize || "",
      selectedColor?.name || "",
      selectedColor?.image || ""
    );
    onClose();
    router.push("/cart");
  };

  const previewImage = activeDisplayImage || product.thumbnail || product.images?.[0] || null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-2 sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] sm:max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 sm:px-6 py-3">
          <h3 className="text-base font-semibold text-foreground sm:text-lg">Choose Options</h3>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 sm:flex-row min-h-0">
          <div className="shrink-0 flex justify-center sm:block">
            <div className="size-32 overflow-hidden rounded-xl border border-border bg-muted sm:size-48">
              <img
                src={previewImage}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 sm:gap-4">
            <div>
              <h4 className="text-base font-semibold text-foreground sm:text-lg">
                {product.title}
              </h4>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">
                  {formatBDT(hasDiscount ? discountedPrice : product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatBDT(product.price)}
                  </span>
                )}
              </div>
            </div>

            {product.colors?.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs sm:text-sm font-medium text-foreground">
                  Choose Color : <span className="font-normal text-muted-foreground">{selectedColor?.name || "None"}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((colorObj, index) => {
                    const isSelected = selectedColor?.name === colorObj.name;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setSelectedColor(colorObj);
                          if (colorObj.image) {
                            setActiveDisplayImage(colorObj.image);
                          }
                        }}
                        className={`flex items-center gap-1.5 rounded-lg border-2 p-1 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "border-border hover:border-primary/50 bg-background"
                        }`}
                      >
                        <div className="size-7 overflow-hidden rounded border border-border bg-muted shrink-0">
                          <img
                            src={colorObj.image || product.thumbnail}
                            alt={colorObj.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="pr-1 text-xs font-semibold text-foreground">
                          {colorObj.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.sizes?.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs sm:text-sm font-medium text-foreground">Choose Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:border-primary/50"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-1.5 text-xs sm:text-sm font-medium text-foreground">Choose Quantity</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex size-9 sm:size-10 items-center justify-center rounded-lg border border-border text-foreground transition-all duration-150 active:scale-90 hover:bg-muted"
                >
                  <Minus className="size-4" />
                </button>
                <span className="flex size-9 sm:size-10 items-center justify-center rounded-lg border border-border text-xs sm:text-sm font-medium select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex size-9 sm:size-10 items-center justify-center rounded-lg border border-border text-foreground transition-all duration-150 active:scale-90 hover:bg-muted"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 sm:gap-3 border-t border-border bg-background px-4 sm:px-6 py-3">
          <button
            type="button"
            onClick={handleAddToCartOnly}
            disabled={isOutOfStock}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border-2 border-primary px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-primary transition-all duration-150 hover:bg-primary/10 active:scale-95 disabled:opacity-50"
          >
            <ShoppingCart className="size-3.5 sm:size-4" />
            Add to cart
          </button>
          <button
            type="button"
            onClick={handleOrderNow}
            disabled={isOutOfStock}
            className="flex-1 flex items-center justify-center rounded-lg bg-primary px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-95 disabled:opacity-50 shadow-xs whitespace-nowrap"
          >
            {isOutOfStock ? "Unavailable" : "অর্ডার করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
