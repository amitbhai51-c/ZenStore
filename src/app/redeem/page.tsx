"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Ticket,
  Coins,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Gift,
  Sparkles,
  ShoppingBag,
  Lock,
} from "lucide-react";

export default function RedeemPage() {
  const { user, refreshUser, isLoading } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ message: string; coins: number; newBalance: number } | null>(null);
  const [error, setError] = useState("");

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setError("");
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to redeem code");
      } else {
        setSuccess({
          message: data.message,
          coins: data.coinsAwarded,
          newBalance: data.newBalance,
        });
        setCode("");
        await refreshUser();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-400 items-center justify-center mb-4 shadow-xl">
            <Gift className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Redeem Promo Code
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
            Have a custom coin voucher, event promo code, or gift code issued by our administrators? Enter it below to claim your coins instantly.
          </p>
        </div>

        {/* User Balance Banner if logged in */}
        {user ? (
          <div className="mb-6 p-4 rounded-2xl bg-[#0d101a] border border-[#1b2132] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs uppercase">
                {user.username.slice(0, 2)}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{user.username}</p>
                <p className="text-[11px] text-zinc-400">{user.email}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase font-semibold">Your Wallet</p>
              <div className="flex items-center gap-1.5 text-base font-black text-amber-400">
                <Coins className="w-4 h-4" />
                <span>{user.coinBalance.toLocaleString()} Coins</span>
              </div>
            </div>
          </div>
        ) : !isLoading && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>You must be logged in to claim promo codes.</span>
            </div>
            <Link
              href="/auth/login"
              className="px-3 py-1 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              Log In
            </Link>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#0e1724] to-emerald-500/10 border border-emerald-500/40 text-center animate-slide-up shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Coins Claimed Successfully!</h3>
            <p className="text-sm text-emerald-300 font-semibold mb-3">
              +{success.coins.toLocaleString()} Coins added to your wallet
            </p>
            <p className="text-xs text-zinc-400 mb-5">
              New Wallet Balance: <strong className="text-amber-400">{success.newBalance.toLocaleString()} Coins</strong>
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/shop"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Browse Shop
              </Link>
              <Link
                href="/account"
                className="px-5 py-2.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-zinc-200 border border-[#22293d] font-semibold text-xs"
              >
                View Account
              </Link>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="p-8 rounded-3xl bg-[#0f131f] border border-[#1e2538] shadow-2xl">
          <form onSubmit={handleRedeem} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                Enter Redeem Code
              </label>
              <div className="relative">
                <Ticket className="w-5 h-5 text-amber-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  disabled={!user || loading}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME100, BONUS500"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#141826] border border-[#232b40] text-base font-mono font-bold tracking-wider text-amber-400 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all uppercase disabled:opacity-50"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                Codes are case-insensitive and can be redeemed once per user account.
              </p>
            </div>

            <button
              type="submit"
              disabled={!user || loading || !code.trim()}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                "Verifying & Crediting..."
              ) : (
                <>
                  <span>Claim Coins</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Guarantee Footer */}
          <div className="mt-8 pt-6 border-t border-[#181d2a] grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant wallet credit upon verification</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Use coins immediately on digital products</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
