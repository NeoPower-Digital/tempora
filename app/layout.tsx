'use client';

import '@oak-network/api-augment';

import Root from '@/components/layout/Root';
import Navbar from '@/components/navigation/Navbar';
import { Toaster } from '@/core/components/ui/Toaster';
import TemporaProvider from '@/lib/providers/TemporaProvider';
import { ThemeProvider } from '@/lib/providers/ThemeProvider';
import { cn } from '@/lib/utils/tailwind';
import {
  Josefin_Sans as FontLogo,
  Roboto_Mono as FontMono,
  Inter as FontSans,
} from 'next/font/google';
import { RecoilRoot } from 'recoil';
import './globals.css';

export const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});
export const fontMono = FontMono({
  subsets: ['latin'],
  variable: '--font-mono',
});
export const fontLogo = FontLogo({
  subsets: ['latin'],
  variable: '--font-logo',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title key="title">Tempora</title>
        <meta name="description" content="Tempora" />
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <link rel="icon" href="/favicon.ico" />
      </head>

      <RecoilRoot>
        <TemporaProvider>
          <body
            suppressHydrationWarning
            className={cn(
              'min-h-screen bg-background font-sans antialiased pb-10',
              fontSans.variable,
              fontMono.variable,
              fontLogo.variable
            )}
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Navbar />

              <Root>{children}</Root>

              <Toaster />
            </ThemeProvider>
          </body>
        </TemporaProvider>
      </RecoilRoot>
    </html>
  );
}
