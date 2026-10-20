"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ProductIcon } from "@/components/ProductIcon";
import {
  Coins,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  CreditCard,
  Mail,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalCoins, clearCart } = useCart();
  const { user, refreshUser, isLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<{
    orderNumber: string;
    totalCoins: number;
    newBalance: number;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-amber-400">
        Loading checkout details...
      </div>
    );
  }

  // Auth requirement check
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
        <p className="text-xs text-zinc-400 mb-6">
          Please log in or create an account to proceed with your digital order checkout.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/auth/login"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="px-5 py-2.5 rounded-xl bg-[#141824] hover:bg-[#1b2132] text-zinc-200 border border-[#232a3f] font-semibold text-sm"
          >
            Register
          </Link>
        </div>
      </div>
    );
  }

  // Email verification check
  if (!user.isVerified) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
          <Mail className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Email Verification Required</h2>
        <p className="text-xs text-zinc-400 mb-6">
          Your account must be email-verified before you can redeem products. Please check your inbox for the OTP code.
        </p>
        <Link
          href={`/auth/verify-otp?email=${encodeURIComponent(user.email)}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm"
        >
          <span>Verify Email Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Suspension check
  if (user.isSuspended) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Account Suspended</h2>
        <p className="text-xs text-red-300 mb-6">
          Your account is currently suspended ({user.suspensionReason || "Violation of terms"}). You cannot perform redemptions.
        </p>
        <Link
          href="/contact"
          className="px-6 py-2.5 rounded-xl bg-[#141824] text-zinc-300 border border-[#232b40] text-xs font-semibold"
        >
          Contact Support Desk
        </Link>
      </div>
    );
  }

  // Order Success View
  if (orderSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-xl">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-black text-white mb-2">Order Confirmed!</h1>
        <p className="text-sm text-zinc-300 max-w-md mx-auto mb-6">
          Your redemption order has been placed. An administrator will deliver your verified digital codes directly to your private account vault.
        </p>

        <div className="p-6 rounded-2xl bg-[#0f131f] border border-[#1e2538] text-left space-y-3 mb-8">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Order Reference:</span>
            <span className="text-amber-400 font-mono font-bold">{orderSuccess.orderNumber}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Total Coins Paid:</span>
            <span className="text-white font-bold">{orderSuccess.totalCoins.toLocaleString()} Coins</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Updated Wallet Balance:</span>
            <span className="text-emerald-400 font-bold">{orderSuccess.newBalance.toLocaleString()} Coins</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Delivery Status:</span>
            <span className="text-sky-400 font-semibold">Processing & Delivery Pending</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/account"
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20"
          >
            View Order in My Account
          </Link>
          <Link
            href="/shop"
            className="px-6 py-3 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-zinc-200 border border-[#212739] font-medium text-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">No Items in Cart</h2>
        <p className="text-xs text-zinc-400 mb-6">Please add items from the shop catalog first.</p>
        <Link
          href="/shop"
          className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs"
        >
          Browse Shop
        </Link>
      </div>
    );
  }

  const hasEnoughCoins = user.coinBalance >= totalCoins;

  const handleConfirmOrder = async () => {
    if (!hasEnoughCoins) {
      setError(`Insufficient coin balance. You need ${(totalCoins - user.coinBalance).toLocaleString()} more coins.`);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Checkout failed");
      } else {
        clearCart();
        await refreshUser();
        setOrderSuccess({
          orderNumber: data.orderNumber,
          totalCoins: data.totalCoins,
          newBalance: data.newBalance,
        });
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <h1 className="text-3xl font-extrabold text-white mb-2">Order Checkout</h1>
      <p className="text-xs text-zinc-400 mb-8">
        Review and confirm your digital product redemption.
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{error}</p>
            {!hasEnoughCoins && (
              <div className="mt-2 flex gap-3">
                <Link href="/earn" className="text-amber-400 font-bold underline">
                  Earn Free Coins
                </Link>
                <span>•</span>
                <Link href="/purchase" className="text-emerald-400 font-bold underline">
                  Purchase Coins
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Col: Cart items summary */}
        <div className="md:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-[#0d101a] border border-[#1b2132]">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-[#181d2a]">
              Items to Redeem ({cart.length})
            </h3>

            <div className="divide-y divide-[#171d2c]">
              {cart.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ProductIcon type={item.image || item.name} className="w-10 h-10 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white line-clamp-1">{item.name}</p>
                      <p className="text-[11px] text-zinc-400">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      {(item.coinPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b0e16] border border-[#181d2a] flex items-center gap-4 text-xs text-zinc-400">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <p>
              Your digital code or redeem voucher will be delivered directly into your private account dashboard and dispatches a delivery confirmation email upon admin fulfillment.
            </p>
          </div>
        </div>

        {/* Right Col: Wallet payment summary */}
        <div className="md:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0f131f] border border-[#1e2538] space-y-6">
            <h3 className="text-base font-bold text-white pb-3 border-b border-[#181d2a]">
              Wallet Payment Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Account:</span>
                <span className="text-white font-medium">{user.username} ({user.email})</span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>Current Coin Balance:</span>
                <span className="text-amber-400 font-bold">{user.coinBalance.toLocaleString()} Coins</span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>Total Coin Cost:</span>
                <span className="text-white font-bold">{totalCoins.toLocaleString()} Coins</span>
              </div>

              <div className="border-t border-[#181d2a] pt-3 flex justify-between items-baseline">
                <span className="text-xs text-zinc-400">Balance After Order:</span>
                <span
                  className={`text-base font-black ${
                    hasEnoughCoins ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {(user.coinBalance - totalCoins).toLocaleString()} Coins
                </span>
              </div>
            </div>

            <button
              onClick={handleConfirmOrder}
              disabled={loading || !hasEnoughCoins}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                "Processing Order..."
              ) : (
                <>
                  <span>Confirm Order & Pay {totalCoins.toLocaleString()} Coins</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {!hasEnoughCoins && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <p className="text-[11px] text-red-300">
                  You need {(totalCoins - user.coinBalance).toLocaleString()} more coins.
                </p>
                <div className="mt-2 flex justify-center gap-4 text-xs font-bold">
                  <Link href="/earn" className="text-amber-400 hover:underline">
                    Earn Free Coins
                  </Link>
                  <Link href="/purchase" className="text-emerald-400 hover:underline">
                    Buy Coins (₹1 = 10)
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
