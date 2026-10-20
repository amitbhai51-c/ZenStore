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

    const settings = await prisma.websiteSettings.findUnique({
      where: { id: "default" },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const body = await req.json();

    const updated = await prisma.websiteSettings.upsert({
      where: { id: "default" },
      update: {
        siteName: body.siteName !== undefined ? body.siteName.trim() : undefined,
        tagline: body.tagline !== undefined ? body.tagline.trim() : undefined,
        logoUrl: body.logoUrl !== undefined ? body.logoUrl.trim() : undefined,
        faviconUrl: body.faviconUrl !== undefined ? body.faviconUrl.trim() : undefined,
        contactEmail: body.contactEmail !== undefined ? body.contactEmail.trim() : undefined,
        supportInfo: body.supportInfo !== undefined ? body.supportInfo.trim() : undefined,
        footerText: body.footerText !== undefined ? body.footerText.trim() : undefined,
        timezone: body.timezone || undefined,
        globalMaintenance: body.globalMaintenance !== undefined ? Boolean(body.globalMaintenance) : undefined,
        earningMaintenance: body.earningMaintenance !== undefined ? Boolean(body.earningMaintenance) : undefined,
        purchaseMaintenance: body.purchaseMaintenance !== undefined ? Boolean(body.purchaseMaintenance) : undefined,
        linkRewardCoins: body.linkRewardCoins !== undefined ? parseInt(body.linkRewardCoins, 10) : undefined,
        linkDailyMaxCoins: body.linkDailyMaxCoins !== undefined ? parseInt(body.linkDailyMaxCoins, 10) : undefined,
        afkCoinsPerMinute: body.afkCoinsPerMinute !== undefined ? parseInt(body.afkCoinsPerMinute, 10) : undefined,
        afkDailyMaxCoins: body.afkDailyMaxCoins !== undefined ? parseInt(body.afkDailyMaxCoins, 10) : undefined,
        coinExchangeRateInr: body.coinExchangeRateInr !== undefined ? parseInt(body.coinExchangeRateInr, 10) : undefined,
        manualPaymentUrl: body.manualPaymentUrl !== undefined ? body.manualPaymentUrl.trim() : undefined,
        manualPaymentInstructions:
          body.manualPaymentInstructions !== undefined ? body.manualPaymentInstructions.trim() : undefined,
      },
      create: {
        id: "default",
        siteName: body.siteName || "CoinCraft",
        contactEmail: body.contactEmail || "support@coincraft.local",
        ...body,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.user.id,
        action: "UPDATE_SETTINGS",
        targetType: "SETTING",
        targetId: "default",
        details: JSON.stringify(body),
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update settings" }, { status: 500 });
  }
}
