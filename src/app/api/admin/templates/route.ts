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

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load email templates" }, { status: 500 });
  }
}
