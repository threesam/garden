import type { Metadata } from "next";
import Script from "next/script";
import { Recursive, Epilogue } from "next/font/google";
import { Guide } from "@/components/frame/guide";
import { Anchor } from "@/components/frame/anchor";
import "./globals.css";

// Recursive ships every glyph as one variable file with axes for weight,
// slant, casual, cursive, and monospace — flipping CSS custom properties
// per page swaps the typographic register without loading a second face.
const recursive = Recursive({
  variable: "--font-recursive",
  subsets: ["latin"],
  axes: ["slnt", "CASL", "CRSV", "MONO"],
  display: "swap",
});

// Epilogue is loaded only for the editorial / long-form tier (case
// studies, future essays). Self-hosted by next/font so no extra request.
const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  display: "swap",
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
        className={`${recursive.variable} ${epilogue.variable} antialiased`}
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
