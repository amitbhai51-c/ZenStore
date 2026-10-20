import React from "react";
import Link from "next/link";
import { HelpCircle, ArrowLeft, Home, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-[#0f131f] border border-[#1e2538] flex items-center justify-center text-amber-400 mb-6 shadow-2xl">
        <HelpCircle className="w-10 h-10" />
      </div>
      <h1 className="text-5xl font-black text-white tracking-tight mb-2">404</h1>
      <h2 className="text-xl font-bold text-zinc-200 mb-3">Page Not Found</h2>
      <p className="text-xs text-zinc-400 max-w-sm mb-8 leading-relaxed">
        The page you requested does not exist or may have been moved. Explore our shop or head back to the homepage.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-zinc-200 border border-[#21283d] font-semibold text-xs flex items-center gap-1.5 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          Home
        </Link>
        <Link
          href="/shop"
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-105"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Browse Shop
        </Link>
      </div>
    </div>
  );
}
