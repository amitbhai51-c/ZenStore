import React from "react";
import Link from "next/link";
import {
  Coins,
  Sparkles,
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Lock,
  Zap,
  HelpCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let settings = null;
  try {
    settings = await prisma.websiteSettings.findUnique({
      where: { id: "default" },
    });
  } catch {
    // fallback
  }

  const siteName = settings?.siteName || "CoinCraft";
  const exchangeRate = settings?.coinExchangeRateInr || 10;
  const linkReward = settings?.linkRewardCoins || 2;
  const linkDailyMax = settings?.linkDailyMaxCoins || 40;
  const afkRate = settings?.afkCoinsPerMinute || 1;
  const afkDailyMax = settings?.afkDailyMaxCoins || 20;

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 border-b border-[#171b26]">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Rewards & Coin Redemption Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Earn Virtual Coins. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Redeem Genuine Digital Products.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Accumulate coins for free through active link tasks and AFK idling, or top up your wallet instantly. Unlock verified Minecraft redeem codes, Google Play gift cards, Steam wallet codes, and digital subscriptions.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-base shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02]"
            >
              <ShoppingBag className="w-5 h-5" />
              Explore Digital Shop
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/earn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#141824] hover:bg-[#1b2132] text-zinc-200 hover:text-white border border-[#232a3f] font-semibold text-base transition-all"
            >
              <Sparkles className="w-5 h-5 text-amber-400" />
              Earn Free Coins
            </Link>

            <Link
              href="/purchase"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#10141f] hover:bg-[#161c2b] text-emerald-400 border border-emerald-500/30 font-semibold text-base transition-all"
            >
              <CreditCard className="w-5 h-5" />
              Buy Coins (₹1 = {exchangeRate} Coins)
            </Link>
          </div>

          {/* Quick stats banner */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-[#181d2a]">
            <div className="p-4 rounded-xl bg-[#0f131d]/60 border border-[#1b2130]">
              <p className="text-2xl font-black text-amber-400">100%</p>
              <p className="text-xs text-zinc-400 mt-1">Verified Digital Codes</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0f131d]/60 border border-[#1b2130]">
              <p className="text-2xl font-black text-amber-400">{afkDailyMax} Coins/Day</p>
              <p className="text-xs text-zinc-400 mt-1">AFK Idle Allowance</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0f131d]/60 border border-[#1b2130]">
              <p className="text-2xl font-black text-amber-400">{linkDailyMax} Coins/Day</p>
              <p className="text-xs text-zinc-400 mt-1">Daily Task Limit</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0f131d]/60 border border-[#1b2130]">
              <p className="text-2xl font-black text-emerald-400">₹1 = {exchangeRate}</p>
              <p className="text-xs text-zinc-400 mt-1">Transparent Exchange Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-[#0a0c12] border-b border-[#171b26]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
              Simple 3-Step Process
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              How the {siteName} Platform Works
            </p>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base">
              No complicated hoops or fake surveys. An authentic coin economy with legitimate digital product fulfillment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative p-8 rounded-2xl bg-[#0f131f] border border-[#1d2436] hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Earn or Purchase Coins</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Start our browser AFK timer to passively earn {afkRate} coin every minute, complete daily sponsor link tasks, or purchase coins securely starting at ₹1 via Razorpay and UPI.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-8 rounded-2xl bg-[#0f131f] border border-[#1d2436] hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Browse & Checkout</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Visit the Shop page to select your desired digital code. Add items to your cart or hit Buy Now. The server recalculates pricing, confirms wallet balances, and atomically records your order.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-8 rounded-2xl bg-[#0f131f] border border-[#1d2436] hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Verified Digital Delivery</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Our administrators review and fulfill genuine digital codes directly into your private account dashboard and dispatch a delivery email. Declined orders are refunded 100% of coins instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Free Earning Breakdown Section */}
      <section className="py-20 bg-[#08090d] border-b border-[#171b26]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
              Free Coin Opportunities
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              Two Ways to Earn Daily Coins
            </p>
            <p className="mt-3 text-zinc-400 text-sm">
              All daily limits reset every 24 hours at 00:00 server time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Method 1: Link Tasks */}
            <div className="p-8 rounded-2xl bg-[#0e121c] border border-[#1c2234] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Active Tasks
                  </span>
                  <span className="text-sm font-semibold text-zinc-400">
                    Max: <strong className="text-white">{linkDailyMax} coins/day</strong>
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Link Unlock Tasks</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  Visit partner articles, check daily patch notes, or view announcements. Complete the countdown and server challenge to credit {linkReward} coins per completed task.
                </p>

                <ul className="space-y-2.5 text-xs text-zinc-300 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Cryptographically validated server sessions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Earn {linkReward} coins immediately upon successful completion</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Enforced daily cap to guarantee fair distribution</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/earn"
                className="w-full py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold text-center text-sm transition-all"
              >
                Go to Link Tasks
              </Link>
            </div>

            {/* Method 2: AFK Mode */}
            <div className="p-8 rounded-2xl bg-[#0e121c] border border-[#1c2234] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Passive Idling
                  </span>
                  <span className="text-sm font-semibold text-zinc-400">
                    Max: <strong className="text-white">{afkDailyMax} coins/day</strong>
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">AFK Browser Mode</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  Keep your browser tab open in the background while studying, gaming, or working. The server calculates heartbeats and awards {afkRate} coin for every minute elapsed.
                </p>

                <ul className="space-y-2.5 text-xs text-zinc-300 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Live real-time timer with Pause and Stop controls</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Server-validated heartbeats block client tampering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Automated cutoff once daily allowance is attained</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/earn"
                className="w-full py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-center text-sm transition-all"
              >
                Start AFK Session
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Guarantees */}
      <section className="py-20 bg-[#0a0c12] border-b border-[#171b26]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4 p-6 rounded-xl bg-[#0f121a] border border-[#1b202e]">
              <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">Atomic Wallet Integrity</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Every coin debit, credit, or refund is protected by atomic database transactions with zero risk of negative balances or race conditions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-[#0f121a] border border-[#1b202e]">
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">Guaranteed Refunds</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  If an order cannot be delivered or is declined by an administrator, 100% of the redeemed coins are immediately refunded to your account.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-[#0f121a] border border-[#1b202e]">
              <div className="p-3 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">Private Digital Vault</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Delivered game keys, gift card codes, and redemption instructions are stored securely in your private account dashboard and sent via email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 bg-[#08090d]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
              Common Questions
            </h2>
            <p className="text-3xl font-extrabold text-white">Frequently Asked Questions</p>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-[#0e121b] border border-[#1c2232]">
              <h3 className="text-base font-semibold text-white mb-2">
                Do I have to spend real money to redeem products?
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                No! You can earn coins 100% free using our Link Unlock tasks and AFK idling mode. If you prefer to fast-track your redemption, you can also purchase coins at the fixed rate of ₹1 = {exchangeRate} coins.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0e121b] border border-[#1c2232]">
              <h3 className="text-base font-semibold text-white mb-2">
                How do I receive my digital product code?
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Once you place an order in the Shop, an administrator verifies and delivers your legitimate redemption key. The key becomes visible under &ldquo;My Account &amp; Orders&rdquo; and a confirmation is sent to your verified email.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0e121b] border border-[#1c2232]">
              <h3 className="text-base font-semibold text-white mb-2">
                Why do I need to verify my email address?
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Email verification ensures account authenticity, protects against automated bot abuse, and guarantees that digital codes and security notices reach you safely.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0e121b] border border-[#1c2232]">
              <h3 className="text-base font-semibold text-white mb-2">
                What payment methods are supported for coin purchases?
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                We support instant online payments via Razorpay (Cards, NetBanking, UPI) as well as direct UPI QR payments with 12-digit UTR reference verification.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center p-8 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#121622] to-yellow-500/10 border border-amber-500/30">
            <h3 className="text-2xl font-bold text-white mb-2">Ready to Start Earning?</h3>
            <p className="text-sm text-zinc-400 mb-6 max-w-xl mx-auto">
              Create your account in less than 60 seconds, verify your email, and start earning coins immediately.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-105"
              >
                Create Free Account
              </Link>
              <Link
                href="/shop"
                className="px-6 py-3 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-zinc-200 border border-[#212739] font-medium text-sm transition-all"
              >
                Browse Shop
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
