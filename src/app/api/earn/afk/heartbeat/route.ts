import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { creditCoins } from "@/lib/wallet";
import { getTodayDateString } from "@/lib/date";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
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
    const afkRate = settings?.afkCoinsPerMinute || 1;
    const afkDailyMax = settings?.afkDailyMaxCoins || 20;

    const session = await prisma.afkSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== auth.user.id || !session.isActive) {
      return NextResponse.json(
        { error: "Session is no longer active. Please start a new AFK session." },
        { status: 400 }
      );
    }

    const now = new Date();
    const elapsedSeconds = (now.getTime() - new Date(session.lastHeartbeatAt).getTime()) / 1000;

    // Verify heartbeat interval (minimum 50 seconds to prevent clock tampering or rapid spam)
    if (elapsedSeconds < 50) {
      return NextResponse.json(
        {
          error: "Heartbeat received too quickly. Wait 60 seconds between heartbeats.",
          nextAllowedIn: Math.ceil(50 - elapsedSeconds),
        },
        { status: 429 }
      );
    }

    // Check today's total AFK earnings across all sessions
    const todaySessions = await prisma.afkSession.findMany({
      where: { userId: auth.user.id, sessionDate: todayDate },
    });

    const totalEarnedToday = todaySessions.reduce((sum, s) => sum + s.coinsEarned, 0);

    if (totalEarnedToday >= afkDailyMax) {
      // Mark session finished
      await prisma.afkSession.update({
        where: { id: session.id },
        data: { isActive: false, endedAt: now },
      });

      return NextResponse.json({
        success: false,
        dailyLimitReached: true,
        message: `You have reached the maximum daily AFK limit of ${afkDailyMax} coins!`,
        earnedToday: totalEarnedToday,
        remainingAllowance: 0,
      });
    }

    // Award 1 interval of coins atomically
    const result = await prisma.$transaction(async (tx) => {
      const updatedSession = await tx.afkSession.update({
        where: { id: session.id },
        data: {
          lastHeartbeatAt: now,
          minutesElapsed: session.minutesElapsed + 1,
          coinsEarned: session.coinsEarned + afkRate,
        },
      });

      const creditResult = await creditCoins({
        userId: auth.user.id,
        amount: afkRate,
        type: "EARNING_AFK",
        referenceId: `AFK-${session.id}`,
        description: `AFK idle reward (Minute #${updatedSession.minutesElapsed})`,
        tx,
      });

      return {
        updatedSession,
        newBalance: creditResult.balanceAfter,
      };
    });

    const newTotalToday = totalEarnedToday + afkRate;
    const remainingAllowance = Math.max(0, afkDailyMax - newTotalToday);

    return NextResponse.json({
      success: true,
      coinsAwarded: afkRate,
      sessionMinutes: result.updatedSession.minutesElapsed,
      sessionCoins: result.updatedSession.coinsEarned,
      newBalance: result.newBalance,
      earnedToday: newTotalToday,
      remainingAllowance,
      dailyLimitReached: remainingAllowance <= 0,
    });
  } catch (error: any) {
    console.error("AFK heartbeat error:", error);
    return NextResponse.json({ error: "Failed to process AFK heartbeat" }, { status: 500 });
  }
}
