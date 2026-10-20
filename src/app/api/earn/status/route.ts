import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getTodayDateString } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const settings = await prisma.websiteSettings.findUnique({
      where: { id: "default" },
    });

    const isMaintenance =
      settings?.globalMaintenance || settings?.earningMaintenance || false;

    const todayDate = getTodayDateString(settings?.timezone || "Asia/Kolkata");

    // Fetch tasks
    const tasks = await prisma.earningTask.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    // Fetch user's task completions today
    const completionsToday = await prisma.taskCompletion.findMany({
      where: {
        userId: auth.user.id,
        completedDate: todayDate,
      },
    });

    const completedTaskIds = completionsToday.map((c) => c.taskId);
    const linkCoinsEarnedToday = completionsToday.reduce((sum, c) => sum + c.coinsEarned, 0);
    const linkDailyMax = settings?.linkDailyMaxCoins || 40;
    const linkRemaining = Math.max(0, linkDailyMax - linkCoinsEarnedToday);

    // Fetch AFK sessions today
    const afkSessionsToday = await prisma.afkSession.findMany({
      where: {
        userId: auth.user.id,
        sessionDate: todayDate,
      },
    });

    const afkCoinsEarnedToday = afkSessionsToday.reduce((sum, s) => sum + s.coinsEarned, 0);
    const afkDailyMax = settings?.afkDailyMaxCoins || 20;
    const afkRemaining = Math.max(0, afkDailyMax - afkCoinsEarnedToday);

    // Find any currently active AFK session
    const activeSession = afkSessionsToday.find((s) => s.isActive);

    return NextResponse.json({
      isMaintenance,
      timezone: settings?.timezone || "Asia/Kolkata",
      todayDate,
      userBalance: auth.user.coinBalance,
      afkEarningEnabled: settings?.afkEarningEnabled ?? true,
      linkEarningEnabled: settings?.linkEarningEnabled ?? true,
      link: {
        rewardPerLink: settings?.linkRewardCoins || 2,
        dailyMax: linkDailyMax,
        earnedToday: linkCoinsEarnedToday,
        remainingAllowance: linkRemaining,
        completedTaskIds,
        tasks: tasks.map((t) => ({
          ...t,
          isCompletedToday: completedTaskIds.includes(t.id),
        })),
      },
      afk: {
        coinsPerMinute: settings?.afkCoinsPerMinute || 1,
        dailyMax: afkDailyMax,
        earnedToday: afkCoinsEarnedToday,
        remainingAllowance: afkRemaining,
        activeSession: activeSession
          ? {
              id: activeSession.id,
              minutesElapsed: activeSession.minutesElapsed,
              coinsEarned: activeSession.coinsEarned,
              startedAt: activeSession.startedAt,
              lastHeartbeatAt: activeSession.lastHeartbeatAt,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("Earn status error:", error);
    return NextResponse.json({ error: "Failed to load earning status" }, { status: 500 });
  }
}
