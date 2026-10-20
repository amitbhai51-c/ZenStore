import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductIcon } from "@/components/ProductIcon";
import { ProductActions } from "@/components/ProductActions";
import {
  Coins,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowLeft,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
    },
  });

  if (!product || product.isArchived) {
    notFound();
  }

  const inStock = product.isAvailable && product.stockQuantity > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Breadcrumb / Back button */}
      <div className="mb-6">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop Catalog
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Left Col: Product Icon & Showcase */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="w-full aspect-square max-w-sm rounded-3xl bg-[#0f131f] border border-[#1e2538] flex flex-col items-center justify-center p-8 relative shadow-2xl">
            <ProductIcon type={product.image || product.name} className="w-36 h-36" />

            <div className="absolute top-4 right-4">
              {inStock ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  In Stock ({product.stockQuantity} units)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                  <XCircle className="w-3.5 h-3.5" />
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="w-full max-w-sm mt-6 p-4 rounded-2xl bg-[#0b0e17] border border-[#171c2b] space-y-3">
            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Genuine, Verified Digital Key</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <Truck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Fulfilled securely to your account vault</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              <span>100% coin refund if delivery cannot be made</span>
            </div>
          </div>
        </div>

        {/* Right Col: Details, Price, and Actions */}
        <div className="md:col-span-7 flex flex-col">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold self-start mb-3">
            <span>{product.category?.name || "Digital Code"}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {product.name}
          </h1>

          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            {product.shortDesc}
          </p>

          {/* Coin Price Box */}
          <div className="mt-6 p-6 rounded-2xl bg-[#0e121d] border border-[#1d2334] flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">Redemption Price</p>
              <div className="flex items-center gap-2 text-3xl font-black text-amber-400 mt-0.5">
                <Coins className="w-7 h-7" />
                <span>{product.coinPrice.toLocaleString()}</span>
                <span className="text-sm text-amber-400/80 font-normal">Coins</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-zinc-400">Equivalent INR value</p>
              <p className="text-base font-bold text-white">
                ≈ ₹{(product.coinPrice / 10).toFixed(0)}
              </p>
            </div>
          </div>

          {/* Interactive Client Add to Cart & Buy Now Buttons */}
          <div className="mt-6">
            <ProductActions product={product} inStock={inStock} />
          </div>

          {/* Full Description & Delivery Info Tabs/Section */}
          <div className="mt-8 pt-8 border-t border-[#181d2a] space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Product Overview
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                {product.fullDesc}
              </p>
            </div>

            {product.deliveryInstructions && (
              <div className="p-4 rounded-xl bg-[#121624] border border-amber-500/20">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  Redemption & Delivery Instructions
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                  {product.deliveryInstructions}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
