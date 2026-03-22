import type { Metadata } from "next";
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
