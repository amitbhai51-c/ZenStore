import assert from "assert";

const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("=== STARTING ADMIN USER CRUD VERIFICATION ===");

  // 1. Admin login
  console.log("\n1. Logging in as Admin...");
  const { prisma } = await import("../src/lib/prisma");
  const { generateToken, AUTH_COOKIE_NAME } = await import("../src/lib/auth");
  const adminDb = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!adminDb) throw new Error("No admin in database");
  const adminToken = generateToken({
    userId: adminDb.id,
    email: adminDb.email,
    username: adminDb.username,
    role: "ADMIN",
  });
  const adminCookie = `${AUTH_COOKIE_NAME}=${adminToken}`;
  console.log("✓ Admin auth session created for:", adminDb.email);

  // 2. Admin creates a user
  console.log("\n2. Admin creating a new user...");
  const testUserEmail = `crud_user_${Date.now()}@test.local`;
  const testUsername = `user_${Date.now()}`;
  const initialPassword = "InitialPassword123!";

  const createRes = await fetch(`${BASE_URL}/api/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      username: testUsername,
      email: testUserEmail,
      password: initialPassword,
      role: "USER",
      isVerified: true,
      coinBalance: 250,
    }),
  });

  const createData = await createRes.json();
  console.log("Create response:", createData);
  assert.strictEqual(createRes.status, 200, "Create user should return 200");
  assert.ok(createData.user?.id, "Created user should have an ID");
  const createdUserId = createData.user.id;
  assert.strictEqual(createData.user.coinBalance, 250, "User should have 250 initial coins");
  assert.strictEqual(createData.user.isVerified, true, "User should be verified");
  console.log("✓ User created successfully with ID:", createdUserId);

  // 3. Newly created user logs in
  console.log("\n3. Testing login for created user...");
  const userLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: testUserEmail,
      password: initialPassword,
    }),
  });
  assert.strictEqual(userLoginRes.status, 200, "User login should succeed with created password");
  const userData = await userLoginRes.json();
  assert.strictEqual(userData.user.coinBalance, 250, "Logged-in user coin balance should be 250");
  console.log("✓ User login succeeded");

  // 4. Admin edits user's username, email, and password
  console.log("\n4. Admin editing user credentials (username, email, password)...");
  const updatedEmail = `updated_${Date.now()}@test.local`;
  const updatedUsername = `updated_${Date.now()}`;
  const updatedPassword = "UpdatedNewPassword456!";

  const editRes = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      username: updatedUsername,
      email: updatedEmail,
      password: updatedPassword,
      role: "USER",
      isVerified: true,
      isSuspended: false,
    }),
  });

  const editData = await editRes.json();
  console.log("Edit response:", editData);
  assert.strictEqual(editRes.status, 200, "User edit should return 200");
  assert.strictEqual(editData.user.username, updatedUsername, "Username should match updated value");
  assert.strictEqual(editData.user.email, updatedEmail, "Email should match updated value");
  console.log("✓ User updated successfully");

  // 5. Verify user logs in with new credentials and old password fails
  console.log("\n5. Testing user login with old vs new credentials...");
  const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: updatedEmail,
      password: initialPassword,
    }),
  });
  assert.strictEqual(oldLoginRes.status, 401, "Old password should be rejected");

  const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: updatedEmail,
      password: updatedPassword,
    }),
  });
  assert.strictEqual(newLoginRes.status, 200, "New password should succeed");
  const newLoginData = await newLoginRes.json();
  assert.strictEqual(newLoginData.user.username, updatedUsername, "New username matches in session");
  console.log("✓ New password and credentials confirmed functional");

  // 6. Test duplicate prevention
  console.log("\n6. Testing duplicate email/username prevention...");
  const dupRes = await fetch(`${BASE_URL}/api/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      username: updatedUsername,
      email: `another_${Date.now()}@test.local`,
      password: "ValidPassword123!",
    }),
  });
  assert.strictEqual(dupRes.status, 400, "Duplicate username should return 400");
  console.log("✓ Duplicate username correctly rejected");

  // 7. Admin deletes user
  console.log("\n7. Admin deleting user...");
  const deleteRes = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}`, {
    method: "DELETE",
    headers: {
      Cookie: adminCookie,
    },
  });
  assert.strictEqual(deleteRes.status, 200, "Delete user should return 200");
  console.log("✓ User deleted successfully");

  // 8. Confirm deleted user can no longer log in
  const postDeleteLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: updatedEmail,
      password: updatedPassword,
    }),
  });
  assert.strictEqual(postDeleteLogin.status, 401, "Deleted user login must fail");
  console.log("✓ Deleted user cannot log in");

  console.log("\n=== ALL ADMIN USER CRUD TESTS PASSED SUCCESSFULLY! ===");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
