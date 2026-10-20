import assert from "assert";
import { generateToken, AUTH_COOKIE_NAME } from "../src/lib/auth";

const BASE_URL = "http://localhost:3000";

async function testBranding() {
  console.log("=== TESTING WEBSITE LOGO & TITLE FAVICON UPLOAD & RENDERING ===");

  // 1. Generate Admin session cookie
  console.log("\n1. Generating Admin auth session...");
  const adminToken = generateToken({
    userId: "cmvgj2u6q0000ok3ywnkykrb0",
    email: "amitbhai51c@gmail.com",
    username: "Amitbhai51",
    role: "ADMIN",
  });
  const cookie = `${AUTH_COOKIE_NAME}=${adminToken}`;

  // 2. Sample Base64 SVG logo & favicon
  const testLogoBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiNmNWRlMDUiLz48dGV4dCB4PSIxNiIgeT0iMjEiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMwMDAiPlokPC90ZXh0Pjwvc3ZnPg==";
  const testFaviconBase64 = "data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

  console.log("\n2. Updating Website Logo and Title Favicon via POST /api/admin/settings...");
  const updateRes = await fetch(`${BASE_URL}/api/admin/settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      siteName: "ZenStore Coins",
      logoUrl: testLogoBase64,
      faviconUrl: testFaviconBase64,
    }),
  });

  const updateData = await updateRes.json();
  assert.strictEqual(updateRes.status, 200, "Settings update should succeed");
  assert.strictEqual(updateData.settings.siteName, "ZenStore Coins");
  assert.strictEqual(updateData.settings.logoUrl, testLogoBase64);
  assert.strictEqual(updateData.settings.faviconUrl, testFaviconBase64);
  console.log("✓ Settings updated in DB successfully!");

  // 3. Fetch public page and verify favicon and logo rendering
  console.log("\n3. Fetching public homepage HTML to verify metadata, favicon links, and navbar logo...");
  const pageRes = await fetch(`${BASE_URL}/`);
  assert.strictEqual(pageRes.status, 200, "Homepage should return 200");
  const html = await pageRes.text();

  assert.ok(html.includes('rel="icon"'), "HTML must include rel=icon");
  assert.ok(html.includes("ZenStore Coins"), "HTML must include updated siteName");
  console.log("✓ Homepage HTML contains updated branding!");

  // 4. Verify admin settings retrieval reflects saved values
  console.log("\n4. Verifying GET /api/admin/settings returns the logo and favicon...");
  const getRes = await fetch(`${BASE_URL}/api/admin/settings`, {
    headers: { Cookie: cookie },
  });
  const getData = await getRes.json();
  assert.strictEqual(getData.settings.logoUrl, testLogoBase64);
  assert.strictEqual(getData.settings.faviconUrl, testFaviconBase64);
  console.log("✓ Admin settings API correctly returns logoUrl and faviconUrl!");

  console.log("\n=== ALL WEBSITE BRANDING & ICON UPLOAD TESTS PASSED! ===");
}

testBranding().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
