import type { Metadata } from "next";

export const SITE_URL = "https://threesam.com";

export const SITE_DESCRIPTION =
  "Artist-engineer creating at the intersection of sound, code, and human performance.";

export function ogAndTwitter(image: string): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: { images: [image] },
    twitter: { card: "summary_large_image", images: [image] },
  };
}
