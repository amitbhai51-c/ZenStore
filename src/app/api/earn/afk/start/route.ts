import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getTodayDateString } from "@/lib/date";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const settings = await prisma.websiteSettings.findUnique({
      where: { id: "default" },
    });

    if (settings?.globalMaintenance || settings?.earningMaintenance) {
      return NextResponse.json(
        { error: "AFK earning is currently in maintenance mode." },
        { status: 503 }
      );
    }

    if (settings?.afkEarningEnabled === false) {
      return NextResponse.json(
        { error: "AFK earning is currently disabled by the administrator." },
        { status: 403 }
      );
    }

    const todayDate = getTodayDateString(settings?.timezone || "Asia/Kolkata");
    const afkDailyMax = settings?.afkDailyMaxCoins || 20;

    // Check today's accumulated AFK earnings
    const todaySessions = await prisma.afkSession.findMany({
      where: { userId: auth.user.id, sessionDate: todayDate },
    });

    const totalEarnedToday = todaySessions.reduce((sum, s) => sum + s.coinsEarned, 0);
    if (totalEarnedToday >= afkDailyMax) {
      return NextResponse.json(
        { error: `You have reached your daily AFK limit of ${afkDailyMax} coins.` },
        { status: 400 }
      );
    }

    const now = new Date();

    // End any existing stale active sessions for this user
    await prisma.afkSession.updateMany({
      where: { userId: auth.user.id, isActive: true },
      data: { isActive: false, endedAt: now },
    });

    // Create fresh active session
    const session = await prisma.afkSession.create({
      data: {
        userId: auth.user.id,
        startedAt: now,
        lastHeartbeatAt: now,
        minutesElapsed: 0,
        coinsEarned: 0,
        sessionDate: todayDate,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      coinsPerMinute: settings?.afkCoinsPerMinute || 1,
      dailyMax: afkDailyMax,
      earnedToday: totalEarnedToday,
      remainingAllowance: afkDailyMax - totalEarnedToday,
      heartbeatIntervalSeconds: 60,
    });
  } catch (error: any) {
    console.error("AFK start error:", error);
    return NextResponse.json({ error: "Failed to start AFK session" }, { status: 500 });
  }
}
