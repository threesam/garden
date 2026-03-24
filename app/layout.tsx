import type { Metadata } from "next";
import Script from "next/script";
import { Jost } from "next/font/google";
import { Guide } from "@/components/frame/guide";
import { Anchor } from "@/components/frame/anchor";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
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
      <Script
        src="https://analytics.sixtom.com/script.js"
        data-website-id="2a502ffa-58a1-4057-be13-e46f0354cfb7"
        strategy="afterInteractive"
      />
      <body
        className={`${jost.variable} antialiased`}
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
