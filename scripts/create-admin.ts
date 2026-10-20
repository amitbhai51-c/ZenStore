import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import readline from "readline";

const prisma = new PrismaClient();

function prompt(query: string, hide = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (hide) {
      // In non-interactive or standard CLI, read normally
      rl.question(query, (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    } else {
      rl.question(query, (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    }
  });
}

function generateSecurePassword(length = 16): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

async function main() {
  console.log("==========================================");
  console.log("  CoinCraft Secure Admin Bootstrap Script ");
  console.log("==========================================");

  // Check if an admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log(`\n[INFO] An administrator account already exists with email: ${existingAdmin.email}`);
    const proceed = await prompt("Do you want to reset the admin password or create an additional admin? (y/N): ");
    if (proceed.toLowerCase() !== "y") {
      console.log("Operation aborted.");
      process.exit(0);
    }
  }

  // Accept or prompt for email
  let email = process.argv[2];
  if (!email) {
    email = await prompt("Enter Administrator Email address: ");
  }

  if (!email || !email.includes("@")) {
    console.error("\n[ERROR] A valid email address is required.");
    process.exit(1);
  }

  let username = process.argv[3];
  if (!username) {
    username = await prompt("Enter Admin Username (default: admin): ");
    if (!username) username = "admin";
  }

  let password = process.argv[4];
  if (!password) {
    const choice = await prompt("Enter 1 to generate a strong random password, or 2 to type a custom password: ");
    if (choice === "2") {
      password = await prompt("Enter secure password (min 8 chars): ", true);
      if (password.length < 8) {
        console.error("\n[ERROR] Password must be at least 8 characters long.");
        process.exit(1);
      }
    } else {
      password = generateSecurePassword(16);
    }
  }

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
      isVerified: true,
      isSuspended: false,
    },
    create: {
      email,
      username,
      passwordHash,
      role: "ADMIN",
      isVerified: true,
      isSuspended: false,
      coinBalance: 5000, // Initial admin testing wallet balance
    },
  });

  // Record audit log
  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action: "ADMIN_BOOTSTRAP",
      targetType: "USER",
      targetId: admin.id,
      details: JSON.stringify({ email: admin.email, username: admin.username, time: new Date().toISOString() }),
    },
  });

  console.log("\n==========================================");
  console.log("✅ Administrator Account Configured Successfully!");
  console.log("==========================================");
  console.log(`Email:    ${admin.email}`);
  console.log(`Username: ${admin.username}`);
  console.log(`Password: ${password}`);
  console.log("Role:     ADMIN");
  console.log("Status:   VERIFIED");
  console.log("==========================================");
  console.log("⚠️  Keep these credentials safe. They will not be displayed again.");
  console.log("==========================================\n");
}

main()
  .catch((e) => {
    console.error("[ERROR]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
