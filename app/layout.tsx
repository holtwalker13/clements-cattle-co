import type { Metadata } from "next";
import { Commissioner, Inconsolata } from "next/font/google";
import "./globals.css";

const fontHeader = Commissioner({
  variable: "--font-header",
  subsets: ["latin"],
  weight: "700",
});

const fontBody = Inconsolata({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Beef Order",
  description: "Order beef cuts from live inventory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontHeader.variable} ${fontBody.variable}`}>
      <body className="min-h-screen bg-[var(--color-bg)] font-body text-[var(--color-charcoal)] antialiased">
        {children}
      </body>
    </html>
  );
}
