"use client";

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useState, useMemo, useEffect } from "react";
import RelatedProducts from "@/components/sections/RelatedProducts";

import { useQuery } from "@tanstack/react-query";
import {
  Minus,
  Plus,
  Truck,
  Shield,
  RotateCcw,
  ChevronRight,
  Home,
  ShoppingCart,
  ChevronDown,
  Play,
  Video,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { getProductById } from "@/services/product.api";
import { useAddToCart } from "@/hooks/useAddToCart";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBDT } from "@/utils/currency";
import { Helmet } from "react-helmet-async";
import useSettings from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";



function ProductSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <Skeleton className="aspect-square w-full rounded-xl lg:w-1/2" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

import usePageTitle from "@/hooks/usePageTitle";
import { trackMetaPixelEvent } from "@/utils/metaPixel";

const getEmbedVideoUrl = (url) => {
  if (!url) return null;
  const trimmed = url.trim();

  // Google Drive
  const driveMatch = trimmed.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|drive\.google\.com\/uc\?id=)([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return { type: "iframe", src: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
  }

  // YouTube
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch && ytMatch[1]) {
    return { type: "iframe", src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` };
  }

  // Direct video (mp4, webm, etc.)
  if (trimmed.match(/\.(mp4|webm|ogg)$/i) || trimmed.startsWith("data:video/")) {
    return { type: "video", src: trimmed };
  }

  // Fallback iframe
  return { type: "iframe", src: trimmed };
};

const YouTubeIcon = ({ className = "size-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function ProductDetails({ id: propId, initialData }) {
  const { siteName } = useSettings();
  const routeParams = useParams();
  const id = propId || routeParams?.id;
  const router = useRouter();
  const { addToCart } = useAddToCart();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [activeDisplayImage, setActiveDisplayImage] = useState(null);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50, show: false });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y, show: true });
  };

  const handleMouseLeave = () => {
    setZoomPos((prev) => ({ ...prev, show: false }));
  };

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
    initialData: initialData || undefined,
    staleTime: 5 * 1000,
    enabled: !!id,
  });

  usePageTitle(product?.title || "Product Details");

  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, [id]);

  useEffect(() => {
    if (product) {
      if (product.colors?.length > 0) {
        setSelectedColor(product.colors[0]);
        if (product.colors[0].image) {
          setActiveDisplayImage(product.colors[0].image);
        }
      } else {
        setSelectedColor(null);
        setActiveDisplayImage(null);
      }
    }
  }, [product?._id]);

  useEffect(() => {
    if (id && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (product && product._id) {
      const currentPrice = product.discountPercentage > 0
        ? Number((product.price * (1 - product.discountPercentage / 100)).toFixed(2))
        : Number(product.price || 0);

      trackMetaPixelEvent("ViewContent", {
        content_name: product.title,
        content_ids: [String(product._id)],
        content_type: "product",
        value: currentPrice,
        currency: "BDT",
      });
    }
  }, [id, product]);

  const allImages = useMemo(() => {
    if (!product) return [];
    const imgs = [];
    if (product.thumbnail) imgs.push(product.thumbnail);
    if (product.images?.length) {
      product.images.forEach((img) => {
        if (img !== product.thumbnail) imgs.push(img);
      });
    }
    return imgs.length > 0 ? imgs : [product.thumbnail];
  }, [product]);

  const hasDiscount = product?.discountPercentage > 0;
  const discountedPrice = hasDiscount
    ? (product.price * (1 - product.discountPercentage / 100)).toFixed(2)
    : null;

  const handleAddToCart = async () => {
    if (product?.sizes?.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (product?.colors?.length > 0 && !selectedColor) {
      toast.error("Please select a color");
      return;
    }
    await addToCart(
      product,
      quantity,
      selectedSize || "",
      selectedColor?.name || "",
      selectedColor?.image || ""
    );
  };

  if (isLoading) return <ProductSkeleton />;

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Button className="mt-4" onClick={() => router.push(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const embedVideo = useMemo(() => getEmbedVideoUrl(product?.videoUrl), [product?.videoUrl]);
  const mainDisplayImage = activeDisplayImage || allImages[selectedImage] || product.thumbnail;

  return (
    <>
      <Helmet>
        <title>{`${product.title} | ${siteName}`}</title>
      </Helmet>

      {/* Breadcrumb */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            <Home className="size-4" />
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/products" className="hover:text-foreground">
            Shop
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{product.title}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 lg:py-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left - Images & Media lg:w-[35%] */}
          <div className="flex flex-col gap-3 lg:w-[35%]">
            {isVideoActive && embedVideo ? (
              <div className="relative aspect-square max-h-[380px] sm:max-h-[440px] lg:max-h-[460px] w-full overflow-hidden rounded-xl border border-border bg-black">
                {embedVideo.type === "iframe" ? (
                  <iframe
                    src={embedVideo.src}
                    title={`${product.title} Video`}
                    className="h-full w-full border-0 rounded-xl"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={embedVideo.src}
                    controls
                    autoPlay
                    className="h-full w-full object-contain rounded-xl"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setIsVideoActive(false)}
                  className="absolute right-3 top-3 z-20 rounded-full bg-black/70 p-1.5 text-white hover:bg-black transition-colors"
                  title="Switch to Photo View"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div
                className="relative overflow-hidden rounded-xl border border-border bg-muted/30 flex items-center justify-center cursor-zoom-in select-none"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={mainDisplayImage}
                  alt={product.title}
                  className="aspect-square max-h-[380px] sm:max-h-[440px] lg:max-h-[460px] w-full object-contain p-2 transition-transform duration-150 ease-out"
                  style={{
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transform: zoomPos.show ? "scale(2.4)" : "scale(1)",
                  }}
                  loading="eager"
                  fetchPriority="high"
                />
                {hasDiscount && (
                  <div className="absolute left-3 top-3 z-10 pointer-events-none">
                    <Badge className="bg-secondary text-secondary-foreground text-xs font-semibold shadow-sm">
                      -{Math.round(product.discountPercentage)}%
                    </Badge>
                  </div>
                )}
                {embedVideo && (
                  <button
                    type="button"
                    onClick={() => setIsVideoActive(true)}
                    className="absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-600/30 ring-2 ring-red-500/50 transition-all hover:scale-105 hover:bg-red-700 active:scale-95"
                  >
                    <YouTubeIcon className="size-4 text-white" />
                    <span>Watch Now</span>
                  </button>
                )}
              </div>
            )}

            {(allImages.length > 1 || embedVideo) && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {embedVideo && (
                  <button
                    type="button"
                    onClick={() => setIsVideoActive(true)}
                    className={`relative size-16 shrink-0 overflow-hidden rounded-xl border transition-all sm:size-20 shadow-xs group bg-black ${
                      isVideoActive
                        ? "border-red-600 ring-2 ring-red-600/80 scale-[1.03]"
                        : "border-border hover:border-red-500/50 hover:scale-[1.02]"
                    }`}
                  >
                    <img
                      src={product.thumbnail}
                      alt="Product Video"
                      className="h-full w-full object-cover opacity-60 transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-1 backdrop-blur-[0.5px]">
                      <div className="flex items-center justify-center rounded-xl bg-red-600 px-2.5 py-1.5 text-white shadow-lg transition-transform duration-200 group-hover:scale-110">
                        <YouTubeIcon className="size-5 sm:size-6" />
                      </div>
                    </div>
                  </button>
                )}

                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setIsVideoActive(false);
                      setSelectedImage(i);
                      setActiveDisplayImage(img);
                    }}
                    className={`size-16 shrink-0 overflow-hidden rounded-lg border transition-colors bg-muted/20 sm:size-20 ${
                      !isVideoActive && img === mainDisplayImage
                        ? "border-foreground ring-1 ring-foreground"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} ${i + 1}`}
                      className="h-full w-full object-contain p-1"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Middle - Product Info lg:w-[35%] */}
          <div className="flex flex-1 flex-col gap-4 lg:w-[35%]">
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
              {product.title}
            </h1>

            {product.sku && (
              <p className="text-sm font-medium text-muted-foreground">
                SKU : {product.sku}
              </p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-foreground">
                {formatBDT(hasDiscount ? discountedPrice : product.price)}
              </span>
              {hasDiscount && (
                <span className="text-base text-muted-foreground line-through">
                  {formatBDT(product.price)}
                </span>
              )}
            </div>

            {/* Color Family Selection */}
            {product?.colors?.length > 0 && (
              <div className="space-y-2 border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">
                    Color Family : <span className="font-normal text-muted-foreground">{selectedColor?.name || "Select a color"}</span>
                  </span>
                  <ChevronDown className="size-4 text-foreground" />
                </div>
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
                        className={`group relative flex items-center gap-2 rounded-lg border-2 p-1.5 transition-all ${isSelected
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "border-border hover:border-primary/50 bg-background"
                          }`}
                      >
                        <div className="size-10 overflow-hidden rounded border border-border bg-muted shrink-0">
                          <img
                            src={colorObj.image || product.thumbnail}
                            alt={colorObj.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <span className="pr-2 text-xs font-semibold text-foreground">
                          {colorObj.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product?.sizes?.length > 0 && (
              <div className="space-y-2 border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">
                    Select Size :
                  </span>
                  <button className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                    Size Chart
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-10 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${selectedSize === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/50"
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Order */}
            <div className="space-y-2">
              <span className="text-sm font-bold text-foreground">
                Select Quantity :
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded border border-border">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex size-10 items-center justify-center text-foreground transition-colors hover:bg-muted"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="flex size-10 items-center justify-center border-x border-border text-sm font-medium text-foreground">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex size-10 items-center justify-center text-foreground transition-colors hover:bg-muted"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>

                {(!mounted || !isAdmin) && (
                  <Button
                    size="lg"
                    className="flex-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-base font-bold"
                    disabled={product.stock === 0}
                    onClick={handleAddToCart}
                  >
                    অর্ডার করুন
                  </Button>
                )}
              </div>
            </div>

            {/* Find in Store */}
            <div className="pt-2">
              <button
                className="w-full flex items-center justify-center gap-2 rounded bg-muted/30 border border-border py-2 text-sm font-medium hover:bg-muted/50"
                onClick={() => toast("Find in Store feature coming soon!")}
              >
                Find in Store <ShoppingCart className="size-4" />
              </button>
            </div>

            {/* Social Share */}
            <div className="flex items-center gap-2 pt-2 justify-center">
              <a
                href={currentUrl ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}` : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
              >
                <svg className="size-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
              </a>
              <a
                href={currentUrl ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(product.title)}&url=${encodeURIComponent(currentUrl)}` : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
              >
                <svg className="size-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a
                href={`https://instagram.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
              >
                <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
            </div>
          </div>

          {/* Right - Extra Info lg:w-[30%] */}
          <div className="flex flex-col gap-4 lg:w-[30%]">
            {/* Policies */}
            <div className="rounded border-2 border-dashed border-foreground p-4 text-xs font-medium text-foreground">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 size-3 shrink-0 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  <span>পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 size-3 shrink-0 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  <span>৭ দিনের রিটার্ন পলিসি</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 size-3 shrink-0 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  <span>দ্রুত সময়ের মধ্যে সারা বাংলাদেশে "হোম ডেলিভারি"</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 size-3 shrink-0 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  <span>24/7 কাস্টমার সাপোর্ট: <a href="/orders" className="text-foreground hover:underline">Order Tracking</a></span>
                </li>
              </ul>
            </div>

            {/* Dynamic Size Measurement Block */}
            {product?.sizeMeasurements && product.sizeMeasurements.length > 0 ? (() => {
              const columnKeysSet = new Set();
              product.sizeMeasurements.forEach((m) => {
                Object.keys(m || {}).forEach((k) => {
                  if (k !== "size" && k !== "_id" && m[k]) columnKeysSet.add(k);
                });
              });
              const columnKeys = Array.from(columnKeysSet);

              const FIELD_LABELS = {
                chest: "Chest (বুক)",
                long: "Length (দৈর্ঘ্য)",
                body: "Body (বুক)",
                shoulder: "Shoulder (কাধ)",
                sleeve: "Sleeve (হাতা)",
                waist: "Waist (কোমর)",
                hip: "Hip (হিপ)",
                thigh: "Thigh (রান)",
                ageGroup: "Age (বয়স)",
                footLength: "Foot Length",
                euSize: "EU/UK Size",
              };

              return (
                <div className="mt-2 overflow-hidden rounded border border-border">
                  <div className="bg-muted py-2 text-center text-sm font-bold text-foreground">
                    Size Measurement (Inches)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                          <th className="px-3 py-2 font-semibold text-center">Size</th>
                          {columnKeys.map((key) => (
                            <th key={key} className="px-3 py-2 font-semibold text-center">
                              {FIELD_LABELS[key] || key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {product.sizeMeasurements.map((m, i) => (
                          <tr key={i} className="hover:bg-muted/20">
                            <td className="px-3 py-2 font-bold text-foreground text-center">{m.size}</td>
                            {columnKeys.map((key) => (
                              <td key={key} className="px-3 py-2 text-foreground text-center">
                                {m[key] || "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })() : product?.sizeChart ? (
              <div className="mt-2 overflow-hidden rounded border border-border">
                <div className="bg-muted py-2 text-center text-sm font-bold text-foreground">
                  Size Measurement
                </div>
                <div className="p-2">
                  <img
                    src={product.sizeChart}
                    alt="Size Measurement"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-border p-4">
            <Truck className="size-6 text-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Fast Shipping
              </p>
              <p className="text-xs text-muted-foreground">
                {product.shippingInformation || "Receive products in amazing time"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border p-4">
            <Shield className="size-6 text-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Always Authentic Product
              </p>
              <p className="text-xs text-muted-foreground">
                100% authentic products
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border p-4">
            <RotateCcw className="size-6 text-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                7 Day Returns
              </p>
              <p className="text-xs text-muted-foreground">
                {product.returnPolicy || "Return within 7 days"}
              </p>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="mt-10 border-t border-border pt-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Description</h3>
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <p className="whitespace-pre-line">{product.description}</p>
          </div>
        </div>

        {/* Related Products Section */}
        <RelatedProducts currentProduct={product} />
      </div>
    </>
  );
}
