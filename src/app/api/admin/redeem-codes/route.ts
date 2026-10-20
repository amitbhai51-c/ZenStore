import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const codes = await prisma.redeemCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { username: true, email: true },
        },
        _count: {
          select: { usages: true },
        },
      },
    });

    return NextResponse.json({ codes });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load redeem codes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { code, coinAmount, maxUses, expiresAt, isActive } = await req.json();

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json({ error: "Redeem code string is required." }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

    const parsedCoins = parseInt(coinAmount, 10);
    if (isNaN(parsedCoins) || parsedCoins <= 0) {
      return NextResponse.json({ error: "Coin amount must be a positive integer." }, { status: 400 });
    }

    // Check if code already exists
    const existing = await prisma.redeemCode.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      return NextResponse.json({ error: "A redeem code with this name already exists." }, { status: 400 });
    }

    const newCode = await prisma.redeemCode.create({
      data: {
        code: normalizedCode,
        coinAmount: parsedCoins,
        maxUses: maxUses !== undefined ? parseInt(maxUses, 10) : 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        createdById: admin.user.id,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        adminId: admin.user.id,
        action: "CREATE_REDEEM_CODE",
        targetType: "REDEEM_CODE",
        targetId: newCode.id,
        details: JSON.stringify({
          code: newCode.code,
          coinAmount: newCode.coinAmount,
          maxUses: newCode.maxUses,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Redeem code "${newCode.code}" for ${newCode.coinAmount} coins created!`,
      code: newCode,
    });
  } catch (error: any) {
    console.error("Create redeem code error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create redeem code" }, { status: 500 });
  }
}
