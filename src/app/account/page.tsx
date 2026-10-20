"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Coins,
  Package,
  History,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  LogOut,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const { user, refreshUser, logout, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"orders" | "wallet" | "payments" | "settings">("orders");
  const [accountData, setAccountData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile Edit
  const [newUsername, setNewUsername] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Copied code feedback
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Status messages
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/account/data");
      if (res.ok) {
        const json = await res.json();
        setAccountData(json);
        setNewUsername(json.user?.username || "");
      }
    } catch {
      setError("Failed to load account data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    } else if (user) {
      fetchAccountData();
    }
  }, [user, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setProfileSaving(true);

    try {
      const res = await fetch("/api/account/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update username");
      } else {
        setMessage(data.message || "Profile updated successfully!");
        await refreshUser();
        await fetchAccountData();
      }
    } catch {
      setError("Network error");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to change password");
      } else {
        setMessage(data.message || "Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("Network error");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-amber-400">
        Loading account details...
      </div>
    );
  }

  const u = accountData?.user || user;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Profile Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0f131f] via-[#111624] to-[#0f131f] border border-[#1e2538] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl font-black uppercase shadow-lg">
            {u?.username?.slice(0, 2) || "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">{u?.username}</h1>
              {u?.isVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Unverified
                </span>
              )}
              {u?.role === "ADMIN" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  Administrator
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{u?.email}</p>
          </div>
        </div>

        {/* Balance & Actions */}
        <div className="flex items-center gap-4">
          <div className="p-3.5 px-5 rounded-2xl bg-[#090b12] border border-amber-500/30 text-right">
            <span className="text-[11px] text-zinc-400 font-medium">Available Balance</span>
            <div className="flex items-center gap-2 text-2xl font-black text-amber-400 mt-0.5">
              <Coins className="w-6 h-6 text-amber-400" />
              <span>{u?.coinBalance?.toLocaleString()}</span>
              <span className="text-xs text-amber-400/80 font-normal">Coins</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-3.5 rounded-2xl bg-[#141824] hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-[#20273a] transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#181d2a] pb-4 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "orders"
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
              : "bg-[#10131e] text-zinc-400 hover:text-white border border-[#1b2234]"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Orders & Delivered Keys ({accountData?.orders?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("wallet")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "wallet"
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
              : "bg-[#10131e] text-zinc-400 hover:text-white border border-[#1b2234]"
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Coin Transactions ({accountData?.transactions?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "payments"
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
              : "bg-[#10131e] text-zinc-400 hover:text-white border border-[#1b2234]"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Coin Purchases ({accountData?.payments?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "settings"
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
              : "bg-[#10131e] text-zinc-400 hover:text-white border border-[#1b2234]"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Profile & Security</span>
        </button>
      </div>

      {/* Global Alerts inside tabs */}
      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: Orders and Delivered Keys */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {accountData?.orders?.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0d101a] border border-[#1b2132]">
              <Package className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Orders Yet</h3>
              <p className="text-xs text-zinc-400 mb-4">
                You haven&apos;t redeemed any digital products yet.
              </p>
              <Link
                href="/shop"
                className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs"
              >
                Browse Shop Catalog
              </Link>
            </div>
          ) : (
            accountData?.orders?.map((order: any) => (
              <div
                key={order.id}
                className="p-6 rounded-2xl bg-[#0d101a] border border-[#1c2234] space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#181d2a]">
                  <div>
                    <span className="text-[11px] text-zinc-500">Order Reference</span>
                    <p className="font-mono text-sm font-bold text-amber-400">{order.orderNumber}</p>
                    <p className="text-[11px] text-zinc-400">
                      Placed on {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === "DELIVERED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : order.status === "DECLINED"
                          ? "bg-red-500/10 text-red-400 border border-red-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {order.status === "DELIVERED"
                        ? "✓ Delivered"
                        : order.status === "DECLINED"
                        ? "✕ Declined & Refunded"
                        : "⏳ " + order.status}
                    </span>

                    <div className="text-right">
                      <span className="text-[11px] text-zinc-500">Total</span>
                      <p className="text-sm font-black text-amber-400 flex items-center gap-1">
                        <Coins className="w-4 h-4" />
                        {order.totalCoins.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items in this order */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Purchased Items:
                  </span>
                  <div className="divide-y divide-[#171d2b]">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                        <span className="text-white font-medium">
                          {item.productName} <span className="text-zinc-500">× {item.quantity}</span>
                        </span>
                        <span className="text-zinc-400 font-semibold">
                          {item.subtotalCoins.toLocaleString()} coins
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivered Content (Protected Vault Display) */}
                {order.status === "DELIVERED" && order.digitalDelivery && (
                  <div className="p-4 rounded-xl bg-[#101726] border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4" />
                        Your Delivered Digital Key / Redeem Code:
                      </span>
                      <button
                        onClick={() => handleCopy(order.id, order.digitalDelivery)}
                        className="px-2.5 py-1 rounded-lg bg-[#162035] hover:bg-[#1e2c4a] text-zinc-200 text-xs flex items-center gap-1 transition-colors"
                      >
                        {copiedCodeId === order.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-3 rounded-lg bg-[#0a0f1a] border border-[#1b263d] text-sky-300 font-mono text-sm break-all whitespace-pre-wrap select-all">
                      {order.digitalDelivery}
                    </pre>
                  </div>
                )}

                {/* Declined Reason & Refund Note */}
                {order.status === "DECLINED" && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs space-y-1">
                    <p className="font-bold text-red-400">Order Declined by Administrator</p>
                    <p className="text-zinc-300">
                      Reason:{" "}
                      <span className="font-medium text-red-300">
                        {order.declineReason || "Product temporarily out of supply"}
                      </span>
                    </p>
                    <p className="text-emerald-400 font-semibold pt-1">
                      ✓ {order.totalCoins.toLocaleString()} coins have been refunded back to your wallet.
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Coin Wallet Transactions */}
      {activeTab === "wallet" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Coin Transaction Audit Log
            </h3>
            <span className="text-xs text-zinc-500">Chronological history with running balances</span>
          </div>

          {accountData?.transactions?.length === 0 ? (
            <p className="text-xs text-zinc-500">No transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#1c2234]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e121c] text-zinc-400 border-b border-[#1c2234]">
                  <tr>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Coins</th>
                    <th className="p-3.5">Balance</th>
                    <th className="p-3.5">Description & Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171d2c] bg-[#090b12]">
                  {accountData?.transactions?.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-[#0e121d] transition-colors">
                      <td className="p-3.5 text-zinc-400 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            tx.type.includes("EARNING")
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : tx.type === "COIN_PURCHASE"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : tx.type === "REFUND"
                              ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                              : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold whitespace-nowrap">
                        {tx.amount > 0 ? (
                          <span className="text-emerald-400">+{tx.amount}</span>
                        ) : (
                          <span className="text-red-400">{tx.amount}</span>
                        )}
                      </td>
                      <td className="p-3.5 text-zinc-300 font-mono">
                        {tx.balanceBefore} → <strong className="text-white">{tx.balanceAfter}</strong>
                      </td>
                      <td className="p-3.5 text-zinc-300">{tx.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Coin Purchases & Payments */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Payment Requests & Top-ups
            </h3>
            <Link
              href="/purchase"
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              + Buy More Coins
            </Link>
          </div>

          {accountData?.payments?.length === 0 ? (
            <p className="text-xs text-zinc-500">No payment records found.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#1c2234]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e121c] text-zinc-400 border-b border-[#1c2234]">
                  <tr>
                    <th className="p-3.5">Payment Ref</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Coins</th>
                    <th className="p-3.5">Amount (INR)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">UTR / TxID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171d2c] bg-[#090b12]">
                  {accountData?.payments?.map((pay: any) => (
                    <tr key={pay.id} className="hover:bg-[#0e121d] transition-colors">
                      <td className="p-3.5 font-mono text-zinc-300 font-semibold">{pay.paymentReference}</td>
                      <td className="p-3.5 text-zinc-400">{new Date(pay.createdAt).toLocaleDateString()}</td>
                      <td className="p-3.5 text-zinc-300 font-medium">{pay.paymentMethod}</td>
                      <td className="p-3.5 text-amber-400 font-bold">+{pay.coinsAmount} coins</td>
                      <td className="p-3.5 text-white font-semibold">₹{(pay.amountInrPaise / 100).toFixed(2)}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            pay.status === "SUCCESS"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : pay.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {pay.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-zinc-400">{pay.utrReference || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Profile & Security Settings */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Update Username Form */}
          <div className="p-6 rounded-2xl bg-[#0d101a] border border-[#1c2234] space-y-4">
            <h3 className="text-base font-bold text-white mb-2">Edit Profile Details</h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Email (Primary)</label>
                <input
                  type="email"
                  disabled
                  value={u?.email || ""}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b12] border border-[#1b2132] text-zinc-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
              >
                {profileSaving ? "Saving..." : "Save Username"}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="p-6 rounded-2xl bg-[#0d101a] border border-[#1c2234] space-y-4">
            <h3 className="text-base font-bold text-white mb-2">Change Password</h3>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">New Password (Min 8 chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#121624] border border-[#20273a] text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
              >
                {passwordSaving ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
