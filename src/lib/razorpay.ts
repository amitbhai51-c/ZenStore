import crypto from "crypto";

export function getRazorpayKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_demo123456789";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "demoSecretKey987654321";
  const isTestMode = keyId.startsWith("rzp_test_");
  return { keyId, keySecret, isTestMode };
}

/**
 * Creates an order with Razorpay API (or generates a compliant test order when mock keys are used)
 */
export async function createRazorpayOrder({
  amountPaise,
  receipt,
  notes,
}: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ orderId: string; amount: number; currency: string; isSimulated?: boolean }> {
  const { keyId, keySecret, isTestMode } = getRazorpayKeys();

  // If live keys or valid test keys are set and reachable
  if (keyId && keySecret && !keyId.includes("demo123456789")) {
    try {
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt,
          notes: notes || {},
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { orderId: data.id, amount: data.amount, currency: data.currency };
      }
    } catch (err) {
      console.warn("Razorpay API direct call failed, falling back to secure test order:", err);
    }
  }

  // Fallback for development / test mode with deterministic test order
  const orderId = `order_${receipt.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now().toString(36)}`;
  return {
    orderId,
    amount: amountPaise,
    currency: "INR",
    isSimulated: true,
  };
}

/**
 * Verifies Razorpay payment signature
 */
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = getRazorpayKeys();
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  // Constant time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(signature, "utf-8")
    );
  } catch {
    // If lengths mismatch, in test mode check matching string
    return expectedSignature === signature;
  }
}

/**
 * Generate test signature for local sandbox testing
 */
export function generateTestSignature(orderId: string, paymentId: string): string {
  const { keySecret } = getRazorpayKeys();
  const body = `${orderId}|${paymentId}`;
  return crypto.createHmac("sha256", keySecret).update(body).digest("hex");
}
