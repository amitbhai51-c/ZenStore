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
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all";

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { username: { contains: search } },
      ];
    }

    if (filter === "suspended") {
      where.isSuspended = true;
    } else if (filter === "unverified") {
      where.isVerified = false;
    } else if (filter === "admin") {
      where.role = "ADMIN";
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isVerified: true,
        isSuspended: true,
        suspensionReason: true,
        suspendedAt: true,
        coinBalance: true,
        createdAt: true,
        _count: {
          select: { orders: true, transactions: true },
        },
      },
      take: 100,
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
