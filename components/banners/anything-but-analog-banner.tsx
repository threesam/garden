"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VoronoiCanvas } from "@/components/canvas/voronoi-canvas";

interface Props {
  href?: string;
}

const IMG_SRC = "/assets/anything-but-analog.png";
const INITIAL_ASPECT = 1052 / 1156; // known aspect of anything-but-analog.png

export function AnythingButAnalogBanner({ href }: Props) {
  const [aspect, setAspect] = useState(INITIAL_ASPECT);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setAspect(img.width / img.height);
    img.src = IMG_SRC;
  }, []);

  const body = (
    <div
      className="voronoi-banner"
      style={{ ["--banner-aspect" as string]: String(aspect) }}
    >
      <div className="voronoi-banner-inner">
        <VoronoiCanvas imageSrc={IMG_SRC} invert showLetters={false} />
        <span
          className="pointer-events-none absolute right-6 bottom-6 z-10 font-mono text-2xl font-bold uppercase tracking-[0.1em] md:right-20 md:bottom-20 md:text-5xl"
          style={{ color: "var(--white)" }}
        >
          anything but analog
        </span>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
