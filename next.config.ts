import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    // AVIF + WebP fallback. Default Next 16 behavior can serve remote-URL
    // sources as the source format (JPEG) — explicit list forces
    // negotiation against the browser's Accept header.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "i.gr-assets.com" },
      { protocol: "https", hostname: "images.gr-assets.com" },
    ],
  },
};

export default nextConfig;
