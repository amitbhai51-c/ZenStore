import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all";

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { username: { contains: search } },
      ];
    }

    if (filter === "suspended") {
      where.isSuspended = true;
    } else if (filter === "unverified") {
      where.isVerified = false;
    } else if (filter === "admin") {
      where.role = "ADMIN";
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isVerified: true,
        isSuspended: true,
        suspensionReason: true,
        suspendedAt: true,
        coinBalance: true,
        createdAt: true,
        _count: {
          select: { orders: true, transactions: true },
        },
      },
      take: 100,
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { email, username, password, role, isVerified, coinBalance } = await req.json();

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: "Invalid email address format." }, { status: 400 });
    }

    // Validate username format
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return NextResponse.json(
        { error: "Username must be between 3 and 30 characters." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Check if email or username already taken
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanUsername }],
      },
    });

    if (existing) {
      if (existing.email === cleanEmail) {
        return NextResponse.json({ error: "Email is already registered." }, { status: 400 });
      }
      return NextResponse.json({ error: "Username is already taken." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const initialCoins = Math.max(0, parseInt(coinBalance, 10) || 0);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: cleanEmail,
          username: cleanUsername,
          passwordHash,
          role: role === "ADMIN" ? "ADMIN" : "USER",
          isVerified: isVerified !== undefined ? Boolean(isVerified) : true,
          coinBalance: initialCoins,
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isVerified: true,
          isSuspended: true,
          coinBalance: true,
          createdAt: true,
        },
      });

      if (initialCoins > 0) {
        await tx.coinTransaction.create({
          data: {
            userId: newUser.id,
            type: "ADMIN_ADJUSTMENT",
            amount: initialCoins,
            balanceBefore: 0,
            balanceAfter: initialCoins,
            description: `Initial coin allocation by Administrator ${admin.user!.username}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          adminId: admin.user!.id,
          action: "CREATE_USER",
          targetType: "USER",
          targetId: newUser.id,
          details: JSON.stringify({
            createdEmail: cleanEmail,
            createdUsername: cleanUsername,
            role: newUser.role,
            initialCoins,
          }),
        },
      });

      return newUser;
    });

    return NextResponse.json({
      success: true,
      message: `User ${user.username} created successfully.`,
      user,
    });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create user." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { searchParams } = new URL(req.url);
    const body = await req.json();
    const userId = searchParams.get("id") || body.userId || body.id;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updateData: any = {};
    const changes: Record<string, any> = {};

    // 1. Email update
    if (body.email !== undefined && body.email.trim() !== "") {
      const cleanEmail = body.email.trim().toLowerCase();
      if (cleanEmail !== targetUser.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          return NextResponse.json({ error: "Invalid email address format." }, { status: 400 });
        }
        const conflict = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (conflict && conflict.id !== userId) {
          return NextResponse.json({ error: "Email is already taken by another user." }, { status: 400 });
        }
        updateData.email = cleanEmail;
        changes.email = { from: targetUser.email, to: cleanEmail };
      }
    }

    // 2. Username update
    if (body.username !== undefined && body.username.trim() !== "") {
      const cleanUsername = body.username.trim();
      if (cleanUsername !== targetUser.username) {
        if (cleanUsername.length < 3 || cleanUsername.length > 30) {
          return NextResponse.json(
            { error: "Username must be between 3 and 30 characters." },
            { status: 400 }
          );
        }
        const conflict = await prisma.user.findUnique({ where: { username: cleanUsername } });
        if (conflict && conflict.id !== userId) {
          return NextResponse.json({ error: "Username is already taken by another user." }, { status: 400 });
        }
        updateData.username = cleanUsername;
        changes.username = { from: targetUser.username, to: cleanUsername };
      }
    }

    // 3. Password update (if non-empty)
    if (body.password !== undefined && body.password.trim() !== "") {
      if (body.password.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters long." },
          { status: 400 }
        );
      }
      updateData.passwordHash = await hashPassword(body.password);
      changes.passwordChanged = true;
    }

    // 4. Role update
    if (body.role !== undefined) {
      if (userId === admin.user.id && body.role !== "ADMIN") {
        return NextResponse.json(
          { error: "You cannot revoke your own administrator privileges." },
          { status: 400 }
        );
      }
      if (body.role === "ADMIN" || body.role === "USER") {
        updateData.role = body.role;
        changes.role = body.role;
      }
    }

    // 5. Verification status update
    if (body.isVerified !== undefined) {
      updateData.isVerified = Boolean(body.isVerified);
      changes.isVerified = updateData.isVerified;
    }

    // 6. Suspension status update
    if (body.isSuspended !== undefined) {
      if (userId === admin.user.id && body.isSuspended) {
        return NextResponse.json(
          { error: "You cannot suspend your own administrator account." },
          { status: 400 }
        );
      }
      updateData.isSuspended = Boolean(body.isSuspended);
      if (updateData.isSuspended) {
        updateData.suspendedAt = new Date();
        updateData.suspensionReason = body.suspensionReason?.trim() || "Suspended by administrator";
      } else {
        updateData.suspendedAt = null;
        updateData.suspensionReason = null;
      }
      changes.isSuspended = updateData.isSuspended;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No changes provided." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isVerified: true,
        isSuspended: true,
        suspensionReason: true,
        coinBalance: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.user.id,
        action: "UPDATE_USER",
        targetType: "USER",
        targetId: userId,
        details: JSON.stringify(changes),
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.username} updated successfully.`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update user." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error || !admin.user) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { searchParams } = new URL(req.url);
    let userId = searchParams.get("id");

    if (!userId) {
      try {
        const body = await req.json();
        userId = body.userId;
      } catch {
        // no body
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    if (userId === admin.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own administrator account." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Cascade delete user data cleanly in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete user's redeem code usages
      await tx.redeemCodeUsage.deleteMany({ where: { userId } });
      // Delete user's coin transactions
      await tx.coinTransaction.deleteMany({ where: { userId } });
      // Delete user's orders and items
      const userOrders = await tx.order.findMany({ where: { userId }, select: { id: true } });
      if (userOrders.length > 0) {
        const orderIds = userOrders.map((o) => o.id);
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }
      // Delete user's task completions & AFK sessions
      await tx.taskCompletion.deleteMany({ where: { userId } });
      await tx.afkSession.deleteMany({ where: { userId } });
      // Delete payment requests
      await tx.paymentRequest.deleteMany({ where: { userId } });
      // Delete OTPs & password reset tokens
      await tx.emailOtp.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      // Nullify or delete created codes
      await tx.redeemCode.updateMany({
        where: { createdById: userId },
        data: { createdById: null },
      });
      // Delete audit logs created by this user
      await tx.auditLog.deleteMany({ where: { adminId: userId } });

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } });

      // Record audit log by the executing admin
      await tx.auditLog.create({
        data: {
          adminId: admin.user!.id,
          action: "DELETE_USER",
          targetType: "USER",
          targetId: userId,
          details: JSON.stringify({
            deletedUsername: targetUser.username,
            deletedEmail: targetUser.email,
            coinBalance: targetUser.coinBalance,
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.username} (${targetUser.email}) has been permanently deleted.`,
    });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete user." },
      { status: 500 }
    );
  }
}
