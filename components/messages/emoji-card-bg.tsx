"use client";

import { AsciiGallery } from "@/components/ascii/ascii-gallery";

const SRCS = ["/assets/deana-6.jpg", "/assets/deana-5.png", "/assets/deana-hero-3.png", "/assets/deana-hero.png", "/assets/deana-hero-5.png"];

export function EmojiCardBg() {
  return <AsciiGallery srcs={SRCS} className="absolute inset-0" />;
}
