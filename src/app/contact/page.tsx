"use client";

import React, { useState } from "react";
import { Mail, Send, CheckCircle2, AlertCircle, Headphones, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit message");
      } else {
        setSuccess(data.message || "Message sent successfully!");
        setFormData({ name: "", email: "", subject: "", message: "" });
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
          <Headphones className="w-3.5 h-3.5" />
          <span>Support Desk</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Contact Our Team</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Have an inquiry regarding a digital redemption, coin transaction, or payment? We are here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Left Column: Contact info */}
        <div className="md:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0f131f] border border-[#1e2538] space-y-4">
            <h3 className="text-base font-bold text-white mb-2">Direct Support Channels</h3>

            <div className="flex items-start gap-3 text-xs">
              <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Email Address</p>
                <p className="text-zinc-400">support@coincraft.local</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Operating Hours</p>
                <p className="text-zinc-400">Monday – Saturday: 9:00 AM – 7:00 PM IST</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Digital Fulfillment</p>
                <p className="text-zinc-400">Automated vault delivery 24/7 online</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0b0e18] border border-[#181d2a] text-xs text-zinc-400 leading-relaxed">
            <p className="font-semibold text-white mb-1">Frequently asked about orders?</p>
            You can track all placed redemptions, pending reviews, and delivered keys in real time inside{" "}
            <strong className="text-amber-400">My Account → Orders</strong>.
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="md:col-span-7">
          <div className="p-8 rounded-2xl bg-[#0f131f] border border-[#1e2538] shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6">Send Us a Message</h2>

            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1.5">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Alex Vance"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141826] border border-[#232b40] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1.5">Your Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141826] border border-[#232b40] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Order #ORD-20261020 assistance"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141826] border border-[#232b40] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">Message</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please describe your query in detail..."
                  className="w-full p-4 rounded-xl bg-[#141826] border border-[#232b40] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                {loading ? "Sending Message..." : "Submit Support Message"}
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
