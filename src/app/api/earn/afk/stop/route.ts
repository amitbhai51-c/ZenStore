import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { sessionId } = await req.json();

    if (sessionId) {
      await prisma.afkSession.updateMany({
        where: { id: sessionId, userId: auth.user.id },
        data: { isActive: false, endedAt: new Date() },
      });
    } else {
      await prisma.afkSession.updateMany({
        where: { userId: auth.user.id, isActive: true },
        data: { isActive: false, endedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true, message: "AFK session stopped." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to stop session" }, { status: 500 });
  }
}
