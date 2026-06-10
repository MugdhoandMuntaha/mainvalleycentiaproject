import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { LayoutShell } from "@/components/LayoutShell";
import ScrollToTop from "@/components/ScrollToTop";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Valleycentia — Premium Fashion & Accessories",
  description:
    "Discover curated collections of premium fashion, accessories, and lifestyle essentials. Free shipping on orders over $100.",
  keywords: ["fashion", "accessories", "luxury", "online store", "premium", "valleycentia"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <ScrollToTop />
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
