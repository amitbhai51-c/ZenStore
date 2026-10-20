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

    const tasks = await prisma.earningTask.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { completions: true },
        },
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { title, description, linkUrl, rewardCoins, isActive } = await req.json();

    if (!title || !linkUrl) {
      return NextResponse.json(
        { error: "Task title and link URL are required." },
        { status: 400 }
      );
    }

    const task = await prisma.earningTask.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        linkUrl: linkUrl.trim(),
        rewardCoins: parseInt(rewardCoins, 10) || 2,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.user.id,
        action: "CREATE_TASK",
        targetType: "TASK",
        targetId: task.id,
        details: JSON.stringify(task),
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create task" },
      { status: 500 }
    );
  }
}
