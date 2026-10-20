import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getTodayDateString } from "@/lib/date";
import crypto from "crypto";

const TASK_SECRET = process.env.JWT_SECRET || "task_verification_key_coincraft";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { taskId } = await req.json();
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const settings = await prisma.websiteSettings.findUnique({
      where: { id: "default" },
    });

    if (settings?.globalMaintenance || settings?.earningMaintenance) {
      return NextResponse.json(
        { error: "Coin earning is currently undergoing maintenance. Please check back soon." },
        { status: 503 }
      );
    }

    const task = await prisma.earningTask.findUnique({
      where: { id: taskId },
    });

    if (!task || !task.isActive) {
      return NextResponse.json({ error: "Task not found or inactive" }, { status: 404 });
    }

    const todayDate = getTodayDateString(settings?.timezone || "Asia/Kolkata");

    // Check if task already completed today
    const alreadyDone = await prisma.taskCompletion.findUnique({
      where: {
        userId_taskId_completedDate: {
          userId: auth.user.id,
          taskId: task.id,
          completedDate: todayDate,
        },
      },
    });

    if (alreadyDone) {
      return NextResponse.json(
        { error: "You have already completed this task today. Please try again tomorrow." },
        { status: 400 }
      );
    }

    // Check daily allowance
    const completionsToday = await prisma.taskCompletion.findMany({
      where: { userId: auth.user.id, completedDate: todayDate },
    });
    const linkCoinsEarnedToday = completionsToday.reduce((sum, c) => sum + c.coinsEarned, 0);
    const linkDailyMax = settings?.linkDailyMaxCoins || 40;

    if (linkCoinsEarnedToday >= linkDailyMax) {
      return NextResponse.json(
        { error: `You have reached your daily maximum of ${linkDailyMax} task coins.` },
        { status: 400 }
      );
    }

    // Issue cryptographically signed task session token
    const timestamp = Date.now();
    const payload = `${auth.user.id}:${task.id}:${timestamp}`;
    const signature = crypto.createHmac("sha256", TASK_SECRET).update(payload).digest("hex");
    const sessionToken = `${payload}:${signature}`;

    return NextResponse.json({
      success: true,
      taskId: task.id,
      title: task.title,
      linkUrl: task.linkUrl,
      rewardCoins: settings?.linkRewardCoins || task.rewardCoins,
      requiredSeconds: 15,
      sessionToken,
    });
  } catch (error: any) {
    console.error("Task init error:", error);
    return NextResponse.json({ error: "Failed to initialize task" }, { status: 500 });
  }
}
