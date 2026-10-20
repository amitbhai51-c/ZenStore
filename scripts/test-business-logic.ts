import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword, generateOtp, hashOtp } from "../src/lib/auth";
import { creditCoins, debitCoins, processOrderRefund } from "../src/lib/wallet";
import { verifyRazorpaySignature, generateTestSignature } from "../src/lib/razorpay";
import { getTodayDateString } from "../src/lib/date";

const prisma = new PrismaClient();

async function runTests() {
  console.log("==========================================");
  console.log("   Running CoinCraft Automated Tests       ");
  console.log("==========================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Password & OTP Hashing
  console.log("\n[1] Testing Auth & OTP Security Logic...");
  const rawPassword = "StrongSecurePassword123!";
  const hash = await hashPassword(rawPassword);
  assert(await comparePassword(rawPassword, hash), "Password hashing and comparison match");
  assert(!(await comparePassword("WrongPassword!", hash)), "Wrong password fails comparison");

  const otp = generateOtp();
  assert(otp.length === 6 && /^\d{6}$/.test(otp), "OTP is 6 numeric digits");
  const otpHash = hashOtp(otp);
  assert(otpHash === hashOtp(otp), "OTP hash matches identically");
  assert(otpHash !== hashOtp("123456"), "Different OTP produces distinct hash");

  // TEST 2: Wallet Transactions & Balance Safeguards
  console.log("\n[2] Testing Wallet Transactions & Balance Safeguards...");
  // Create test user
  const testEmail = `test_user_${Date.now()}@test.local`;
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      username: `testuser_${Date.now().toString(36)}`,
      passwordHash: hash,
      isVerified: true,
      coinBalance: 500,
    },
  });

  assert(user.coinBalance === 500, "Initial wallet balance set correctly");

  // Credit coins
  const creditRes = await creditCoins({
    userId: user.id,
    amount: 150,
    type: "EARNING_LINK",
    description: "Test link task reward",
  });
  assert(creditRes.balanceAfter === 650, "Credit increases wallet balance to 650");

  // Debit coins
  const debitRes = await debitCoins({
    userId: user.id,
    amount: 200,
    type: "PRODUCT_PURCHASE",
    description: "Test checkout purchase",
  });
  assert(debitRes.balanceAfter === 450, "Debit decreases wallet balance to 450");

  // Prevent negative balance
  let negativePrevented = false;
  try {
    await debitCoins({
      userId: user.id,
      amount: 1000, // Balance is 450
      type: "PRODUCT_PURCHASE",
      description: "Attempt overdraft",
    });
  } catch (err: any) {
    negativePrevented = true;
  }
  assert(negativePrevented, "Negative balance / overdraft is strictly blocked");

  // TEST 3: Order Checkout & Duplicate Refund Protection
  console.log("\n[3] Testing Order Creation, Fulfillment, & Idempotent Refunds...");
  const product = await prisma.product.findFirst({
    where: { isAvailable: true },
  });

  if (!product) {
    throw new Error("No available product found for testing");
  }

  const orderNumber = `ORD-TEST-${Date.now().toString(36)}`;
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: user.id,
      totalCoins: 300,
      status: "PENDING",
      refundProcessed: false,
      items: {
        create: [
          {
            productId: product.id,
            productName: product.name,
            coinPrice: 300,
            quantity: 1,
            subtotalCoins: 300,
          },
        ],
      },
    },
  });

  assert(order.status === "PENDING", "Order created with PENDING status");

  // Admin fulfills order
  const deliveryKey = "MINECRAFT-TEST-KEY-ABCD-1234";
  const fulfilledOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "DELIVERED",
      digitalDelivery: deliveryKey,
      deliveredAt: new Date(),
    },
  });
  assert(fulfilledOrder.status === "DELIVERED", "Order marked as DELIVERED");
  assert(fulfilledOrder.digitalDelivery === deliveryKey, "Delivered code securely saved in order");

  // Create another order to test refund
  const refundOrderNumber = `ORD-REF-${Date.now().toString(36)}`;
  const refundOrder = await prisma.order.create({
    data: {
      orderNumber: refundOrderNumber,
      userId: user.id,
      totalCoins: 250,
      status: "PENDING",
      refundProcessed: false,
      items: {
        create: [
          {
            productId: product.id,
            productName: product.name,
            coinPrice: 250,
            quantity: 1,
            subtotalCoins: 250,
          },
        ],
      },
    },
  });

  // Admin user for audit
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const adminId = admin ? admin.id : user.id;

  const refundResult = await processOrderRefund(refundOrder.id, adminId, "Supplier out of stock");
  assert(refundResult.order.status === "DECLINED", "Order status changed to DECLINED");
  assert(refundResult.order.refundProcessed === true, "Order marked as refundProcessed = true");

  // Attempt duplicate refund on same order (MUST THROW)
  let duplicateRefundBlocked = false;
  try {
    await processOrderRefund(refundOrder.id, adminId, "Duplicate refund attempt");
  } catch (err: any) {
    duplicateRefundBlocked = true;
  }
  assert(duplicateRefundBlocked, "Duplicate refund attempt is strictly blocked (Idempotency check)");

  // TEST 4: Razorpay Cryptographic Signature Verification
  console.log("\n[4] Testing Razorpay Cryptographic Signature Verification...");
  const mockOrderId = "order_demo_123456";
  const mockPaymentId = "pay_demo_789012";
  const validSignature = generateTestSignature(mockOrderId, mockPaymentId);

  const isValid = verifyRazorpaySignature({
    orderId: mockOrderId,
    paymentId: mockPaymentId,
    signature: validSignature,
  });
  assert(isValid, "Legitimate Razorpay HMAC SHA256 signature verified");

  const isInvalid = verifyRazorpaySignature({
    orderId: mockOrderId,
    paymentId: mockPaymentId,
    signature: "tampered_fake_signature_abc",
  });
  assert(!isInvalid, "Tampered Razorpay signature is rejected");

  // TEST 5: Earning Limits and Task Duplication Check
  console.log("\n[5] Testing Earning Tasks & Daily Allowance...");
  const todayDate = getTodayDateString("Asia/Kolkata");
  const task = await prisma.earningTask.findFirst({ where: { isActive: true } });

  if (task) {
    const completion = await prisma.taskCompletion.create({
      data: {
        userId: user.id,
        taskId: task.id,
        coinsEarned: task.rewardCoins,
        completedDate: todayDate,
      },
    });
    assert(completion.coinsEarned === task.rewardCoins, "Task completion recorded with reward coins");

    // Second claim on same day must be rejected by unique constraint
    let duplicateTaskBlocked = false;
    try {
      await prisma.taskCompletion.create({
        data: {
          userId: user.id,
          taskId: task.id,
          coinsEarned: task.rewardCoins,
          completedDate: todayDate,
        },
      });
    } catch {
      duplicateTaskBlocked = true;
    }
    assert(duplicateTaskBlocked, "Duplicate task claim on same date blocked by DB constraint");
  }

  // Cleanup test user and relations
  await prisma.orderItem.deleteMany({ where: { order: { userId: user.id } } });
  await prisma.order.deleteMany({ where: { userId: user.id } });
  await prisma.taskCompletion.deleteMany({ where: { userId: user.id } });
  await prisma.coinTransaction.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log("\n==========================================");
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
