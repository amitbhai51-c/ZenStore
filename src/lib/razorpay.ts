import crypto from "crypto";

export function getRazorpayKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  const isConfigured = Boolean(
    keyId &&
    keySecret &&
    !keyId.includes("demo123456789") &&
    keyId.trim().length > 0 &&
    keySecret.trim().length > 0
  );
  return { keyId, keySecret, isConfigured };
}

/**
 * Creates an order with Razorpay API.
 * Throws an error if Razorpay is not configured or if API call fails.
 */
export async function createRazorpayOrder({
  amountPaise,
  receipt,
  notes,
}: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ orderId: string; amount: number; currency: string }> {
  const { keyId, keySecret, isConfigured } = getRazorpayKeys();

  if (!isConfigured) {
    throw new Error(
      "Razorpay online payment gateway is currently not configured. Please use Manual UPI / QR payment or contact support."
    );
  }

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

  if (!response.ok) {
    const errorBody = await response.text();
    let errDesc = "Failed to communicate with Razorpay API";
    try {
      const errJson = JSON.parse(errorBody);
      errDesc = errJson.error?.description || errDesc;
    } catch {
      // non-json response
    }
    throw new Error(`Razorpay gateway error: ${errDesc}`);
  }

  const data = await response.json();
  return { orderId: data.id, amount: data.amount, currency: data.currency };
}

/**
 * Verifies Razorpay payment signature cryptographically with HMAC SHA256.
 * Always rejects if keySecret is missing, empty, or signature does not match.
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
  if (!keySecret || !signature || keySecret.trim().length === 0) {
    return false;
  }

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  if (expectedSignature.length !== signature.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(signature, "utf-8")
    );
  } catch {
    return false;
  }
}
