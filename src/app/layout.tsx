/**
 * Root Layout
 * Provides MUI theme and session provider
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ThemeRegistry from '@/components/ThemeRegistry';

const inter = Inter({ subsets: ['latin'] });

// Force dynamic rendering for all pages to prevent build-time static generation
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Customer Success Dashboard',
  description: 'Monitor and analyze customer reviews from Kiyoh and Klantenvertellen',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
