import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await prisma.websiteSettings.findUnique({
      where: { id: "default" },
    });
    return {
      title: `${settings?.siteName || "CoinCraft"} - Digital Products & Coin Store`,
      description: settings?.tagline || "Earn coins by completing tasks or AFK, and redeem for digital gift cards and game keys.",
    };
  } catch {
    return {
      title: "CoinCraft - Digital Products & Coin Store",
      description: "Earn coins and redeem digital gift cards and game keys.",
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings = null;
  try {
    settings = await prisma.websiteSettings.findUnique({
      where: { id: "default" },
    });
  } catch {
    // Database might be warming up
  }

  const siteName = settings?.siteName || "CoinCraft";
  const footerText = settings?.footerText || "© 2026 CoinCraft Digital Store. All rights reserved.";
  const supportInfo = settings?.supportInfo || "Support available 24/7 online";
  const contactEmail = settings?.contactEmail || "support@coincraft.local";

  return (
    <html lang="en" className="dark">
      <body className="bg-[#08090d] text-zinc-100 flex flex-col min-h-screen antialiased selection:bg-amber-500 selection:text-black">
        <AuthProvider>
          <CartProvider>
            <Navbar siteName={siteName} />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer
              siteName={siteName}
              footerText={footerText}
              supportInfo={supportInfo}
              contactEmail={contactEmail}
            />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
