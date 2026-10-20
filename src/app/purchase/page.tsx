"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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

  // Razorpay test simulation dialog
  const [testModal, setTestModal] = useState<any>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/purchase/config");
      if (res.ok) {
        const json = await res.json();
        setConfig(json);
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

  // 1. Razorpay Payment Trigger
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
      const isWindowRazorpayAvailable = typeof (window as any).Razorpay !== "undefined";

      if (isWindowRazorpayAvailable && !orderData.isSimulated) {
        const options = {
          key: config?.razorpayKeyId,
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
        rzp.open();
      } else {
        // Test mode / sandbox checkout modal
        setTestModal({
          orderData,
        });
      }
    } catch (e: any) {
      setError("Network error while initializing payment");
    } finally {
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
        setNotification(`Payment verified! +${verifyData.coinsAdded} coins credited to your wallet.`);
        setTestModal(null);
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
          utrReference: utrInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit UTR");
      } else {
        setNotification(data.message || "UTR submitted for review!");
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121624] border border-emerald-500/50 text-emerald-300 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Test Mode Simulation Modal */}
      {testModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-[#101422] border border-[#232b40] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Razorpay Test Gateway Simulator</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Complete Test Payment</h3>
            <p className="text-xs text-zinc-400 mb-6">
              You are running in Razorpay sandbox/test mode. Simulate a successful customer payment authorization to test cryptographic server verification and wallet crediting.
            </p>

            <div className="p-4 rounded-xl bg-[#0b0e18] border border-[#1b2238] space-y-2 mb-6 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Coins to credit:</span>
                <span className="text-amber-400 font-bold">+{testModal.orderData.coins} coins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total INR Amount:</span>
                <span className="text-white font-bold">₹{testModal.orderData.amountInr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Reference:</span>
                <span className="font-mono text-zinc-300">{testModal.orderData.paymentReference}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setTestModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#171d2c] text-zinc-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  verifyRazorpayPayment({
                    paymentReference: testModal.orderData.paymentReference,
                    razorpayOrderId: testModal.orderData.razorpayOrderId,
                    razorpayPaymentId: `pay_test_${Date.now()}`,
                    razorpaySignature: "test_signature_approved",
                  })
                }
                disabled={processing}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-lg shadow-amber-500/20"
              >
                {processing ? "Verifying..." : "Authorize Payment (Test)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Balance Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#181d2a]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Official Coin Top-Up</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Purchase Coins</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Exchange real money for coins instantly at the official exchange rate of <strong>₹1 = {exchangeRate} Coins</strong>.
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

      {/* Maintenance Alert */}
      {config?.isMaintenance && (
        <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Coin Purchases are Currently Under Maintenance</p>
            <p className="text-amber-400/80 mt-0.5">
              Online checkout and manual payments are temporarily unavailable. Please check back shortly.
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
                onClick={() => setSelectedMethod("RAZORPAY")}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  selectedMethod === "RAZORPAY"
                    ? "bg-[#141a2c] border-amber-500/70 ring-1 ring-amber-500/50"
                    : "bg-[#111420] border-[#1e2538] hover:border-zinc-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    Razorpay Checkout
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    Instant Credit
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Cards, UPI (GPay, PhonePe, Paytm), and NetBanking. Verified automatically on the server.
                </p>
              </button>

              {/* Method B: Manual Payment URL / UPI QR */}
              <button
                type="button"
                onClick={() => setSelectedMethod("MANUAL")}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  selectedMethod === "MANUAL"
                    ? "bg-[#141a2c] border-amber-500/70 ring-1 ring-amber-500/50"
                    : "bg-[#111420] border-[#1e2538] hover:border-zinc-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" />
                    Direct UPI / Payment Link
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                    Manual Review
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Open external payment URL / scan QR code, then submit 12-digit UTR reference for admin approval.
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
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Payment Link in New Tab
                </a>
              </div>

              <form onSubmit={handleSubmitUtr} className="pt-3 border-t border-[#1a2133] space-y-3">
                <label className="block text-xs font-semibold text-zinc-300">
                  Enter 12-Digit UTR / Transaction Reference ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    placeholder="e.g. 423589123456"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#090b12] border border-[#232b40] text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={utrSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shrink-0"
                  >
                    {utrSubmitting ? "Submitting..." : "Submit UTR"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Col: Order Breakdown & Confirm Button */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0f131f] border border-[#1e2538] space-y-6">
            <h3 className="text-base font-bold text-white pb-3 border-b border-[#181d2a]">
              Purchase Calculation
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Coins to Receive:</span>
                <span className="text-amber-400 font-bold text-base flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  {coinsInput.toLocaleString()} Coins
                </span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>Exchange Rate:</span>
                <span className="text-zinc-200">₹1 = {exchangeRate} Coins</span>
              </div>

              <div className="flex justify-between text-zinc-400">
                <span>Processing Fees:</span>
                <span className="text-emerald-400 font-semibold">₹0.00 (Zero Fees)</span>
              </div>

              <div className="border-t border-[#181d2a] pt-3 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-white">Total Amount (INR):</span>
                <span className="text-2xl font-black text-white">₹{calculatedInr}</span>
              </div>
            </div>

            {selectedMethod === "RAZORPAY" ? (
              <button
                onClick={handleRazorpayPay}
                disabled={processing || config?.isMaintenance}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-40"
              >
                <CreditCard className="w-4 h-4" />
                <span>{processing ? "Processing..." : `Pay ₹${calculatedInr} via Razorpay`}</span>
              </button>
            ) : (
              <button
                onClick={handleManualPay}
                disabled={processing || config?.isMaintenance}
                className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] disabled:opacity-40"
              >
                <QrCode className="w-4 h-4" />
                <span>Generate UPI Payment Reference</span>
              </button>
            )}

            <div className="p-3 rounded-xl bg-[#0b0e18] border border-[#1b2133] text-[11px] text-zinc-400 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Calculated strictly in integer paise with cryptographic signature verification. Coins are credited automatically or upon admin approval.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Section */}
      <div className="mt-12 pt-8 border-t border-[#181d2a]">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white">Your Payment History</h3>
        </div>

        {config?.history?.length === 0 ? (
          <p className="text-xs text-zinc-500">No payment requests recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#1c2234]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e121c] text-zinc-400 border-b border-[#1c2234]">
                <tr>
                  <th className="p-3.5">Reference ID</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Coins</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">UTR Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171d2c] bg-[#090b12]">
                {config?.history?.map((p: any) => (
                  <tr key={p.id} className="hover:bg-[#0e121d] transition-colors">
                    <td className="p-3.5 font-mono text-zinc-300 font-semibold">{p.paymentReference}</td>
                    <td className="p-3.5 text-zinc-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="p-3.5 text-zinc-300 font-medium">
                      {p.paymentMethod === "RAZORPAY" ? "Razorpay" : "Manual UPI"}
                    </td>
                    <td className="p-3.5 text-amber-400 font-bold">+{p.coinsAmount} coins</td>
                    <td className="p-3.5 text-white font-semibold">₹{(p.amountInrPaise / 100).toFixed(2)}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          p.status === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : p.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-zinc-400">{p.utrReference || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
