import React from "react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-zinc-300 text-sm leading-relaxed space-y-6">
      <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
      <p className="text-xs text-zinc-500">Last updated: October 20, 2026</p>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
        <p>
          We collect your email address, chosen username, password hash, and transaction records required to provide our authentication, coin wallet, and order delivery services.
        </p>

        <h2 className="text-lg font-bold text-white">2. Password and Token Security</h2>
        <p>
          Passwords are never stored in plain text; they are hashed using salted cryptographic algorithms (bcrypt). One-time passcodes (OTPs) and password reset tokens are similarly hashed and set to auto-expire.
        </p>

        <h2 className="text-lg font-bold text-white">3. Payment Information</h2>
        <p>
          When you purchase coins through Razorpay, payment card and banking credentials are processed directly by PCI-DSS compliant payment gateways. CoinCraft does not store card numbers, CVVs, or bank netbanking credentials.
        </p>

        <h2 className="text-lg font-bold text-white">4. Cookies and Session Management</h2>
        <p>
          We use secure, HTTP-only authentication cookies to maintain your login session. We do not use third-party tracking or advertising cookies.
        </p>
      </div>
    </div>
  );
}
