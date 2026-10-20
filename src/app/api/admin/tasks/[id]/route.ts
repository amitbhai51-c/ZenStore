import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { id } = params;
    const body = await req.json();

    const task = await prisma.earningTask.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title.trim() : undefined,
        description: body.description !== undefined ? body.description.trim() : undefined,
        linkUrl: body.linkUrl !== undefined ? body.linkUrl.trim() : undefined,
        rewardCoins: body.rewardCoins !== undefined ? parseInt(body.rewardCoins, 10) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.user.id,
        action: "UPDATE_TASK",
        targetType: "TASK",
        targetId: id,
        details: JSON.stringify(body),
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { id } = params;

    // Delete completions and task
    await prisma.taskCompletion.deleteMany({ where: { taskId: id } });
    await prisma.earningTask.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        adminId: admin.user.id,
        action: "DELETE_TASK",
        targetType: "TASK",
        targetId: id,
        details: JSON.stringify({ deletedTaskId: id }),
      },
    });

    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete task" },
      { status: 500 }
    );
  }
}
