import type { Metadata } from 'next';
import './globals.css';
import { LayoutShell } from '@/components/LayoutShell';

export const metadata: Metadata = {
    title: 'Valleycentia — Admin Panel',
    description: 'Manage products, collections, coupons, and site settings.',
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
                <LayoutShell>{children}</LayoutShell>
            </body>
        </html>
    );
}
