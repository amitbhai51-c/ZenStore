import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { debitCoins } from "@/lib/wallet";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Process checkout inside atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Re-fetch and lock user to get up-to-date balance and verify status
      const user = await tx.user.findUnique({
        where: { id: auth.user.id },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (user.isSuspended) {
        throw new Error(`Your account has been suspended: ${user.suspensionReason || "Violation of terms"}`);
      }

      if (!user.isVerified) {
        throw new Error("Please verify your email address before checking out.");
      }

      // 2. Extract product IDs and query current fresh prices and stock
      const productIds = items.map((i: any) => i.id);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds }, isArchived: false },
      });

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      let calculatedTotalCoins = 0;
      const orderItemsData: Array<{
        productId: string;
        productName: string;
        coinPrice: number;
        quantity: number;
        subtotalCoins: number;
      }> = [];

      for (const item of items) {
        const product = productMap.get(item.id);
        if (!product) {
          throw new Error(`Product not found or no longer available: ${item.name || item.id}`);
        }

        if (!product.isAvailable) {
          throw new Error(`"${product.name}" is currently marked as unavailable.`);
        }

        const qty = Math.max(1, parseInt(item.quantity) || 1);

        if (product.stockQuantity < qty) {
          throw new Error(
            `Insufficient stock for "${product.name}". Only ${product.stockQuantity} remaining.`
          );
        }

        const subtotal = product.coinPrice * qty;
        calculatedTotalCoins += subtotal;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          coinPrice: product.coinPrice,
          quantity: qty,
          subtotalCoins: subtotal,
        });

        // Decrement product stock
        await tx.product.update({
          where: { id: product.id },
          data: {
            stockQuantity: { decrement: qty },
            isAvailable: product.stockQuantity - qty > 0,
          },
        });
      }

      if (user.coinBalance < calculatedTotalCoins) {
        throw new Error(
          `Insufficient coins. Your balance is ${user.coinBalance} coins, but order requires ${calculatedTotalCoins} coins.`
        );
      }

      // 3. Generate unique Order Number: ORD-YYYYMMDD-XXXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
      const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

      // 4. Create Order and OrderItems
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          totalCoins: calculatedTotalCoins,
          status: "PENDING",
          refundProcessed: false,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // 5. Atomically debit coins and record transaction
      const debitResult = await debitCoins({
        userId: user.id,
        amount: calculatedTotalCoins,
        type: "PRODUCT_PURCHASE",
        referenceId: orderNumber,
        description: `Order #${orderNumber} purchase (${orderItemsData.length} item${
          orderItemsData.length > 1 ? "s" : ""
        })`,
        tx,
      });

      return {
        order,
        orderNumber,
        totalCoins: calculatedTotalCoins,
        newBalance: debitResult.balanceAfter,
        user,
      };
    });

    return NextResponse.json({
      success: true,
      orderNumber: result.orderNumber,
      orderId: result.order.id,
      totalCoins: result.totalCoins,
      newBalance: result.newBalance,
      message: "Order placed successfully! We will deliver your digital codes shortly.",
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process order" },
      { status: 400 }
    );
  }
}
