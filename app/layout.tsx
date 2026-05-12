import type { Metadata } from "next";
import Script from "next/script";
import { Recursive, Epilogue } from "next/font/google";
import { Suspense } from "react";
import { Guide } from "@/components/frame/guide";
import { Anchor } from "@/components/frame/anchor";
import { OutboundTracker } from "@/components/analytics/outbound-tracker";
import { SITE_URL, SITE_DESCRIPTION } from "@/lib/seo";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "threesam",
    template: "%s — threesam",
  },
  description: SITE_DESCRIPTION,
  applicationName: "threesam",
  authors: [{ name: "Sam D'Angelo", url: SITE_URL }],
  creator: "Sam D'Angelo",
  keywords: [
    "Sam D'Angelo",
    "threesam",
    "artist-engineer",
    "generative art",
    "creative coding",
    "music production",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "threesam",
    title: "threesam",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "threesam" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "threesam",
    description: SITE_DESCRIPTION,
    images: ["/og/default.png"],
  },
  robots: { index: true, follow: true },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Sam D'Angelo",
  alternateName: "threesam",
  url: SITE_URL,
  jobTitle: "Artist-Engineer",
  sameAs: [
    "https://github.com/threesam",
    "https://soundcloud.com/threesam",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "threesam",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  author: { "@type": "Person", name: "Sam D'Angelo", url: SITE_URL },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${recursive.variable} ${epilogue.variable} antialiased`}
      >
        <Script
          src="https://analytics.sixtom.com/script.js"
          data-website-id="2a502ffa-58a1-4057-be13-e46f0354cfb7"
          strategy="afterInteractive"
        />
        <OutboundTracker />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <div style={{ background: "var(--white)" }}>
          <Guide />
          {children}
          <Suspense fallback={null}>
            <Anchor />
          </Suspense>
        </div>
      </body>
    </html>
  );
}
