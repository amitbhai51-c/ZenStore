import React from "react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-zinc-300 text-sm leading-relaxed space-y-6">
      <h1 className="text-3xl font-extrabold text-white">Terms of Service</h1>
      <p className="text-xs text-zinc-500">Last updated: October 20, 2026</p>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
        <p>
          By creating an account, browsing the website, accumulating coins, or purchasing digital goods on CoinCraft, you agree to be bound by these Terms of Service. If you do not agree, you must discontinue using our services.
        </p>

        <h2 className="text-lg font-bold text-white">2. Virtual Coin System</h2>
        <p>
          Coins are virtual reward units used exclusively within CoinCraft to redeem eligible digital products. Coins have a reference exchange value of 10 Coins = ₹1 INR for top-ups, but cannot be transferred between accounts, traded on third-party exchanges, or directly cashed out.
        </p>

        <h2 className="text-lg font-bold text-white">3. Earning Fair Use & Anti-Tampering</h2>
        <p>
          Users must not employ automated bots, headless scrapers, click-farms, proxy rotations, or modified client scripts to simulate AFK idling or link unlocks. Violations will result in immediate account suspension, cancellation of unfulfilled orders, and forfeiture of coin balances.
        </p>

        <h2 className="text-lg font-bold text-white">4. Digital Product Fulfillment</h2>
        <p>
          All products sold on CoinCraft are intangible digital goods, including game redeem codes, digital wallet gift cards, and subscription vouchers. Once an order is fulfilled and the digital key is revealed in your account vault, it is considered consumed.
        </p>
      </div>
    </div>
  );
}
