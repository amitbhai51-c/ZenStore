import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { creditCoins } from "@/lib/wallet";
import { getTodayDateString } from "@/lib/date";
import crypto from "crypto";

const TASK_SECRET = process.env.JWT_SECRET || "task_verification_key_coincraft";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { sessionToken } = await req.json();
    if (!sessionToken || typeof sessionToken !== "string") {
      return NextResponse.json({ error: "Missing or invalid session token" }, { status: 400 });
    }

    const parts = sessionToken.split(":");
    if (parts.length !== 4) {
      return NextResponse.json({ error: "Malformed session token" }, { status: 400 });
    }

    const [userId, taskId, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);

    if (userId !== auth.user.id) {
      return NextResponse.json({ error: "Unauthorized session claim" }, { status: 403 });
    }

    // Verify cryptographic signature
    const payload = `${userId}:${taskId}:${timestamp}`;
    const expectedSignature = crypto.createHmac("sha256", TASK_SECRET).update(payload).digest("hex");
    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid task verification signature" }, { status: 400 });
    }

    // Check minimum required elapsed time (at least 14.5 seconds)
    const elapsedSeconds = (Date.now() - timestamp) / 1000;
    if (elapsedSeconds < 14) {
      return NextResponse.json(
        { error: "Task challenge not completed. Please spend the required time on the partner page." },
        { status: 400 }
      );
    }

    // Token expiration: 10 minutes max
    if (elapsedSeconds > 600) {
      return NextResponse.json(
        { error: "Task session expired. Please restart the task." },
        { status: 400 }
      );
    }

    const settings = await prisma.websiteSettings.findUnique({
      where: { id: "default" },
    });

    if (settings?.globalMaintenance || settings?.earningMaintenance) {
      return NextResponse.json(
        { error: "Coin earning is currently undergoing maintenance." },
        { status: 503 }
      );
    }

    if (settings?.linkEarningEnabled === false) {
      return NextResponse.json(
        { error: "Link earning is currently disabled by the administrator." },
        { status: 403 }
      );
    }

    const task = await prisma.earningTask.findUnique({
      where: { id: taskId },
    });

    if (!task || !task.isActive) {
      return NextResponse.json({ error: "Task is no longer active" }, { status: 404 });
    }

    const todayDate = getTodayDateString(settings?.timezone || "Asia/Kolkata");
    const rewardCoins = settings?.linkRewardCoins || task.rewardCoins;
    const linkDailyMax = settings?.linkDailyMaxCoins || 40;

    // Atomically check daily limit and record completion
    const result = await prisma.$transaction(async (tx) => {
      // Check already completed
      const existing = await tx.taskCompletion.findUnique({
        where: {
          userId_taskId_completedDate: {
            userId: auth.user.id,
            taskId: task.id,
            completedDate: todayDate,
          },
        },
      });

      if (existing) {
        throw new Error("This task has already been claimed today.");
      }

      // Check daily cap
      const completionsToday = await tx.taskCompletion.findMany({
        where: { userId: auth.user.id, completedDate: todayDate },
      });
      const linkCoinsEarnedToday = completionsToday.reduce((sum, c) => sum + c.coinsEarned, 0);

      if (linkCoinsEarnedToday + rewardCoins > linkDailyMax) {
        throw new Error(`Claiming this reward exceeds your daily task allowance of ${linkDailyMax} coins.`);
      }

      // Record completion
      await tx.taskCompletion.create({
        data: {
          userId: auth.user.id,
          taskId: task.id,
          coinsEarned: rewardCoins,
          completedDate: todayDate,
        },
      });

      // Credit wallet
      const creditResult = await creditCoins({
        userId: auth.user.id,
        amount: rewardCoins,
        type: "EARNING_LINK",
        referenceId: `TASK-${task.id}`,
        description: `Completed task: ${task.title}`,
        tx,
      });

      return {
        newBalance: creditResult.balanceAfter,
        earnedCoins: rewardCoins,
        totalEarnedToday: linkCoinsEarnedToday + rewardCoins,
        remainingAllowance: Math.max(0, linkDailyMax - (linkCoinsEarnedToday + rewardCoins)),
      };
    });

    return NextResponse.json({
      success: true,
      message: `Congratulations! +${result.earnedCoins} coins added to your wallet.`,
      newBalance: result.newBalance,
      remainingAllowance: result.remainingAllowance,
      totalEarnedToday: result.totalEarnedToday,
    });
  } catch (error: any) {
    console.error("Task claim error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to claim task reward" },
      { status: 400 }
    );
  }
}
