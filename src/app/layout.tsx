import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LayoutShell } from "@/components/LayoutShell";
import ScrollToTop from "@/components/ScrollToTop";

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ScrollToTop />
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
