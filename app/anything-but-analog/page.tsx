import type { Metadata } from "next";
import { AnythingButAnalogBanner } from "@/components/banners/anything-but-analog-banner";
import { ParticleTextCanvas } from "@/components/canvas/particle-text-canvas";

export const metadata: Metadata = {
  title: "anything but analog — threesam",
  description: "pixels, dancing.",
};

export default function AnythingButAnalogPage() {
  return (
    <main style={{ backgroundColor: "var(--black)" }}>
      <AnythingButAnalogBanner />
      <ParticleTextCanvas />
    </main>
  );
}
