import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function main() {
  console.log("=== Testing User Deletion, Single Payment/Earn Controls & Security ===");

  // Reset maintenance flags to false
  await prisma.websiteSettings.update({
    where: { id: "default" },
    data: {
      earningMaintenance: false,
      purchaseMaintenance: false,
      globalMaintenance: false,
      razorpayEnabled: true,
      manualPaymentEnabled: true,
      afkEarningEnabled: true,
      linkEarningEnabled: true,
    },
  });

  // 1. Admin login
  console.log("[1] Admin logging in...");
  const adminDb = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!adminDb) throw new Error("No admin in database");
  const { generateToken, AUTH_COOKIE_NAME } = await import("../src/lib/auth");
  const adminToken = generateToken({
    userId: adminDb.id,
    email: adminDb.email,
    username: adminDb.username,
    role: "ADMIN",
  });
  const adminCookie = `${AUTH_COOKIE_NAME}=${adminToken}`;
  const adminId = adminDb.id;

  // 2. Test User Deletion & Self-Delete Prevention
  console.log("[2] Testing user deletion safeguards...");
  // Attempt to delete own admin account -> must fail
  const selfDeleteRes = await fetch(`${BASE_URL}/api/admin/users?id=${adminId}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  if (selfDeleteRes.status !== 400) {
    throw new Error(`Self-deletion was not prevented! Status: ${selfDeleteRes.status}`);
  }
  console.log("  ✓ Self-deletion strictly blocked");

  // Create temporary user to delete
  const passwordHash = await bcrypt.hash("TempPass123!", 10);
  const tempUser = await prisma.user.create({
    data: {
      email: "temp_to_delete@example.com",
      username: "temptodelete",
      passwordHash,
      role: "USER",
      isVerified: true,
      coinBalance: 50,
    },
  });

  // Admin deletes temp user
  const deleteRes = await fetch(`${BASE_URL}/api/admin/users?id=${tempUser.id}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  const deleteJson = await deleteRes.json();
  if (!deleteRes.ok || !deleteJson.success) {
    throw new Error(`User deletion failed: ${JSON.stringify(deleteJson)}`);
  }
  const checkDeleted = await prisma.user.findUnique({ where: { id: tempUser.id } });
  if (checkDeleted) throw new Error("User record still exists in database after deletion!");
  console.log("  ✓ User account deleted permanently with all cascade records");

  // 3. Test Disabling Single Payment Method
  console.log("[3] Testing disabling single payment gateway (Razorpay disabled, Manual enabled)...");
  const updateSettingsRes = await fetch(`${BASE_URL}/api/admin/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      razorpayEnabled: false,
      manualPaymentEnabled: true,
    }),
  });
  if (!updateSettingsRes.ok) throw new Error("Failed to update payment settings");

  // Check purchase config
  const configRes = await fetch(`${BASE_URL}/api/purchase/config`, {
    headers: { Cookie: adminCookie },
  });
  const configData = await configRes.json();
  if (configData.razorpayEnabled !== false || configData.manualPaymentEnabled !== true) {
    throw new Error(`Payment toggles not reflected: ${JSON.stringify(configData)}`);
  }
  console.log("  ✓ Purchase config reflects: razorpayEnabled=false, manualPaymentEnabled=true");

  // Attempting to create Razorpay order while disabled must return 403
  const rzpOrderRes = await fetch(`${BASE_URL}/api/purchase/razorpay/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ coins: 100 }),
  });
  if (rzpOrderRes.status !== 403) {
    throw new Error(`Disabled Razorpay order was not rejected with 403! Status: ${rzpOrderRes.status}`);
  }
  console.log("  ✓ Razorpay order creation blocked with 403 when disabled by admin");

  // Restore Razorpay
  await fetch(`${BASE_URL}/api/admin/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ razorpayEnabled: true, manualPaymentEnabled: true }),
  });

  // 4. Test Disabling Single Earning Method (AFK disabled, Link enabled)
  console.log("[4] Testing disabling single earning method (AFK disabled)...");
  await fetch(`${BASE_URL}/api/admin/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ afkEarningEnabled: false, linkEarningEnabled: true }),
  });

  const earnStatusRes = await fetch(`${BASE_URL}/api/earn/status`, {
    headers: { Cookie: adminCookie },
  });
  const earnStatusData = await earnStatusRes.json();
  if (earnStatusData.afkEarningEnabled !== false || earnStatusData.linkEarningEnabled !== true) {
    throw new Error(`Earn toggles not reflected: ${JSON.stringify(earnStatusData)}`);
  }
  console.log("  ✓ Earn status reflects: afkEarningEnabled=false, linkEarningEnabled=true");

  // Attempting to start AFK while disabled must return 403
  const afkStartRes = await fetch(`${BASE_URL}/api/earn/afk/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
  });
  if (afkStartRes.status !== 403) {
    throw new Error(`Disabled AFK start was not rejected with 403! Status: ${afkStartRes.status}`);
  }
  console.log("  ✓ AFK start blocked with 403 when disabled by admin");

  // Restore AFK
  await fetch(`${BASE_URL}/api/admin/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ afkEarningEnabled: true, linkEarningEnabled: true }),
  });

  // 5. Test Managing and Disabling a Single Earning Task
  console.log("[5] Testing single task control (create task, toggle active/disabled)...");
  // Create task
  const createTaskRes = await fetch(`${BASE_URL}/api/admin/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      title: "Test Single Earning Task",
      description: "Test description",
      linkUrl: "https://example.com/test-task",
      rewardCoins: 5,
      isActive: true,
    }),
  });
  if (!createTaskRes.ok) throw new Error("Failed to create earning task");
  const taskCreated = (await createTaskRes.json()).task;
  console.log("  ✓ Created single task:", taskCreated.id);

  // Disable this single task
  const toggleTaskRes = await fetch(`${BASE_URL}/api/admin/tasks/${taskCreated.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ isActive: false }),
  });
  if (!toggleTaskRes.ok) throw new Error("Failed to toggle task status");
  const taskUpdated = (await toggleTaskRes.json()).task;
  if (taskUpdated.isActive !== false) throw new Error("Task status was not updated to disabled");
  console.log("  ✓ Single task successfully disabled by admin");

  // Verify task does not show up in active user tasks
  const userTasksRes = await fetch(`${BASE_URL}/api/earn/status`, {
    headers: { Cookie: adminCookie },
  });
  const userTasksData = await userTasksRes.json();
  const foundInActive = userTasksData.link?.tasks?.find((t: any) => t.id === taskCreated.id);
  if (foundInActive) {
    throw new Error("Disabled task is still listed in active user tasks list!");
  }
  console.log("  ✓ Disabled single task is hidden from user earning page");

  // Clean up test task
  await fetch(`${BASE_URL}/api/admin/tasks/${taskCreated.id}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  console.log("  ✓ Single test task deleted cleanly");

  // 6. Test Security: Rejection of fake/test Razorpay signatures
  console.log("[6] Testing security: Fake 'test_signature_approved' must be rejected...");
  // Create a pending payment request
  const testPayReq = await prisma.paymentRequest.create({
    data: {
      paymentReference: `TEST-SEC-${Date.now()}`,
      userId: adminId,
      coinsAmount: 500,
      amountInrPaise: 5000,
      paymentMethod: "RAZORPAY",
      status: "PENDING",
      razorpayOrderId: `order_fake_${Date.now()}`,
    },
  });

  const fakeVerifyRes = await fetch(`${BASE_URL}/api/purchase/razorpay/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      paymentReference: testPayReq.paymentReference,
      razorpayOrderId: testPayReq.razorpayOrderId,
      razorpayPaymentId: "pay_fake_123456",
      razorpaySignature: "test_signature_approved", // Attempted bypass
    }),
  });
  if (fakeVerifyRes.status !== 400) {
    throw new Error(`Fake signature was not rejected! Status: ${fakeVerifyRes.status}`);
  }
  console.log("  ✓ Fake signature bypass rejected with 400 (no backdoor)");

  // Clean up test payment
  await prisma.paymentRequest.delete({ where: { id: testPayReq.id } });

  console.log("\n=======================================================");
  console.log("🎉 ALL NEW FEATURES AND SECURITY TESTS PASSED!");
  console.log("=======================================================");
}

main()
  .catch((e) => {
    console.error("Test error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
