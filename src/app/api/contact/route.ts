import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z.string().email("Please provide a valid email").trim(),
  subject: z.string().min(3, "Subject must be at least 3 characters").trim(),
  message: z.string().min(10, "Message must be at least 10 characters").trim(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parse = contactSchema.safeParse(body);

    if (!parse.success) {
      const issue = parse.error.issues?.[0];
      return NextResponse.json(
        { error: issue?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parse.data;

    const contactMsg = await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
        status: "UNREAD",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your message has been received! Our support team will get back to you shortly.",
      id: contactMsg.id,
    });
  } catch (error) {
    console.error("Contact submission error:", error);
    return NextResponse.json({ error: "Failed to submit message" }, { status: 500 });
  }
}
