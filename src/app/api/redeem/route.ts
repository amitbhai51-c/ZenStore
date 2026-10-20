import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { creditCoins } from "@/lib/wallet";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { code } = await req.json();

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json(
        { error: "Please enter a valid redeem code." },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check code in database inside transaction to avoid race conditions
    const result = await prisma.$transaction(async (tx) => {
      const redeemCode = await tx.redeemCode.findUnique({
        where: { code: normalizedCode },
      });

      if (!redeemCode || !redeemCode.isActive) {
        throw new Error("Invalid or inactive redeem code.");
      }

      // Check expiration date
      if (redeemCode.expiresAt && new Date() > new Date(redeemCode.expiresAt)) {
        throw new Error("This redeem code has expired.");
      }

      // Check max uses limit (0 means unlimited)
      if (redeemCode.maxUses > 0 && redeemCode.timesRedeemed >= redeemCode.maxUses) {
        throw new Error("This redeem code has reached its maximum redemption limit.");
      }

      // Check if user has already redeemed this code
      const alreadyUsed = await tx.redeemCodeUsage.findUnique({
        where: {
          codeId_userId: {
            codeId: redeemCode.id,
            userId: auth.user.id,
          },
        },
      });

      if (alreadyUsed) {
        throw new Error("You have already redeemed this code.");
      }

      // Record usage
      await tx.redeemCodeUsage.create({
        data: {
          codeId: redeemCode.id,
          userId: auth.user.id,
          coinsAwarded: redeemCode.coinAmount,
        },
      });

      // Increment timesRedeemed
      await tx.redeemCode.update({
        where: { id: redeemCode.id },
        data: {
          timesRedeemed: { increment: 1 },
        },
      });

      // Credit coins atomically to user's wallet
      const creditRes = await creditCoins({
        userId: auth.user.id,
        amount: redeemCode.coinAmount,
        type: "REDEEM_CODE",
        referenceId: redeemCode.code,
        description: `Redeemed promo code: ${redeemCode.code}`,
        tx,
      });

      return {
        code: redeemCode.code,
        coinsAwarded: redeemCode.coinAmount,
        newBalance: creditRes.balanceAfter,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Success! Code "${result.code}" redeemed. +${result.coinsAwarded} coins added to your wallet!`,
      coinsAwarded: result.coinsAwarded,
      newBalance: result.newBalance,
    });
  } catch (error: any) {
    console.error("Redeem code error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to redeem code" },
      { status: 400 }
    );
  }
}
