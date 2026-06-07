import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unsigned — the honest recruiting read",
  description:
    "We'd rather tell you the truth than sell you a dream. An honest level assessment and right-fit college shortlist for overlooked D-III, NAIA, and JUCO athletes. Free for athletes.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15171c",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto w-full max-w-screen-sm px-5 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight text-ink">
              Unsigned
            </Link>
            <span className="text-xs text-muted">Free for athletes</span>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-screen-sm px-5 py-6">
          {children}
        </main>
        <footer className="border-t border-line">
          <div className="mx-auto w-full max-w-screen-sm px-5 py-5 text-xs text-muted">
            We&apos;d rather tell you the truth than sell you a dream.
          </div>
        </footer>
      </body>
    </html>
  );
}
