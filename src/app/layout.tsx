import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import AppChrome from "@/components/AppChrome";
import "./globals.css";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-barlow",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Unsigned — the honest recruiting read",
  description:
    "We'd rather tell you the truth than sell you a dream. An honest level read and right-fit programs for overlooked D-III, NAIA, and JUCO athletes. Free for athletes.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c0c0d",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${barlow.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
