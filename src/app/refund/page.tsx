import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-zinc-300 text-sm leading-relaxed space-y-6">
      <div className="flex items-center gap-2 text-emerald-400">
        <ShieldCheck className="w-6 h-6" />
        <span className="text-xs font-bold uppercase tracking-wider">Buyer Protection</span>
      </div>

      <h1 className="text-3xl font-extrabold text-white">Refund & Cancellation Policy</h1>
      <p className="text-xs text-zinc-500">Last updated: October 20, 2026</p>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">1. Automatic Coin Refunds on Declined Orders</h2>
        <p>
          If your digital product order cannot be fulfilled by our administrators, or if an item becomes temporarily out of stock, your order is marked as Declined with a stated reason, and <strong>100% of the coins paid are automatically and instantly refunded</strong> back to your wallet balance.
        </p>

        <h2 className="text-lg font-bold text-white">2. Delivered Digital Codes</h2>
        <p>
          Due to the nature of digital redeem codes, vouchers, and game licenses, orders that have been successfully fulfilled and delivered cannot be cancelled or returned once the digital key has been revealed.
        </p>

        <h2 className="text-lg font-bold text-white">3. Defective or Invalid Codes</h2>
        <p>
          In the rare event that a delivered code is reported as invalid or already redeemed, please contact our support desk at <strong className="text-amber-400">support@coincraft.local</strong> within 48 hours with a screenshot of the redemption error. Our team will verify with the distributor and issue a replacement code or full coin refund.
        </p>

        <h2 className="text-lg font-bold text-white">4. Real Money Coin Purchases</h2>
        <p>
          Coin purchases made via Razorpay or manual UPI are final once the coins have been credited to your wallet. If you encounter a payment failure where money was debited from your bank but coins were not credited, Razorpay automatically reverses the transaction within 3-5 banking days.
        </p>
      </div>
    </div>
  );
}
