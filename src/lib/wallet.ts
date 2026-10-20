import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type TransactionType =
  | "EARNING_LINK"
  | "EARNING_AFK"
  | "COIN_PURCHASE"
  | "PRODUCT_PURCHASE"
  | "REFUND"
  | "ADMIN_ADJUSTMENT"
  | "REDEEM_CODE";

export interface CoinOperationOptions {
  userId: string;
  amount: number;
  type: TransactionType;
  referenceId?: string;
  description: string;
  tx?: Prisma.TransactionClient;
}

/**
 * Atomically credit coins to user's wallet
 */
export async function creditCoins({
  userId,
  amount,
  type,
  referenceId,
  description,
  tx,
}: CoinOperationOptions) {
  if (amount <= 0) {
    throw new Error("Credit amount must be greater than zero");
  }

  const runOperation = async (client: Prisma.TransactionClient) => {
    // 1. Fetch current user balance
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { coinBalance: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const balanceBefore = user.coinBalance;
    const balanceAfter = balanceBefore + amount;

    // 2. Update user balance
    await client.user.update({
      where: { id: userId },
      data: { coinBalance: balanceAfter },
    });

    // 3. Create transaction audit log
    const transaction = await client.coinTransaction.create({
      data: {
        userId,
        type,
        amount: Math.abs(amount),
        balanceBefore,
        balanceAfter,
        referenceId,
        description,
      },
    });

    return { balanceBefore, balanceAfter, transaction };
  };

  if (tx) {
    return runOperation(tx);
  } else {
    return prisma.$transaction(runOperation);
  }
}

/**
 * Atomically debit coins from user's wallet with balance check
 */
export async function debitCoins({
  userId,
  amount,
  type,
  referenceId,
  description,
  tx,
}: CoinOperationOptions) {
  if (amount <= 0) {
    throw new Error("Debit amount must be greater than zero");
  }

  const runOperation = async (client: Prisma.TransactionClient) => {
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { coinBalance: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.coinBalance < amount) {
      throw new Error(`Insufficient coins. You have ${user.coinBalance} coins, but need ${amount} coins.`);
    }

    const balanceBefore = user.coinBalance;
    const balanceAfter = balanceBefore - amount;

    await client.user.update({
      where: { id: userId },
      data: { coinBalance: balanceAfter },
    });

    const transaction = await client.coinTransaction.create({
      data: {
        userId,
        type,
        amount: -Math.abs(amount),
        balanceBefore,
        balanceAfter,
        referenceId,
        description,
      },
    });

    return { balanceBefore, balanceAfter, transaction };
  };

  if (tx) {
    return runOperation(tx);
  } else {
    return prisma.$transaction(runOperation);
  }
}

/**
 * Process order refund with strict idempotency check
 */
export async function processOrderRefund(orderId: string, adminId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.refundProcessed) {
      throw new Error("Refund has already been processed for this order.");
    }

    // 1. Credit coins back to user
    const creditResult = await creditCoins({
      userId: order.userId,
      amount: order.totalCoins,
      type: "REFUND",
      referenceId: order.orderNumber,
      description: `Refund for declined order #${order.orderNumber}: ${reason}`,
      tx,
    });

    // 2. Mark order as declined and refunded
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "DECLINED",
        declineReason: reason,
        refundProcessed: true,
      },
    });

    // 3. Record audit log
    await tx.auditLog.create({
      data: {
        adminId,
        action: "DECLINE_ORDER",
        targetType: "ORDER",
        targetId: orderId,
        details: JSON.stringify({
          orderNumber: order.orderNumber,
          refundCoins: order.totalCoins,
          reason,
          newBalance: creditResult.balanceAfter,
        }),
      },
    });

    return { order: updatedOrder, refund: creditResult };
  });
}
