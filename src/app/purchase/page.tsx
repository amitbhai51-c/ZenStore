"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { useAuth } from "@/context/AuthContext";
import {
  Coins,
  CreditCard,
  QrCode,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  History,
  ArrowRight,
  Info,
} from "lucide-react";

export default function PurchasePage() {
  const { user, refreshUser } = useAuth();

  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [coinsInput, setCoinsInput] = useState<number>(500);
  const [selectedMethod, setSelectedMethod] = useState<"RAZORPAY" | "MANUAL">("RAZORPAY");

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // Manual payment state
  const [manualPendingRequest, setManualPendingRequest] = useState<any>(null);
  const [utrInput, setUtrInput] = useState("");
  const [utrSubmitting, setUtrSubmitting] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/purchase/config");
      if (res.ok) {
        const json = await res.json();
        setConfig(json);
        // Automatically switch selected method if current one is disabled
        if (json.razorpayEnabled === false && json.manualPaymentEnabled) {
          setSelectedMethod("MANUAL");
        } else if (json.manualPaymentEnabled === false && json.razorpayEnabled) {
          setSelectedMethod("RAZORPAY");
        }
      }
    } catch {
      setError("Failed to load purchase configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const exchangeRate = config?.exchangeRate || 10;
  const calculatedInr = (coinsInput / exchangeRate).toFixed(2);

  const handleCoinsChange = (val: number) => {
    setCoinsInput(Math.max(10, val));
  };

  // 1. Razorpay Real Payment Trigger
  const handleRazorpayPay = async () => {
    setError("");
    setProcessing(true);

    try {
      const res = await fetch("/api/purchase/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coins: coinsInput }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        setError(orderData.error || "Failed to create payment order");
        setProcessing(false);
        return;
      }

      // Check if standard Razorpay checkout is loaded
      const isWindowRazorpayAvailable = typeof window !== "undefined" && typeof (window as any).Razorpay !== "undefined";

      if (!isWindowRazorpayAvailable || !config?.razorpayKeyId) {
        setError(
          "Razorpay online gateway is currently not configured or unavailable on this server. Please use Direct UPI / Manual payment below."
        );
        setProcessing(false);
        return;
      }

      const options = {
        key: config.razorpayKeyId,
        amount: orderData.amountPaise,
        currency: "INR",
        name: "CoinCraft Store",
        description: `Purchase of ${coinsInput} Coins`,
        order_id: orderData.razorpayOrderId,
        handler: async function (response: any) {
          await verifyRazorpayPayment({
            paymentReference: orderData.paymentReference,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
        prefill: {
          email: user?.email,
        },
        theme: {
          color: "#f59e0b",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(response.error?.description || "Payment authorization failed or was cancelled.");
        setProcessing(false);
      });
      rzp.open();
    } catch (e: any) {
      setError(e?.message || "Network error while initializing payment");
      setProcessing(false);
    }
  };

  const verifyRazorpayPayment = async (verifyPayload: any) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/purchase/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifyPayload),
      });

      const verifyData = await res.json();
      if (!res.ok) {
        setError(verifyData.error || "Payment verification failed");
      } else {
        setNotification(`Payment verified! +${verifyData.coinsCredited || coinsInput} coins credited to your wallet.`);
        await refreshUser();
        await fetchConfig();
      }
    } catch {
      setError("Failed to verify payment with server");
    } finally {
      setProcessing(false);
    }
  };

  // 2. Manual Payment Trigger
  const handleManualPay = async () => {
    setError("");
    setProcessing(true);

    try {
      const res = await fetch("/api/purchase/manual/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coins: coinsInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create manual payment reference");
      } else {
        setManualPendingRequest(data);
      }
    } catch {
      setError("Failed to initialize manual payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPendingRequest || !utrInput.trim()) return;

    setUtrSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/purchase/manual/submit-utr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentReference: manualPendingRequest.paymentReference,
          utrReference: utrInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit UTR");
      } else {
        setNotification(data.message || "UTR submitted! An administrator will review and credit your coins.");
        setManualPendingRequest(null);
        setUtrInput("");
        await fetchConfig();
      }
    } catch {
      setError("Failed to submit UTR. Please try again.");
    } finally {
      setUtrSubmitting(false);
    }
  };

  const allPurchasesDisabled =
    config?.isMaintenance ||
    (config?.razorpayEnabled === false && config?.manualPaymentEnabled === false);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Razorpay SDK Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121624] border border-emerald-500/50 text-emerald-300 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Header & Balance Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#181d2a]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Official Coin Top-Up</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Purchase Coins</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Top up your wallet with real money to redeem digital gift cards and game keys instantly.
          </p>
        </div>

        {user && (
          <div className="p-4 rounded-2xl bg-[#0f131f] border border-amber-500/25 flex items-center gap-4">
            <div>
              <p className="text-xs text-zinc-400">Current Balance</p>
              <div className="flex items-center gap-2 text-2xl font-black text-amber-400">
                <Coins className="w-6 h-6 text-amber-400" />
                <span>{user.coinBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Maintenance or Disabled Alert */}
      {allPurchasesDisabled && (
        <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Coin Purchases are Currently Paused</p>
            <p className="text-amber-400/80 mt-0.5">
              The store administrator has temporarily disabled coin purchases. Please check back shortly or earn free coins in the Earning Hub.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Purchasing Grid */}
      {!allPurchasesDisabled && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Col: Amount Calculator & Payment Selector */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-[#0d101a] border border-[#1c2234]">
              <h2 className="text-lg font-bold text-white mb-4">1. Select Coin Package</h2>

              {/* Quick Presets */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mb-6">
                {[100, 500, 1000, 2500, 5000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setCoinsInput(amount)}
                    className={`py-3 px-2 rounded-xl text-center border transition-all ${
                      coinsInput === amount
                        ? "bg-amber-500 text-black font-extrabold border-amber-400 shadow-md shadow-amber-500/20"
                        : "bg-[#121624] text-zinc-300 border-[#1e2538] hover:border-amber-500/40"
                    }`}
                  >
                    <p className="text-sm font-bold">{amount}</p>
                    <p className="text-[10px] opacity-80">₹{(amount / exchangeRate).toFixed(0)}</p>
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="space-y-2 mb-6">
                <label className="block text-xs font-semibold text-zinc-300">
                  Or Enter Custom Coin Quantity (Min: 10 coins / ₹1)
                </label>
                <div className="relative">
                  <Coins className="w-5 h-5 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={10}
                    step={10}
                    value={coinsInput}
                    onChange={(e) => handleCoinsChange(parseInt(e.target.value) || 10)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#131724] border border-[#21283d] text-base font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <h2 className="text-lg font-bold text-white mb-3">2. Choose Payment Method</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Method A: Razorpay */}
                <button
                  type="button"
                  disabled={config?.razorpayEnabled === false}
                  onClick={() => config?.razorpayEnabled !== false && setSelectedMethod("RAZORPAY")}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    config?.razorpayEnabled === false
                      ? "opacity-40 cursor-not-allowed bg-[#0b0e17] border-[#181d2a]"
                      : selectedMethod === "RAZORPAY"
                      ? "bg-[#141a2c] border-amber-500/70 ring-1 ring-amber-500/50"
                      : "bg-[#111420] border-[#1e2538] hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      Razorpay Checkout
                    </span>
                    {config?.razorpayEnabled === false ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                        Disabled
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        Online Cards/UPI
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Cards, UPI (GPay, PhonePe, Paytm), and NetBanking. Verified automatically on the server.
                  </p>
                </button>

                {/* Method B: Manual Payment URL / UPI QR */}
                <button
                  type="button"
                  disabled={config?.manualPaymentEnabled === false}
                  onClick={() => config?.manualPaymentEnabled !== false && setSelectedMethod("MANUAL")}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    config?.manualPaymentEnabled === false
                      ? "opacity-40 cursor-not-allowed bg-[#0b0e17] border-[#181d2a]"
                      : selectedMethod === "MANUAL"
                      ? "bg-[#141a2c] border-amber-500/70 ring-1 ring-amber-500/50"
                      : "bg-[#111420] border-[#1e2538] hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4" />
                      Direct UPI / QR Code
                    </span>
                    {config?.manualPaymentEnabled === false ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                        Disabled
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                        Manual Review
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Scan store UPI QR code, then submit 12-digit UTR reference for administrator verification.
                  </p>
                </button>
              </div>
            </div>

            {/* Manual Payment Step 2 UI (If opened) */}
            {manualPendingRequest && (
              <div className="p-6 rounded-2xl bg-[#121624] border border-sky-500/30 animate-slide-up space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                  <QrCode className="w-4 h-4" />
                  <span>Step 2: Complete Payment & Submit UTR</span>
                </div>

                <div className="p-4 rounded-xl bg-[#0c0f18] border border-[#1a2133] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Reference ID:</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {manualPendingRequest.paymentReference}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Exact Amount to Pay:</span>
                    <span className="text-white font-bold text-sm">
                      ₹{manualPendingRequest.amountInr}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {manualPendingRequest.instructions}
                </p>

                <div className="pt-2">
                  <a
                    href={manualPendingRequest.paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold hover:bg-sky-500/30 transition-colors"
                  >
                    <span>Open UPI Link / Scan QR</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <form onSubmit={handleSubmitUtr} className="pt-2 space-y-3">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Enter Bank / UPI 12-Digit UTR or Transaction ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. 423985123987 or UPI-TXN-..."
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#0a0d16] border border-[#21283d] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400"
                    />
                    <button
                      type="submit"
                      disabled={utrSubmitting || !utrInput.trim()}
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-black text-xs font-bold transition-all shadow-md shadow-sky-500/20"
                    >
                      {utrSubmitting ? "Submitting..." : "Submit UTR"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Col: Summary & Pay Action */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-[#0d101a] border border-[#1c2234] sticky top-24">
              <h2 className="text-base font-bold text-white mb-4">Order Summary</h2>

              <div className="space-y-3 pb-6 border-b border-[#1c2234] text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Coins Package:</span>
                  <span className="text-amber-400 font-bold">+{coinsInput.toLocaleString()} coins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Conversion Rate:</span>
                  <span className="text-zinc-300">{exchangeRate} Coins = ₹1.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Selected Gateway:</span>
                  <span className="text-white font-medium">
                    {selectedMethod === "RAZORPAY" ? "Razorpay Gateway" : "Direct UPI / QR"}
                  </span>
                </div>
              </div>

              <div className="pt-4 pb-6 flex justify-between items-baseline">
                <span className="text-sm text-zinc-300 font-semibold">Total Payable:</span>
                <div className="text-right">
                  <span className="text-3xl font-black text-white">₹{calculatedInr}</span>
                  <p className="text-[10px] text-zinc-500 mt-0.5">INR (All taxes included)</p>
                </div>
              </div>

              {selectedMethod === "RAZORPAY" ? (
                <button
                  type="button"
                  disabled={processing || config?.razorpayEnabled === false}
                  onClick={handleRazorpayPay}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{processing ? "Processing..." : `Pay ₹${calculatedInr} Online`}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={processing || config?.manualPaymentEnabled === false}
                  onClick={handleManualPay}
                  className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-black text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{processing ? "Generating..." : `Generate Payment Reference (₹${calculatedInr})`}</span>
                </button>
              )}

              <div className="mt-4 pt-4 border-t border-[#1a2030] space-y-2 text-[11px] text-zinc-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>256-bit encrypted secure payment processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Instant wallet balance update upon verification</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction & Payment History */}
      {config?.history && config.history.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Your Payment History</h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#1c2234]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e121c] text-zinc-400 border-b border-[#1c2234]">
                <tr>
                  <th className="p-3.5">Reference</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Coins</th>
                  <th className="p-3.5">Amount (INR)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171d2c] bg-[#090b12]">
                {config.history.map((item: any) => (
                  <tr key={item.id} className="hover:bg-[#0e121d] transition-colors">
                    <td className="p-3.5 font-mono text-zinc-300 font-bold">{item.paymentReference}</td>
                    <td className="p-3.5 text-zinc-400">{item.paymentMethod}</td>
                    <td className="p-3.5 font-bold text-amber-400">+{item.coinsAmount} coins</td>
                    <td className="p-3.5 text-white font-semibold">₹{(item.amountInrPaise / 100).toFixed(2)}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          item.status === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : item.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-zinc-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
