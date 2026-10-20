"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
  Coins,
  ShoppingBag,
  Sparkles,
  CreditCard,
  User,
  ShieldAlert,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Ticket,
} from "lucide-react";

export function Navbar({ siteName = "CoinCraft", logoUrl = "" }: { siteName?: string; logoUrl?: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[#090b10]/95 backdrop-blur-md border-b border-[#1b202e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              {logoUrl ? (
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#121622] border border-[#202638] flex items-center justify-center p-0.5 group-hover:border-amber-400/50 transition-all">
                  <img
                    src={logoUrl}
                    alt={siteName}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  <Coins className="w-5 h-5 text-black" />
                </div>
              )}
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                {siteName}
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/")
                    ? "bg-[#181d2a] text-amber-400"
                    : "text-zinc-300 hover:text-white hover:bg-[#121622]"
                }`}
              >
                Home
              </Link>
              <Link
                href="/shop"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/shop")
                    ? "bg-[#181d2a] text-amber-400"
                    : "text-zinc-300 hover:text-white hover:bg-[#121622]"
                }`}
              >
                Shop
              </Link>
              <Link
                href="/earn"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive("/earn")
                    ? "bg-[#181d2a] text-amber-400"
                    : "text-zinc-300 hover:text-white hover:bg-[#121622]"
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Earn Coins
              </Link>
              <Link
                href="/purchase"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive("/purchase")
                    ? "bg-[#181d2a] text-amber-400"
                    : "text-zinc-300 hover:text-white hover:bg-[#121622]"
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Buy Coins
              </Link>
              <Link
                href="/redeem"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive("/redeem")
                    ? "bg-[#181d2a] text-amber-400"
                    : "text-zinc-300 hover:text-white hover:bg-[#121622]"
                }`}
              >
                <Ticket className="w-4 h-4 text-amber-400" />
                Redeem Code
              </Link>
            </div>
          </div>

          {/* Right Action Icons & Auth */}
          <div className="hidden md:flex items-center gap-4">
            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative p-2 rounded-lg bg-[#121622] border border-[#1f2638] text-zinc-300 hover:text-amber-400 hover:border-amber-500/40 transition-all"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black font-extrabold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                {/* Coin Wallet Balance Pill */}
                <Link
                  href="/account"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 text-amber-400 hover:border-amber-400 transition-all shadow-sm"
                  title="View Coin Wallet"
                >
                  <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="text-sm font-bold tracking-wide">
                    {user.coinBalance.toLocaleString()} <span className="text-xs text-amber-400/80">Coins</span>
                  </span>
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdown(!userDropdown)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121622] border border-[#1f2638] text-sm text-zinc-200 hover:border-zinc-500 transition-all"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs uppercase">
                      {user.username.slice(0, 2)}
                    </div>
                    <span className="max-w-[100px] truncate">{user.username}</span>
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  </button>

                  {userDropdown && (
                    <div
                      className="absolute right-0 mt-2 w-52 rounded-xl bg-[#10131d] border border-[#212739] shadow-2xl py-2 z-50"
                      onClick={() => setUserDropdown(false)}
                    >
                      <div className="px-4 py-2 border-b border-[#1c2233]">
                        <p className="text-xs text-zinc-400">Signed in as</p>
                        <p className="text-sm font-medium text-white truncate">{user.email}</p>
                      </div>

                      <Link
                        href="/account"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-[#181d2c] hover:text-white"
                      >
                        <User className="w-4 h-4 text-zinc-400" />
                        Account Dashboard
                      </Link>

                      <Link
                        href="/redeem"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-amber-400 hover:bg-[#181d2c] hover:text-amber-300 font-medium"
                      >
                        <Ticket className="w-4 h-4 text-amber-400" />
                        Redeem Promo Code
                      </Link>

                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-amber-400 hover:bg-[#181d2c] hover:text-amber-300 font-medium"
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-400" />
                          Admin Portal
                        </Link>
                      )}

                      <div className="border-t border-[#1c2233] my-1"></div>

                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-[#141824] transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/cart"
              className="relative p-2 rounded-lg bg-[#121622] text-zinc-300"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#121622] text-zinc-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#1c2233] bg-[#0c0e15] px-4 pt-3 pb-6 space-y-3">
          {user && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#141824] border border-[#202638] mb-3">
              <div>
                <p className="text-xs text-zinc-400">Welcome,</p>
                <p className="text-sm font-bold text-white">{user.username}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 text-amber-400 text-sm font-bold">
                <Coins className="w-4 h-4" />
                {user.coinBalance}
              </div>
            </div>
          )}

          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-zinc-200 hover:bg-[#161a28]"
          >
            Home
          </Link>
          <Link
            href="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-zinc-200 hover:bg-[#161a28]"
          >
            Shop Products
          </Link>
          <Link
            href="/earn"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-amber-400 hover:bg-[#161a28]"
          >
            Earn Coins (Tasks & AFK)
          </Link>
          <Link
            href="/purchase"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-emerald-400 hover:bg-[#161a28]"
          >
            Purchase Coins
          </Link>
          <Link
            href="/redeem"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-amber-400 hover:bg-[#161a28]"
          >
            Redeem Promo Code
          </Link>
          <Link
            href="/account"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-zinc-200 hover:bg-[#161a28]"
          >
            My Account & Orders
          </Link>

          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30"
            >
              Admin Portal
            </Link>
          )}

          <div className="border-t border-[#1c2233] pt-3">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-red-500/10"
              >
                Log Out
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-[#161a28] text-white text-sm font-semibold"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-amber-500 text-black text-sm font-bold"
                >
                  Create Free Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
