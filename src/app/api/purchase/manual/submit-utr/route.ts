import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { paymentReference, utrReference } = await req.json();

    if (!paymentReference || !utrReference || utrReference.trim().length < 6) {
      return NextResponse.json(
        { error: "Please enter a valid Transaction ID / UTR reference (min 6 characters)" },
        { status: 400 }
      );
    }

    const cleanUtr = utrReference.trim();

    const payment = await prisma.paymentRequest.findUnique({
      where: { paymentReference },
    });

    if (!payment || payment.userId !== auth.user.id) {
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    }

    if (payment.status === "SUCCESS") {
      return NextResponse.json({ error: "This payment request has already been completed." }, { status: 400 });
    }

    await prisma.paymentRequest.update({
      where: { id: payment.id },
      data: {
        utrReference: cleanUtr,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "UTR submitted successfully! An administrator will verify the payment and credit your coins.",
    });
  } catch (error: any) {
    console.error("Submit UTR error:", error);
    return NextResponse.json({ error: "Failed to submit UTR reference" }, { status: 500 });
  }
}
