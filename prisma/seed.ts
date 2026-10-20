import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Website Settings
  await prisma.websiteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "CoinCraft",
      tagline: "Earn Coins & Redeem Digital Products",
      logoUrl: "",
      faviconUrl: "",
      contactEmail: "support@coincraft.local",
      supportInfo: "Support available Monday - Saturday, 9:00 AM - 7:00 PM IST",
      footerText: "© 2026 CoinCraft Digital Store. All rights reserved.",
      timezone: "Asia/Kolkata",
      globalMaintenance: false,
      earningMaintenance: false,
      purchaseMaintenance: false,
      linkRewardCoins: 2,
      linkDailyMaxCoins: 40,
      afkCoinsPerMinute: 1,
      afkDailyMaxCoins: 20,
      coinExchangeRateInr: 10, // ₹1 = 10 coins
      manualPaymentUrl: "https://pay.example.com/upi-qr",
      manualPaymentInstructions:
        "1. Open any UPI App (GPay, PhonePe, Paytm, etc.).\n2. Complete payment of the exact calculated INR amount.\n3. Enter the 12-digit UTR/Transaction ID below and submit for admin review.\n4. Coins will be credited to your wallet once approved.",
    },
  });

  // 2. SMTP Settings
  await prisma.smtpSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      host: process.env.SMTP_HOST || "",
      port: Number(process.env.SMTP_PORT) || 587,
      username: process.env.SMTP_USER || "",
      password: process.env.SMTP_PASS || "",
      secure: process.env.SMTP_SECURE === "true",
      senderName: "CoinCraft Digital Store",
      senderEmail: process.env.SMTP_FROM || "noreply@coincraft.local",
      isConfigured: !!process.env.SMTP_HOST,
    },
  });

  // 3. Email Templates (11 Required Templates)
  const defaultTemplates = [
    {
      type: "WELCOME",
      name: "Welcome Email",
      subject: "Welcome to {{siteName}}, {{username}}!",
      description: "Sent immediately after user completes email verification",
      variablesJson: JSON.stringify(["{{siteName}}", "{{username}}", "{{email}}", "{{loginUrl}}"]),
      htmlBody: `
<div style="font-family: Arial, sans-serif; background-color: #0b0d13; color: #e2e8f0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #12151f; border: 1px solid #1f2433; border-radius: 12px; padding: 32px;">
    <h2 style="color: #fbbf24; margin-top: 0;">Welcome to {{siteName}}, {{username}}! 🎉</h2>
    <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">Your email (<strong>{{email}}</strong>) has been successfully verified. Your digital coin wallet is now active.</p>
    <div style="background-color: #1a1e2d; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #fbbf24;">
      <p style="margin: 0; color: #f1f5f9; font-weight: 600;">How to get started:</p>
      <ul style="color: #94a3b8; margin: 8px 0 0 16px; padding: 0; font-size: 14px;">
        <li>Earn coins effortlessly using AFK Mode or Link Tasks</li>
        <li>Purchase coins instantly via Razorpay or UPI</li>
        <li>Redeem digital games, gift cards, and subscriptions in the Shop</li>
      </ul>
    </div>
    <div style="text-align: center; margin-top: 30px;">
      <a href="{{loginUrl}}" style="background-color: #f59e0b; color: #000; padding: 12px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">Go to Your Dashboard</a>
    </div>
  </div>
</div>`,
    },
    {
      type: "OTP_VERIFY",
      name: "Registration OTP Verification",
      subject: "{{otp}} is your verification code for {{siteName}}",
      description: "Sent during user registration with a 6-digit expiring OTP code",
      variablesJson: JSON.stringify(["{{siteName}}", "{{username}}", "{{otp}}", "{{expiresMinutes}}"]),
      htmlBody: `
<div style="font-family: Arial, sans-serif; background-color: #0b0d13; color: #e2e8f0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #12151f; border: 1px solid #1f2433; border-radius: 12px; padding: 32px;">
    <h2 style="color: #fbbf24; margin-top: 0;">Verify Your Email Address</h2>
    <p style="color: #94a3b8; font-size: 15px;">Hello {{username}}, please use the one-time code below to verify your account on {{siteName}}.</p>
    <div style="background-color: #1a1e2d; border: 2px dashed #f59e0b; border-radius: 8px; padding: 20px; text-align: center; margin: 28px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #fbbf24;">{{otp}}</span>
    </div>
    <p style="color: #64748b; font-size: 13px;">This code will expire in {{expiresMinutes}} minutes. If you did not create an account on {{siteName}}, you can safely ignore this email.</p>
  </div>
</div>`,
    },
    {
      type: "PASSWORD_RESET",
      name: "Password Reset Request",
      subject: "Reset your {{siteName}} password",
      description: "Sent when a user requests a password reset link",
      variablesJson: JSON.stringify(["{{siteName}}", "{{username}}", "{{resetUrl}}", "{{expiresMinutes}}"]),
      htmlBody: `
<div style="font-family: Arial, sans-serif; background-color: #0b0d13; color: #e2e8f0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #12151f; border: 1px solid #1f2433; border-radius: 12px; padding: 32px;">
    <h2 style="color: #fbbf24; margin-top: 0;">Password Reset Request</h2>
    <p style="color: #94a3b8; font-size: 15px;">Hello {{username}}, we received a request to reset your password. Click the secure link below to set a new password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{resetUrl}}" style="background-color: #f59e0b; color: #000; padding: 12px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">Reset Password</a>
    </div>
    <p style="color: #64748b; font-size: 13px;">This link is valid for {{expiresMinutes}} minutes and can only be used once. If you did not request this, please change your password immediately.</p>
  </div>
</div>`,
    },
    {
      type: "PASSWORD_CHANGED",
      name: "Password Changed Alert",
      subject: "Security Alert: Password Changed on {{siteName}}",
      description: "Sent immediately when user successfully updates their password",
      variablesJson: JSON.stringify(["{{siteName}}", "{{username}}", "{{date}}"]),
      htmlBody: `
<div style="font-family: Arial, sans-serif; background-color: #0b0d13; color: #e2e8f0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #12151f; border: 1px solid #1f2433; border-radius: 12px; padding: 32px;">
    <h2 style="color: #ef4444; margin-top: 0;">Password Changed Notice</h2>
    <p style="color: #94a3b8; font-size: 15px;">Hello {{username}}, the password for your {{siteName}} account was successfully updated on {{date}}.</p>
    <div style="background-color: #1a1e2d; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="color: #f1f5f9; margin: 0; font-size: 14px;">If you made this change, no further action is required. If you did not authorize this change, please contact support right away.</p>
    </div>
  </div>
</div>`,
    },
    {
      type: "ORDER_DELIVERED",
      name: "Order Confirmation & Digital Delivery",
      subject: "Order {{orderNumber}} Delivered - {{siteName}}",
      description: "Sent to the user when digital product delivery is fulfilled by admin",
      variablesJson: JSON.stringify(["{{siteName}}", "{{username}}", "{{orderNumber}}", "{{totalCoins}}", "{{digitalContent}}", "{{orderDetailsUrl}}"]),
      htmlBody: `
<div style="font-family: Arial, sans-serif; background-color: #0b0d13; color: #e2e8f0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #12151f; border: 1px solid #1f2433; border-radius: 12px; padding: 32px;">
    <h2 style="color: #10b981; margin-top: 0;">Order Delivered! 🎁</h2>
    <p style="color: #94a3b8; font-size: 15px;">Hello {{username}}, your order <strong>#{{orderNumber}}</strong> (Total: {{totalCoins}} coins) has been fulfilled and delivered.</p>
    <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #fbbf24; font-weight: bold; margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase;">Digital Delivery Key / Code:</p>
      <pre style="background-color: #1e293b; color: #38bdf8; padding: 12px; border-radius: 6px; font-size: 15px; margin: 0; word-break: break-all; white-space: pre-wrap;">{{digitalContent}}</pre>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="{{orderDetailsUrl}}" style="background-color: #f59e0b; color: #000; padding: 12px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">View in Your Account</a>
    </div>
  </div>
</div>`,
    },
    {
      type: "ORDER_DECLINED",
      name: "Order Declined & Coins Refunded",
      subject: "Update on Order {{orderNumber}} - Refunded",
      description: "Sent when admin declines an order, with reason and automatic coin refund details",
      variablesJson: JSON.stringify(["{{siteName}}", "{{username}}", "{{orderNumber}}", "{{refundCoins}}", "{{declineReason}}", "{{accountUrl}}"]),
      htmlBody: `
<div style="font-family: Arial, sans-serif; background-color: #0b0d13; color: #e2e8f0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #12151f; border: 1px solid #1f2433; border-radius: 12px; padding: 32px;">
    <h2 style="color: #f59e0b; margin-top: 0;">Order Declined & Refunded</h2>
    <p style="color: #94a3b8; font-size: 15px;">Hello {{username}}, unfortunately your order <strong>#{{orderNumber}}</strong> could not be fulfilled at this time.</p>
    <div style="background-color: #1a1e2d; border-left: 4px solid #ef4444; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <p style="color: #94a3b8; font-size: 13px; margin: 0 0 4px 0;">Reason provided by administrator:</p>
      <p style="color: #f87171; font-weight: 600; margin: 0;">{{declineReason}}</p>
    </div>
    <p style="color: #10b981; font-weight: 600;">✓ {{refundCoins}} coins have been automatically refunded to your wallet.</p>
    <div style="text-align: center; margin-top: 24px;">
      <a href="{{accountUrl}}" style="background-color: #f59e0b; color: #000; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">Check Wallet Balance</a>
    </div>
  </div>
</div>`,
    },
    {
      type: "ACCOUNT_SUSPENDED",
      name: "Account Suspended Notification",
      subject: "Account Notice: Your account on {{siteName}} has been suspended",
      description: "Sent when an administrator suspends a user account",
      variablesJson: JSON.stringify(["{{siteName}}", "{{username}}", "{{suspensionReason}}", "{{supportEmail}}"]),
      htmlBody: `
<div style="font-family: Arial, sans-serif; background-color: #0b0d13; color: #e2e8f0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #12151f; border: 1px solid #1f2433; border-radius: 12px; padding: 32px;">
    <h2 style="color: #ef4444; margin-top: 0;">Account Suspension Notice</h2>
    <p style="color: #94a3b8; font-size: 15px;">Hello {{username}}, your account on {{siteName}} has been suspended by an administrator.</p>
    <div style="background-color: #1a1e2d; border-left: 4px solid #ef4444; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <p style="color: #94a3b8; font-size: 13px; margin: 0 0 4px 0;">Reason for suspension:</p>
      <p style="color: #f87171; font-weight: 600; margin: 0;">{{suspensionReason}}</p>
    </div>
    <p style="color: #64748b; font-size: 14px;">While suspended, access to shopping, earning, and purchases is restricted. If you believe this is in error, contact support at <strong>{{supportEmail}}</strong>.</p>
  </div>
</div>`,
    },
    {
      type: "ACCOUNT_UNSUSPENDED",
      name: "Account Unsuspended Notification",
      subject: "Account Reinstated on {{siteName}}",
      description: "Sent when an administrator restores access to a suspended account",
      variablesJson: JSON.stringify(["{{siteName}}", "{{username}}", "{{loginUrl}}"]),
      htmlBody: `
<div style="font-family: Arial, sans-serif; background-color: #0b0d13; color: #e2e8f0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #12151f; border: 1px solid #1f2433; border-radius: 12px; padding: 32px;">
    <h2 style="color: #10b981; margin-top: 0;">Account Reinstated 🎉</h2>
    <p style="color: #94a3b8; font-size: 15px;">Hello {{username}}, your account suspension on {{siteName}} has been lifted. You can now log in and resume using all features normally.</p>
    <div style="text-align: center; margin-top: 28px;">
      <a href="{{loginUrl}}" style="background-color: #f59e0b; color: #000; padding: 12px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">Log In Now</a>
    </div>
  </div>
</div>`,
    },
    {
      type: "COIN_PURCHASE_SUCCESS",
      name: "Coin Purchase Confirmation",
      subject: "Payment Confirmed: {{coinsEarned}} coins added to {{siteName}} wallet",
      description: "Sent when Razorpay payment or approved manual payment succeeds",
      variablesJson: JSON.stringify(["{{siteName}}", "{{username}}", "{{coinsEarned}}", "{{amountInr}}", "{{referenceId}}", "{{newBalance}}"]),
      htmlBody: `
<div style="font-family: Arial, sans-serif; background-color: #0b0d13; color: #e2e8f0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #12151f; border: 1px solid #1f2433; border-radius: 12px; padding: 32px;">
    <h2 style="color: #fbbf24; margin-top: 0;">Coins Credited! 🪙</h2>
    <p style="color: #94a3b8; font-size: 15px;">Hello {{username}}, your purchase was successful. Coins have been credited to your balance.</p>
    <div style="background-color: #1a1e2d; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 4px 0; color: #94a3b8; font-size: 14px;">Amount Paid: <strong style="color: #f1f5f9;">₹{{amountInr}}</strong></p>
      <p style="margin: 4px 0; color: #94a3b8; font-size: 14px;">Coins Added: <strong style="color: #fbbf24;">+{{coinsEarned}} coins</strong></p>
      <p style="margin: 4px 0; color: #94a3b8; font-size: 14px;">Transaction Ref: <strong style="color: #f1f5f9;">{{referenceId}}</strong></p>
      <p style="margin: 4px 0; color: #94a3b8; font-size: 14px;">Current Balance: <strong style="color: #38bdf8;">{{newBalance}} coins</strong></p>
    </div>
  </div>
</div>`,
    },
    {
      type: "MANUAL_PAYMENT_STATUS",
      name: "Manual Payment Status Update",
      subject: "Payment Request {{referenceId}} Status: {{status}}",
      description: "Sent when an administrator approves or rejects a manual payment request",
      variablesJson: JSON.stringify(["{{siteName}}", "{{username}}", "{{referenceId}}", "{{status}}", "{{coins}}", "{{adminNote}}"]),
      htmlBody: `
<div style="font-family: Arial, sans-serif; background-color: #0b0d13; color: #e2e8f0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #12151f; border: 1px solid #1f2433; border-radius: 12px; padding: 32px;">
    <h2 style="color: #fbbf24; margin-top: 0;">Manual Payment {{status}}</h2>
    <p style="color: #94a3b8; font-size: 15px;">Hello {{username}}, your manual payment request <strong>{{referenceId}}</strong> has been reviewed.</p>
    <div style="background-color: #1a1e2d; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 4px 0; color: #94a3b8; font-size: 14px;">Status: <strong style="color: #f1f5f9;">{{status}}</strong></p>
      <p style="margin: 4px 0; color: #94a3b8; font-size: 14px;">Coins: <strong style="color: #fbbf24;">{{coins}} coins</strong></p>
      <p style="margin: 4px 0; color: #94a3b8; font-size: 14px;">Admin Note: <strong style="color: #f1f5f9;">{{adminNote}}</strong></p>
    </div>
  </div>
</div>`,
    },
    {
      type: "PAYMENT_FAILED",
      name: "Payment Failure Notice",
      subject: "Payment Attempt Failed - {{siteName}}",
      description: "Sent when a payment session fails or is marked as declined",
      variablesJson: JSON.stringify(["{{siteName}}", "{{username}}", "{{referenceId}}", "{{reason}}", "{{purchaseUrl}}"]),
      htmlBody: `
<div style="font-family: Arial, sans-serif; background-color: #0b0d13; color: #e2e8f0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #12151f; border: 1px solid #1f2433; border-radius: 12px; padding: 32px;">
    <h2 style="color: #ef4444; margin-top: 0;">Payment Incomplete</h2>
    <p style="color: #94a3b8; font-size: 15px;">Hello {{username}}, your payment attempt <strong>{{referenceId}}</strong> was not completed or failed.</p>
    <p style="color: #94a3b8; font-size: 14px;">Details: {{reason}}</p>
    <p style="color: #64748b; font-size: 13px;">No coins were debited or added. If money was deducted from your bank, it should be automatically refunded within 3-5 business days.</p>
    <div style="text-align: center; margin-top: 24px;">
      <a href="{{purchaseUrl}}" style="background-color: #f59e0b; color: #000; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">Try Again</a>
    </div>
  </div>
</div>`,
    },
  ];

  for (const tpl of defaultTemplates) {
    await prisma.emailTemplate.upsert({
      where: { type: tpl.type },
      update: {},
      create: tpl,
    });
  }

  // 4. Product Categories
  const catGaming = await prisma.productCategory.upsert({
    where: { slug: "gaming-redeem-codes" },
    update: {},
    create: {
      name: "Gaming Redeem Codes",
      slug: "gaming-redeem-codes",
      icon: "Gamepad2",
    },
  });

  const catGiftCards = await prisma.productCategory.upsert({
    where: { slug: "gift-cards" },
    update: {},
    create: {
      name: "Digital Gift Cards",
      slug: "gift-cards",
      icon: "Gift",
    },
  });

  const catSubscriptions = await prisma.productCategory.upsert({
    where: { slug: "subscriptions" },
    update: {},
    create: {
      name: "Subscriptions & Memberships",
      slug: "subscriptions",
      icon: "Sparkles",
    },
  });

  // 5. Digital Products
  const products = [
    {
      name: "Minecraft: Java & Bedrock Edition Code",
      slug: "minecraft-java-bedrock-edition-code",
      shortDesc: "Official 25-character digital code for Minecraft PC (Java & Bedrock bundle).",
      fullDesc:
        "Redeemable on Microsoft Store / Minecraft.net. Includes both Java and Bedrock editions for PC with full multiplayer and modding capabilities. Instant digital fulfillment upon admin confirmation.",
      categoryId: catGaming.id,
      coinPrice: 350,
      isAvailable: true,
      stockQuantity: 25,
      image: "minecraft",
      deliveryInstructions:
        "Redeem at https://www.minecraft.net/redeem with your Microsoft account.",
    },
    {
      name: "Google Play Gift Card ₹100",
      slug: "google-play-gift-card-100",
      shortDesc: "₹100 digital code for Indian Google Play Store balance.",
      fullDesc:
        "Use this digital gift card to purchase apps, games, movies, and in-app currency on the Google Play Store (India). Verified 16-digit redeem code delivered securely to your account.",
      categoryId: catGiftCards.id,
      coinPrice: 1000,
      isAvailable: true,
      stockQuantity: 50,
      image: "googleplay",
      deliveryInstructions:
        "Open Google Play Store -> Profile icon -> Payments & subscriptions -> Redeem gift code.",
    },
    {
      name: "Google Play Gift Card ₹500",
      slug: "google-play-gift-card-500",
      shortDesc: "₹500 digital code for Indian Google Play Store balance.",
      fullDesc:
        "Top up your Play Store account with ₹500 to buy premium games, books, or in-app items. Delivered instantly to your verified account.",
      categoryId: catGiftCards.id,
      coinPrice: 4900,
      isAvailable: true,
      stockQuantity: 30,
      image: "googleplay",
      deliveryInstructions:
        "Open Google Play Store -> Profile icon -> Payments & subscriptions -> Redeem code.",
    },
    {
      name: "Steam Wallet Digital Code ₹250",
      slug: "steam-wallet-code-250",
      shortDesc: "Add ₹250 wallet funds to any Indian Steam account.",
      fullDesc:
        "Purchase games, DLCs, and community market items on Steam. Redeemable directly in the Steam client or browser.",
      categoryId: catGaming.id,
      coinPrice: 2500,
      isAvailable: true,
      stockQuantity: 40,
      image: "steam",
      deliveryInstructions:
        "Go to store.steampowered.com/account/redeemwalletcode and enter your code.",
    },
    {
      name: "Discord Nitro 1 Month Code",
      slug: "discord-nitro-1-month",
      shortDesc: "Unlock HD streaming, 500MB uploads, custom emojis, and 2 Server Boosts.",
      fullDesc:
        "Full 1-Month Discord Nitro subscription code. Compatible with any valid Discord account not currently on an active Nitro tier.",
      categoryId: catSubscriptions.id,
      coinPrice: 990,
      isAvailable: true,
      stockQuantity: 15,
      image: "discord",
      deliveryInstructions:
        "Redeem via Discord Settings -> Gift Inventory or promo activation link.",
    },
    {
      name: "Spotify Premium 3 Months Voucher",
      slug: "spotify-premium-3-months",
      shortDesc: "Ad-free music listening, offline downloads, and unlimited skips.",
      fullDesc:
        "Individual 3-month Spotify Premium redeem key. Listen to millions of songs with ultra-high audio quality on all your devices.",
      categoryId: catSubscriptions.id,
      coinPrice: 1200,
      isAvailable: true,
      stockQuantity: 20,
      image: "spotify",
      deliveryInstructions:
        "Visit spotify.com/redeem and enter the PIN.",
    },
    {
      name: "Roblox 800 Robux Digital Card",
      slug: "roblox-800-robux-code",
      shortDesc: "800 Robux digital card for avatars, accessories, and game passes.",
      fullDesc:
        "Redeemable on Roblox.com for 800 Robux or virtual credit. Instant delivery to your account upon confirmation.",
      categoryId: catGaming.id,
      coinPrice: 850,
      isAvailable: true,
      stockQuantity: 18,
      image: "roblox",
      deliveryInstructions:
        "Log into roblox.com/redeem and input your PIN.",
    },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: prod,
    });
  }

  // 6. Earning Tasks
  const tasks = [
    {
      title: "Explore Daily Gaming Deals & News",
      description: "Visit our curated gaming deals partner page and spend at least 15 seconds browsing.",
      linkUrl: "https://deals.partner-network.example/gaming-specials",
      rewardCoins: 2,
      isActive: true,
    },
    {
      title: "Check Today's Community Announcements",
      description: "Read our community changelog and patch notes to stay up to date with updates.",
      linkUrl: "https://announcements.partner-network.example/patch-notes",
      rewardCoins: 2,
      isActive: true,
    },
    {
      title: "Complete Partner Daily Trivia Challenge",
      description: "Visit the partner trivia portal and check out today's interactive game quiz.",
      linkUrl: "https://trivia.partner-network.example/daily-challenge",
      rewardCoins: 2,
      isActive: true,
    },
    {
      title: "Browse Featured Digital App Showcase",
      description: "Discover new featured indie mobile and PC games from our developer partners.",
      linkUrl: "https://showcase.partner-network.example/indie-apps",
      rewardCoins: 2,
      isActive: true,
    },
  ];

  for (const task of tasks) {
    const existing = await prisma.earningTask.findFirst({
      where: { title: task.title },
    });
    if (!existing) {
      await prisma.earningTask.create({ data: task });
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
