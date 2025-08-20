import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from 'next-themes';
import { AppInitializer } from '@/components/AppInitializer';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Simple Chat",
  description: "Comfortable AI Chat",

};

export const viewport: Viewport = {
  width: 'device-width',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased custom-scrollbar bg-neutral-50 dark:bg-neutral-900`}>
        <ThemeProvider>
          <AppInitializer>
            {children}
          </AppInitializer>
        </ThemeProvider>
      </body>
    </html>
  );
}
