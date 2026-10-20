"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ProductIcon } from "@/components/ProductIcon";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Coins,
  ArrowRight,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, clearCart, totalCoins, totalItems } = useCart();
  const { user } = useAuth();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-[#0f131f] border border-[#1e2538] flex items-center justify-center text-zinc-500 mb-6 shadow-xl">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Your Cart is Empty</h1>
        <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-8">
          Looks like you haven&apos;t added any digital products or redeem codes to your cart yet.
        </p>
        <Link
          href="/shop"
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
        >
          Explore Digital Products
        </Link>
      </div>
    );
  }

  const hasEnoughCoins = user ? user.coinBalance >= totalCoins : true;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="flex items-center justify-between pb-6 border-b border-[#181d2a] mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Your Shopping Cart</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Review your selected digital items before confirming redemption.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Cart Items */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-[#0d101a] border border-[#1b2132] flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <ProductIcon type={item.image || item.name} className="w-14 h-14 shrink-0" />
                <div>
                  <Link
                    href={`/shop/product/${item.slug}`}
                    className="text-base font-bold text-white hover:text-amber-400 transition-colors line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-zinc-400 mt-0.5">{item.categoryName || "Digital Key"}</p>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mt-1">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{item.coinPrice.toLocaleString()} coins each</span>
                  </div>
                </div>
              </div>

              {/* Quantity Controls & Subtotal */}
              <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                <div className="flex items-center rounded-xl bg-[#131724] border border-[#21283d] p-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#1a2032] transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#1a2032] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[90px]">
                  <p className="text-[11px] text-zinc-400">Subtotal</p>
                  <div className="flex items-center justify-end gap-1 text-sm font-bold text-amber-400">
                    <Coins className="w-4 h-4" />
                    <span>{(item.coinPrice * item.quantity).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-4">
          <div className="p-6 rounded-2xl bg-[#0f131f] border border-[#1e2538] sticky top-24 space-y-6">
            <h3 className="text-base font-bold text-white pb-3 border-b border-[#1b2132]">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Total Items:</span>
                <span className="text-white font-medium">{totalItems}</span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>Delivery:</span>
                <span className="text-emerald-400 font-semibold">Instant Digital Fulfillment</span>
              </div>

              <div className="border-t border-[#181d2a] pt-3 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-white">Total Coins:</span>
                <div className="flex items-center gap-1.5 text-2xl font-black text-amber-400">
                  <Coins className="w-6 h-6" />
                  <span>{totalCoins.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-right text-[11px] text-zinc-400">
                Equivalent Value: ≈ ₹{(totalCoins / 10).toFixed(0)}
              </div>
            </div>

            {/* User Coin Balance Check */}
            {user && (
              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  hasEnoughCoins
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                <div className="flex justify-between font-bold mb-1">
                  <span>Your Balance:</span>
                  <span>{user.coinBalance.toLocaleString()} Coins</span>
                </div>
                {hasEnoughCoins ? (
                  <p className="text-[11px] text-emerald-400/80">
                    ✓ You have sufficient coins to redeem this order.
                  </p>
                ) : (
                  <div className="mt-1">
                    <p className="text-[11px] text-red-400">
                      Short by {(totalCoins - user.coinBalance).toLocaleString()} coins.
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Link
                        href="/earn"
                        className="text-[11px] font-bold text-amber-400 underline"
                      >
                        Earn Free Coins
                      </Link>
                      <span>•</span>
                      <Link
                        href="/purchase"
                        className="text-[11px] font-bold text-emerald-400 underline"
                      >
                        Buy Coins
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => router.push("/checkout")}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full coin refund guaranteed if declined</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
