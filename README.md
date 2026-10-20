# CoinCraft — Coin-Based Digital Products Platform

CoinCraft is a production-ready, full-stack digital products shop where users earn virtual coins through AFK idle mode or daily sponsored link tasks, purchase coins securely with real money via Razorpay / UPI, and redeem those coins for verified digital game keys (such as Minecraft), gift cards (Google Play, Steam, Roblox), and subscriptions (Discord Nitro, Spotify).

Built with **Next.js 14 (App Router & TypeScript)**, **Tailwind CSS**, **Prisma ORM**, and **SQLite / PostgreSQL**.

---

## 🌟 Key Features

### 1. Design & User Experience
- **Sleek Pure Dark Theme**: Deep charcoal surfaces (`#0d101a`, `#111624`), gold/amber accents (`#f59e0b`, `#fbbf24`), subtle borders (`#1c2234`), and custom scrollbars.
- **Strict Homepage Rule**: The landing page explains the coin economy, earning methods, and how the shop works—**no product cards or shop listings appear on the homepage**.
- **Responsive Architecture**: Optimized for desktop, tablet, and mobile screens.

### 2. Authentication & Verification
- Database-backed user registration with password hashing (bcrypt 12 rounds).
- **6-Digit OTP Verification**: 10-minute expiry, rate-limited attempts, resend cooldown (60s), securely stored as cryptographic hashes.
- **Access Restrictions**: Unverified and suspended accounts are strictly blocked at the API level from shopping, redeeming, or earning coins.
- **Forgot Password & Reset**: Single-use tokenized password reset links with security alert emails upon modification.
- **Account Suspension**: Administrators can suspend accounts with a mandatory reason; suspension is enforced on both client and server.

### 3. Digital Shop & Catalog
- Search by product name, filter by category and stock availability, sort by price/newest/name.
- Individual Product Details page (`/shop/product/[slug]`) displaying description, instructions, stock, coin price, and instant checkout.
- Cart & atomic checkout with server-side price recalculation and balance verification.

### 4. Coin Wallet & Earning System
- **AFK Idle Earning**: Real-time timer and progress; server-validated heartbeats every 60s enforce a daily cap (default 20 coins/day). Blocks multi-tab abuse and fast clocks.
- **Sponsored Link Tasks**: Cryptographically signed 15-second task sessions with daily limit enforcement (default 40 coins/day, 2 coins/task).
- **Atomic Wallet Transactions**: Transactions are protected by Prisma transactions with strict overdraft prevention and duplicate refund blocks.

### 5. Coin Purchases & Payment Processing
- Fixed exchange rate: **₹1 = 10 Coins** (minimum purchase: 10 coins / ₹1). Calculated in integer paise to avoid rounding issues.
- **Method A (Razorpay)**: Server-side order creation, checkout modal, and HMAC SHA256 signature verification.
- **Method B (Manual UPI / Configurable URL)**: Generates a unique reference, accepts 12-digit UTR submissions, and routes to the Admin Portal for verification before crediting coins.

### 6. Admin Portal (`/admin`)
- Role-based server-side protection (`role === 'ADMIN'`).
- **Dashboard**: Live database counts (users, products, orders, circulation coins, recent audit logs).
- **User Management**: Inspect accounts, adjust coin balances with mandatory reasons, suspend/unsuspend accounts.
- **Product Management**: Add, edit, archive products, manage categories, pricing, stock, and SVG icons.
- **Order Fulfillment**: Fulfill orders with digital redemption keys (revealed exclusively in the customer's account vault), or decline orders with automatic 100% coin refunds.
- **Payment Reviews**: Approve or reject manual UPI/UTR requests.
- **Website Settings & Maintenance**: Live toggles for site branding, timezone, earning maintenance, and purchase maintenance.
- **SMTP Mailer & Email Templates**: Configure outgoing SMTP, test connection, and edit all 11 responsive HTML templates with live test dispatch.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Node.js v18+ or v20+ or v22+
- npm v9+

### 2. Installation
```bash
# Clone or navigate to the project directory
cd /home/amit/.gemini/antigravity/scratch/coin-shop

# Install dependencies
npm install
```

### 3. Database Migration & Seed
```bash
# Push schema and generate Prisma client
npx prisma db push
npx prisma generate

# Seed initial settings, email templates, categories, products, and tasks
npx prisma db seed
```

### 4. Secure Admin Account Creation
```bash
npm run admin:create
```
*Follow the interactive prompt to set your administrator email and secure password.*

### 5. Run Automated Tests
```bash
npm run test:logic
```
*Runs the 19 automated integration tests verifying wallet safeguards, idempotent refunds, Razorpay signatures, and OTP logic.*

### 6. Start the Server
```bash
# Development mode
npm run dev

# Or Production build and start
npm run build
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

A `.env.example` file is included in the project root:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLite file or PostgreSQL connection string | `file:./dev.db` |
| `NEXT_PUBLIC_APP_URL` | Base application URL | `http://localhost:3000` |
| `JWT_SECRET` | Strong secret for signing session JWTs | (32+ chars) |
| `RAZORPAY_KEY_ID` | Razorpay Key ID (Test or Live) | `rzp_test_demo...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `demoSecretKey...` |
| `SMTP_HOST` | Outgoing SMTP host | (Optional, or in Admin) |
| `SMTP_PORT` | SMTP Port | `587` |
| `SMTP_USER` | SMTP Username | |
| `SMTP_PASS` | SMTP Password | |
| `SMTP_FROM` | Sender email address | `noreply@coincraft.local` |

---

## 🔒 Security Architecture Highlights

1. **Server-Side Authorization**: Endpoints verify JWT cookies, suspension status, email verification, and admin roles.
2. **Atomic Coin Balances**: Credits and debits execute inside `prisma.$transaction` blocks to prevent race conditions.
3. **Idempotent Refunds**: Orders track `refundProcessed: true`; duplicate refund calls are strictly rejected.
4. **Anti-Tampering Earning**: AFK heartbeats enforce minimum 50-second intervals and daily caps; link task tokens use HMAC SHA256 signatures with 15-second wait validation.
5. **Private Digital Vault**: Fulfilled digital keys are never rendered publicly or exposed in unauthorized API responses.
