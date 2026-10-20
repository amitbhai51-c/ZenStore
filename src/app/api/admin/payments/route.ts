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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";

    const where: any = {};
    if (status !== "all") {
      where.status = status;
    }

    const payments = await prisma.paymentRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, username: true, coinBalance: true } },
      },
      take: 100,
    });

    return NextResponse.json({ payments });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load payments" }, { status: 500 });
  }
}
