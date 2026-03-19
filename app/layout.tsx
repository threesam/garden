import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Guide } from "@/components/frame/guide";
import { Anchor } from "@/components/frame/anchor";
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
  title: "threesam",
  description:
    "Artist-engineer creating at the intersection of sound, code, and human performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div style={{ background: "var(--white)" }}>
          <Guide />
          {children}
          <Anchor />
        </div>
      </body>
    </html>
  );
}
