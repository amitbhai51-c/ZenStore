import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('--- Testing Redeem Code System ---');

  // 1. Create or get verified test user
  const passwordHash = await bcrypt.hash('TestPass123!', 10);
  const testUser1 = await prisma.user.upsert({
    where: { email: 'redeemer1@example.com' },
    update: { coinBalance: 50, isVerified: true },
    create: {
      email: 'redeemer1@example.com',
      username: 'redeemer1',
      passwordHash,
      role: 'USER',
      isVerified: true,
      coinBalance: 50,
    },
  });

  const testUser2 = await prisma.user.upsert({
    where: { email: 'redeemer2@example.com' },
    update: { coinBalance: 10, isVerified: true },
    create: {
      email: 'redeemer2@example.com',
      username: 'redeemer2',
      passwordHash,
      role: 'USER',
      isVerified: true,
      coinBalance: 10,
    },
  });

  const testUser3 = await prisma.user.upsert({
    where: { email: 'redeemer3@example.com' },
    update: { coinBalance: 0, isVerified: true },
    create: {
      email: 'redeemer3@example.com',
      username: 'redeemer3',
      passwordHash,
      role: 'USER',
      isVerified: true,
      coinBalance: 0,
    },
  });

  // Admin login to test admin API
  console.log('[1] Logging in as Admin...');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@coincraft.local', password: 'SecureAdmin@2026#Vault' }),
  });
  if (!adminLoginRes.ok) throw new Error(`Admin login failed: ${await adminLoginRes.text()}`);
  const adminCookie = adminLoginRes.headers.get('set-cookie') || '';

  // Clean up any old test code
  await prisma.redeemCodeUsage.deleteMany({
    where: { redeemCode: { code: 'TESTCOIN250' } },
  });
  await prisma.redeemCode.deleteMany({ where: { code: 'TESTCOIN250' } });

  // 2. Admin creates a custom redeem code
  console.log('[2] Admin creating redeem code TESTCOIN250 (250 coins, max 2 uses)...');
  const createCodeRes = await fetch(`${BASE_URL}/api/admin/redeem-codes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      code: 'TESTCOIN250',
      coinAmount: 250,
      maxUses: 2,
      note: 'Community event reward',
    }),
  });
  if (!createCodeRes.ok) throw new Error(`Failed to create redeem code: ${await createCodeRes.text()}`);
  const createdCode = await createCodeRes.json();
  console.log('✓ Code created successfully:', createdCode.code, `(${createdCode.coinAmount} coins, max uses: ${createdCode.maxUses})`);

  // 3. Login as User 1
  console.log('[3] Logging in as User 1 (redeemer1)...');
  const user1LoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'redeemer1@example.com', password: 'TestPass123!' }),
  });
  if (!user1LoginRes.ok) throw new Error(`User 1 login failed: ${await user1LoginRes.text()}`);
  const user1Cookie = user1LoginRes.headers.get('set-cookie') || '';

  // 4. User 1 redeems code
  console.log('[4] User 1 redeeming TESTCOIN250...');
  const redeemRes1 = await fetch(`${BASE_URL}/api/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
    body: JSON.stringify({ code: 'testcoin250' }), // testing case-insensitivity
  });
  const redeemJson1 = await redeemRes1.json();
  if (!redeemRes1.ok) throw new Error(`Redemption failed: ${JSON.stringify(redeemJson1)}`);
  console.log('✓ User 1 redeemed:', redeemJson1);
  if (redeemJson1.coinsAwarded !== 250 || redeemJson1.newBalance !== 300) {
    throw new Error(`Unexpected balance after redemption: ${JSON.stringify(redeemJson1)}`);
  }

  // 5. User 1 tries to redeem again -> must fail
  console.log('[5] User 1 attempting duplicate redemption (must be rejected)...');
  const redeemResDup = await fetch(`${BASE_URL}/api/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: user1Cookie },
    body: JSON.stringify({ code: 'TESTCOIN250' }),
  });
  const dupJson = await redeemResDup.json();
  if (redeemResDup.status !== 400 || !dupJson.error?.includes('already redeemed')) {
    throw new Error(`Duplicate redemption was not prevented: ${JSON.stringify(dupJson)}`);
  }
  console.log('✓ Duplicate redemption correctly rejected:', dupJson.error);

  // 6. User 2 logs in and redeems (uses count reaches 2/2)
  console.log('[6] User 2 redeeming TESTCOIN250...');
  const user2LoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'redeemer2@example.com', password: 'TestPass123!' }),
  });
  const user2Cookie = user2LoginRes.headers.get('set-cookie') || '';
  const redeemRes2 = await fetch(`${BASE_URL}/api/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: user2Cookie },
    body: JSON.stringify({ code: 'TESTCOIN250' }),
  });
  const redeemJson2 = await redeemRes2.json();
  if (!redeemRes2.ok || redeemJson2.newBalance !== 260) {
    throw new Error(`User 2 redemption failed: ${JSON.stringify(redeemJson2)}`);
  }
  console.log('✓ User 2 redeemed successfully. New balance: 260');

  // 7. User 3 logs in and attempts to redeem (max uses limit reached) -> must fail
  console.log('[7] User 3 redeeming when max uses is reached (must be rejected)...');
  const user3LoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'redeemer3@example.com', password: 'TestPass123!' }),
  });
  const user3Cookie = user3LoginRes.headers.get('set-cookie') || '';
  const redeemRes3 = await fetch(`${BASE_URL}/api/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: user3Cookie },
    body: JSON.stringify({ code: 'TESTCOIN250' }),
  });
  const limitJson = await redeemRes3.json();
  if (redeemRes3.status !== 400 || !limitJson.error?.includes('maximum redemption limit')) {
    throw new Error(`Max uses limit not enforced: ${JSON.stringify(limitJson)}`);
  }
  console.log('✓ Max uses limit correctly enforced:', limitJson.error);

  // 8. Admin listing codes
  console.log('[8] Admin fetching redeem codes list...');
  const listRes = await fetch(`${BASE_URL}/api/admin/redeem-codes`, {
    headers: { Cookie: adminCookie },
  });
  const data = await listRes.json();
  const testCodeInList = data.codes?.find((c: any) => c.code === 'TESTCOIN250');
  if (!testCodeInList || testCodeInList.timesRedeemed !== 2) {
    throw new Error(`Redeem code in admin list has incorrect timesRedeemed: ${JSON.stringify(testCodeInList)}`);
  }
  console.log('✓ Admin list shows code timesRedeemed = 2 / 2');

  // Clean up test users
  await prisma.redeemCodeUsage.deleteMany({
    where: { redeemCode: { code: 'TESTCOIN250' } },
  });
  await prisma.coinTransaction.deleteMany({
    where: { userId: { in: [testUser1.id, testUser2.id, testUser3.id] } },
  });
  await prisma.redeemCode.deleteMany({ where: { code: 'TESTCOIN250' } });
  await prisma.user.deleteMany({
    where: { id: { in: [testUser1.id, testUser2.id, testUser3.id] } },
  });

  console.log('\n=========================================');
  console.log('🎉 ALL REDEEM CODE TESTS PASSED SUCCESSFULLY!');
  console.log('=========================================');
}

main()
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
