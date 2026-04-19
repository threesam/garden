"use client";

import { AsciiGallery } from "@/components/ascii/ascii-gallery";
import { DEANA_IMAGES } from "@/components/messages/deana-images";

export function EmojiCardBg() {
  return <AsciiGallery srcs={DEANA_IMAGES} className="absolute inset-0" />;
}
