"use client";

import { AsciiImage } from "./ascii-image";

const SRCS = ["/assets/deana-5.png", "/assets/deana-hero-3.png", "/assets/deana-6.jpg", "/assets/deana-hero.png", "/assets/deana-hero-5.png"];

export function EmojiCardBg() {
  return <AsciiImage srcs={SRCS} className="absolute inset-0" />;
}
