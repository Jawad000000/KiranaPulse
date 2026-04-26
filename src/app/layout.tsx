import type { Metadata } from "next";
import { Space_Grotesk, DM_Serif_Display, Space_Mono } from 'next/font/google';
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});
const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-drama',
  display: 'swap',
});
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-data',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "KiranaPulse",
  description: "Retailer-first supply-chain SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmSerifDisplay.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="noise-overlay min-h-full flex flex-col font-mono text-[var(--color-dark)] bg-[var(--color-background)]">
        {children}
      </body>
    </html>
  );
}
