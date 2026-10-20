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

    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load contact messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { messageId, status, adminReply } = await req.json();

    if (!messageId || !status) {
      return NextResponse.json({ error: "Missing message ID or status" }, { status: 400 });
    }

    const updated = await prisma.contactMessage.update({
      where: { id: messageId },
      data: {
        status,
        adminReply: adminReply || undefined,
      },
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update contact message" }, { status: 500 });
  }
}
