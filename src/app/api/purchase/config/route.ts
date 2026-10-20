import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const settings = await prisma.websiteSettings.findUnique({
      where: { id: "default" },
    });

    const isMaintenance =
      settings?.globalMaintenance || settings?.purchaseMaintenance || false;

    const rate = settings?.coinExchangeRateInr || 10; // 10 coins = ₹1

    // Fetch user payment history
    const history = await prisma.paymentRequest.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";
    const isRazorpayConfigured = Boolean(
      razorpayKeyId &&
      razorpayKeySecret &&
      !razorpayKeyId.includes("demo123456789")
    );

    return NextResponse.json({
      isMaintenance,
      exchangeRate: rate,
      minCoins: 10,
      razorpayEnabled: settings?.razorpayEnabled ?? true,
      manualPaymentEnabled: settings?.manualPaymentEnabled ?? true,
      isRazorpayConfigured,
      manualPaymentUrl: settings?.manualPaymentUrl || "https://pay.example.com/upi",
      manualPaymentInstructions:
        settings?.manualPaymentInstructions || "Pay the exact amount and enter your 12-digit UTR.",
      razorpayKeyId: isRazorpayConfigured ? razorpayKeyId : "",
      history,
    });
  } catch (error) {
    console.error("Purchase config error:", error);
    return NextResponse.json({ error: "Failed to load purchase configuration" }, { status: 500 });
  }
}
