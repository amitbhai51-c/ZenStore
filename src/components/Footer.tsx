import React from "react";
import Link from "next/link";
import { Coins, ShieldCheck, Mail, Headphones, HelpCircle } from "lucide-react";

export function Footer({
  siteName = "CoinCraft",
  footerText = "© 2026 CoinCraft Digital Store. All rights reserved.",
  supportInfo = "Support available 24/7 online",
  contactEmail = "support@coincraft.local",
}: {
  siteName?: string;
  footerText?: string;
  supportInfo?: string;
  contactEmail?: string;
}) {
  return (
    <footer className="bg-[#07080c] border-t border-[#171b26] text-zinc-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-black font-bold">
                <Coins className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white">{siteName}</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The premier coin-based digital marketplace. Earn coins by browsing or completing daily tasks, or purchase coins securely with real money, then redeem for verified digital codes and cards.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Genuine & Admin-Verified Deliveries</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Navigation</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-amber-400 transition-colors">
                  Home (How it works)
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-amber-400 transition-colors">
                  Shop Digital Products
                </Link>
              </li>
              <li>
                <Link href="/earn" className="hover:text-amber-400 transition-colors">
                  Earn Free Coins (Tasks & AFK)
                </Link>
              </li>
              <li>
                <Link href="/purchase" className="hover:text-amber-400 transition-colors">
                  Purchase Coins (Razorpay / UPI)
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-amber-400 transition-colors">
                  My Orders & Digital Keys
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Trust & Legal</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terms" className="hover:text-amber-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-amber-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-amber-400 transition-colors">
                  Refund & Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-amber-400 transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Contact Details */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Support Desk</h3>
            <div className="flex items-start gap-2 text-xs">
              <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="text-zinc-300 select-all">{contactEmail}</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <Headphones className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{supportInfo}</span>
            </div>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-amber-400 border border-amber-500/20 text-xs font-semibold transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Submit a Support Ticket
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-[#151924] mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <p>{footerText}</p>
          <div className="flex items-center gap-4">
            <span>Server Timezone: IST (UTC+5:30)</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">10 Coins = ₹1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
