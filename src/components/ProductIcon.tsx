import React from "react";
import { Gamepad2, Gift, Sparkles, Trophy, ShoppingBag, ShieldCheck } from "lucide-react";

export function ProductIcon({ type, className = "w-12 h-12" }: { type: string; className?: string }) {
  const norm = type.toLowerCase();

  if (norm.includes("minecraft")) {
    return (
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-800 to-green-950 border border-emerald-600/40 p-2 shadow-lg ${className}`}>
        {/* Pixel block icon style */}
        <div className="w-full h-full rounded border-2 border-green-400/60 bg-emerald-700/80 flex items-center justify-center">
          <div className="w-1/2 h-1/2 bg-amber-800/90 border border-green-500 rounded-sm"></div>
        </div>
        <span className="absolute -bottom-1 -right-1 text-[9px] bg-emerald-500 text-black px-1 font-black rounded">MC</span>
      </div>
    );
  }

  if (norm.includes("googleplay") || norm.includes("play")) {
    return (
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 border border-blue-500/30 p-2 shadow-lg ${className}`}>
        {/* Google Play 4-color triangle stylized SVG */}
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
          <path d="M4 3.5C4 2.8 4.8 2.3 5.4 2.7L20.6 11.2C21.2 11.5 21.2 12.5 20.6 12.8L5.4 21.3C4.8 21.7 4 21.2 4 20.5V3.5Z" fill="#0284c7" />
          <path d="M15.5 12L4 3.5V20.5L15.5 12Z" fill="#059669" opacity="0.3" />
          <path d="M20.6 11.2L15.5 12L13 9.5L18.5 6.5L20.6 11.2Z" fill="#eab308" />
          <path d="M15.5 12L20.6 12.8L18.5 17.5L13 14.5L15.5 12Z" fill="#ef4444" />
        </svg>
        <span className="absolute -bottom-1 -right-1 text-[9px] bg-sky-500 text-black px-1 font-black rounded">PLAY</span>
      </div>
    );
  }

  if (norm.includes("steam")) {
    return (
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-950 via-slate-900 to-zinc-950 border border-sky-600/40 p-2 shadow-lg ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
          <path
            fill="#38bdf8"
            d="M12 2a10 10 0 0 0-10 9.8c0 4.7 3.3 8.7 7.8 9.7l2.8-4.2a3 3 0 0 1-1.6-2.6 3 3 0 0 1 3-3c.4 0 .8.1 1.2.2l3-4.3A5.5 5.5 0 0 0 12 7.5a5.5 5.5 0 1 0 5.5 5.5c0-.4 0-.8-.1-1.2l4.3-3A10 10 0 0 0 12 2zm0 7.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z"
          />
        </svg>
        <span className="absolute -bottom-1 -right-1 text-[9px] bg-sky-400 text-black px-1 font-black rounded">STEAM</span>
      </div>
    );
  }

  if (norm.includes("discord")) {
    return (
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/40 p-2 shadow-lg ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="#818cf8">
          <path d="M19.3 5.4A15.8 15.8 0 0 0 15.4 4c-.2.4-.4.8-.5 1.2-1.7-.2-3.4-.2-5 0-.2-.4-.4-.8-.6-1.2A15.7 15.7 0 0 0 5.3 5.4C2.8 9.2 2.1 13 2.4 16.6a16 16 0 0 0 4.9 2.5c.4-.6.8-1.2 1.1-1.8-1-.4-1.9-.9-2.7-1.6.2.2.5.3.7.5 3.2 1.5 6.6 1.5 9.8 0 .3-.2.5-.3.7-.5-.8.7-1.7 1.2-2.7 1.6.3.6.7 1.2 1.1 1.8a16 16 0 0 0 4.9-2.5c.4-4.3-.7-8.1-2.9-11.2zM8.5 13.7c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2c0 1.1-.8 2-1.8 2zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2c0 1.1-.8 2-1.8 2z" />
        </svg>
        <span className="absolute -bottom-1 -right-1 text-[9px] bg-indigo-500 text-white px-1 font-black rounded">NITRO</span>
      </div>
    );
  }

  if (norm.includes("spotify")) {
    return (
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-green-950 to-zinc-950 border border-green-500/40 p-2 shadow-lg ${className}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="#22c55e">
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.6 14.4c-.2.3-.6.4-.9.2-2.4-1.5-5.4-1.8-9-1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 3.9-.9 7.3-.5 10.1 1.1.2.2.3.6.2.9zm1.2-2.7c-.3.4-.8.5-1.2.3-2.7-1.7-6.9-2.2-10.1-1.2-.4.1-.9-.1-1-.6-.1-.4.1-.9.6-1 3.7-1.1 8.3-.6 11.4 1.3.4.2.5.8.3 1.2zm.1-2.8C14.6 9 9.3 8.8 6.2 9.7c-.5.2-1-.2-1.2-.7-.2-.5.2-1 .7-1.2 3.6-1.1 9.5-.9 13.3 1.4.5.3.6.9.3 1.4-.2.4-.8.6-1.3.3z" />
        </svg>
        <span className="absolute -bottom-1 -right-1 text-[9px] bg-green-500 text-black px-1 font-black rounded">MUSIC</span>
      </div>
    );
  }

  if (norm.includes("roblox")) {
    return (
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-red-950 to-zinc-950 border border-red-500/40 p-2 shadow-lg ${className}`}>
        <div className="w-3/5 h-3/5 border-4 border-red-500 rotate-12 flex items-center justify-center">
          <div className="w-1/3 h-1/3 bg-red-400"></div>
        </div>
        <span className="absolute -bottom-1 -right-1 text-[9px] bg-red-500 text-white px-1 font-black rounded">ROBUX</span>
      </div>
    );
  }

  // Default fallback
  return (
    <div className={`flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700/50 p-2 shadow-lg text-amber-400 ${className}`}>
      <Gift className="w-6 h-6" />
    </div>
  );
}
