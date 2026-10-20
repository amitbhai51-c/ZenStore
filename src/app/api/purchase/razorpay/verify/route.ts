import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { verifyRazorpaySignature, getRazorpayKeys } from "@/lib/razorpay";
import { creditCoins } from "@/lib/wallet";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { paymentReference, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      await req.json();

    if (!paymentReference || !razorpayOrderId || !razorpayPaymentId) {
      return NextResponse.json({ error: "Missing required payment parameters" }, { status: 400 });
    }

    // Lookup pending payment record
    const payment = await prisma.paymentRequest.findUnique({
      where: { paymentReference },
      include: { user: true },
    });

    if (!payment || payment.userId !== auth.user.id) {
      return NextResponse.json({ error: "Payment reference not found" }, { status: 404 });
    }

    // Idempotency: if already completed, return existing status
    if (payment.status === "SUCCESS") {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        coinsCredited: payment.coinsAmount,
        message: "Payment was already verified and credited.",
      });
    }

    // Cryptographic signature verification
    let isValid = false;
    if (razorpaySignature) {
      isValid = verifyRazorpaySignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });
    }

    if (!isValid) {
      await prisma.paymentRequest.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          razorpayPaymentId,
          adminNote: "Signature verification failed",
        },
      });

      return NextResponse.json(
        { error: "Payment verification failed. Invalid cryptographic signature." },
        { status: 400 }
      );
    }

    // Atomically credit coins and update payment status
    const result = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.paymentRequest.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          razorpayPaymentId,
          reviewedAt: new Date(),
        },
      });

      const creditResult = await creditCoins({
        userId: payment.userId,
        amount: payment.coinsAmount,
        type: "COIN_PURCHASE",
        referenceId: payment.paymentReference,
        description: `Purchased ${payment.coinsAmount} coins via Razorpay (₹${(payment.amountInrPaise / 100).toFixed(2)})`,
        tx,
      });

      return { updatedPayment, creditResult };
    });

    // Send confirmation email
    await sendEmail({
      to: auth.user.email,
      templateType: "COIN_PURCHASE_SUCCESS",
      variables: {
        username: auth.user.username,
        coinsEarned: payment.coinsAmount,
        amountInr: (payment.amountInrPaise / 100).toFixed(2),
        referenceId: payment.paymentReference,
        newBalance: result.creditResult.balanceAfter,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Payment successful! +${payment.coinsAmount} coins credited to your wallet.`,
      coinsAdded: payment.coinsAmount,
      newBalance: result.creditResult.balanceAfter,
      paymentReference: payment.paymentReference,
    });
  } catch (error: any) {
    console.error("Razorpay verify error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
