"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ShoppingCart, Zap, Plus, Minus, Check, AlertCircle } from "lucide-react";

export function ProductActions({ product, inStock }: { product: any; inStock: boolean }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleBuyNow = () => {
    if (!inStock) return;
    addToCart(product, quantity);
    router.push("/checkout");
  };

  if (!inStock) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <div>
          <p className="font-semibold">This product is currently out of stock.</p>
          <p className="text-xs text-red-400/80">Check back soon or explore other digital items in the shop.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold text-zinc-400">Quantity:</span>
        <div className="flex items-center rounded-xl bg-[#121622] border border-[#20273a] p-1">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#1a2030] transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-10 text-center font-bold text-sm text-white">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#1a2030] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-xs text-zinc-500">
          (Subtotal: {(product.coinPrice * quantity).toLocaleString()} coins)
        </span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={handleAddToCart}
          className="py-3.5 px-6 rounded-xl bg-[#141824] hover:bg-[#1c2234] text-white border border-[#232b40] font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
        >
          {added ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Added to Cart!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span>Add to Cart</span>
            </>
          )}
        </button>

        <button
          onClick={handleBuyNow}
          className="py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
        >
          <Zap className="w-4 h-4 fill-black" />
          <span>Buy Now With Coins</span>
        </button>
      </div>
    </div>
  );
}
