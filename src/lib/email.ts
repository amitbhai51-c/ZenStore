import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export interface SendEmailOptions {
  to: string;
  templateType: string;
  variables: Record<string, string | number>;
  customSubject?: string;
}

export async function sendEmail({
  to,
  templateType,
  variables,
  customSubject,
}: SendEmailOptions): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  try {
    // 1. Get website settings for global variables
    const settings = await prisma.websiteSettings.findUnique({
      where: { id: "default" },
    });
    const siteName = settings?.siteName || "CoinCraft";
    const supportEmail = settings?.contactEmail || "support@coincraft.local";

    const allVariables: Record<string, string> = {
      "{{siteName}}": siteName,
      "{{supportEmail}}": supportEmail,
      ...Object.fromEntries(
        Object.entries(variables).map(([k, v]) => [
          k.startsWith("{{") ? k : `{{${k}}}`,
          String(v ?? ""),
        ])
      ),
    };

    // 2. Fetch template
    const template = await prisma.emailTemplate.findUnique({
      where: { type: templateType },
    });

    let subject = customSubject || template?.subject || `Update from ${siteName}`;
    let html = template?.htmlBody || `<p>Notice from ${siteName}</p>`;

    // Replace placeholders
    for (const [key, val] of Object.entries(allVariables)) {
      const escapedKey = key.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
      const regex = new RegExp(escapedKey, "g");
      subject = subject.replace(regex, val);
      html = html.replace(regex, val);
    }

    // 3. Fetch SMTP settings
    const smtp = await prisma.smtpSettings.findUnique({
      where: { id: "default" },
    });

    const host = smtp?.host || process.env.SMTP_HOST;
    const port = smtp?.port || Number(process.env.SMTP_PORT) || 587;
    const user = smtp?.username || process.env.SMTP_USER;
    const pass = smtp?.password || process.env.SMTP_PASS;
    const secure = smtp ? smtp.secure : process.env.SMTP_SECURE === "true";
    const senderName = smtp?.senderName || "CoinCraft Store";
    const senderEmail = smtp?.senderEmail || process.env.SMTP_FROM || "noreply@coincraft.local";

    if (!host || !user) {
      console.log(`[EMAIL DISPATCH - SIMULATED / LOGGED]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Template: ${templateType}`);
      console.log(`Content excerpt: ${html.substring(0, 150)}...`);
      return { success: true, simulated: true, messageId: `sim_${Date.now()}` };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      html,
    });

    return { success: true, messageId: info.messageId, simulated: false };
  } catch (error: any) {
    console.error("[EMAIL SEND ERROR]:", error);
    return { success: false, error: error?.message || "Failed to deliver email" };
  }
}

export async function testSmtpSettings(settings: {
  host: string;
  port: number;
  username: string;
  password?: string;
  secure: boolean;
  senderName: string;
  senderEmail: string;
  testRecipient: string;
}) {
  try {
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.username,
        pass: settings.password || "",
      },
      connectionTimeout: 8000,
    });

    // Verify SMTP connection
    await transporter.verify();

    // Send a test email
    const info = await transporter.sendMail({
      from: `"${settings.senderName}" <${settings.senderEmail}>`,
      to: settings.testRecipient,
      subject: `[Test] CoinCraft SMTP Connection Test`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #0b0d13; color: #f1f5f9; padding: 24px; border-radius: 8px;">
          <h2 style="color: #fbbf24;">SMTP Connection Successful!</h2>
          <p>Your CoinCraft store has successfully connected to the outgoing mail server.</p>
          <p style="color: #94a3b8; font-size: 13px;">Host: ${settings.host} | Port: ${settings.port} | Secure: ${settings.secure}</p>
        </div>
      `,
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to verify SMTP credentials" };
  }
}
