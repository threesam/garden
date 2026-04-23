"use client";

import { useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { VoronoiCanvas } from "@/components/canvas/voronoi-canvas";
import { MetaballCanvas } from "@/components/canvas/metaball-canvas";
import { ParticleTextCanvas } from "@/components/canvas/particle-text-canvas";
import { EmojiCardBg } from "@/components/messages/emoji-card-bg";
import { DanaLabel } from "@/components/messages/dana-label";

const HERO_MAP: Record<string, () => ReactNode> = {
  self: () => (
    <VoronoiCanvas
      invert
      showLetters={false}
      imageSrc="/assets/self-hero-mobile.png"
      scale={20}
      fit="cover"
    />
  ),
  deana: () => <EmojiCardBg />,
  shelf: () => <MetaballCanvas color={[0.91, 0.64, 0.09]} />,
  "anything-but-analog": () => (
    <ParticleTextCanvas countOverride={10000} hideText pointSize={2} repelRadius={50} />
  ),
};

const LABEL_MAP: Record<string, () => ReactNode> = {
  deana: () => <DanaLabel />,
};

const BG_MAP: Record<string, string> = {
  deana: "var(--white)",
};

const UNIQUE_ITEMS: { label: string; handle: string; href: string }[] = [
  { label: "self", handle: "self", href: "/canvas/self" },
  { label: "D-ANA", handle: "deana", href: "/deana" },
  { label: "shelf", handle: "shelf", href: "/shelf" },
  { label: "analog", handle: "anything-but-analog", href: "/anything-but-analog" },
];

// Double each card in the strip so a tight 4-card gallery loops without
// empty gaps at typical desktop widths; the strip also gets a second
// full pass appended for seamless wraparound of the running offset.
const ITEMS = [...UNIQUE_ITEMS, ...UNIQUE_ITEMS].map((it, i) => ({ id: i, ...it }));
const LOOPED = [...ITEMS, ...ITEMS];

const CARD_GAP = 24;

const SPEED = 30;
const SPEED_HOVER = 8;

export function Gallery() {
  const stripRef = useRef<HTMLDivElement>(null);
  const didDrag = useRef(false);
  const offsetRef = useRef(0);
  const speedRef = useRef(SPEED);
  const targetSpeedRef = useRef(SPEED);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startOffset: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
  });
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const section = strip.parentElement!;

    lastRef.current = performance.now();

    // Card width is now derived from height via CSS (aspect-ratio 4/5), so
    // we can't hard-code STRIP_W at module scope — it changes when the
    // viewport resizes. Re-measure on resize; ITEMS is the unit length.
    let stripW = 1; // filled in on first tick once the card has rendered
    function measure() {
      const firstCard = strip!.firstElementChild as HTMLElement | null;
      if (firstCard) {
        stripW = ITEMS.length * (firstCard.offsetWidth + CARD_GAP);
      }
    }
    const ro = new ResizeObserver(measure);
    ro.observe(section);

    function tick(now: number) {
      const dt = Math.min((now - lastRef.current) / 1000, 0.1);
      lastRef.current = now;
      if (stripW < 2) measure(); // first-paint safety

      // Smooth speed transitions
      const lerpRate = targetSpeedRef.current === 0 ? 0.1 : 0.02;
      speedRef.current += (targetSpeedRef.current - speedRef.current) * lerpRate;
      if (Math.abs(speedRef.current) < 0.1) speedRef.current = 0;

      const drag = dragRef.current;
      if (!drag.active) {
        if (Math.abs(drag.velocity) > 0.5) {
          offsetRef.current += drag.velocity * dt;
          drag.velocity *= 0.95;
        } else {
          drag.velocity = 0;
          offsetRef.current += speedRef.current * dt;
        }
      }

      offsetRef.current = ((offsetRef.current % stripW) + stripW) % stripW;
      strip!.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    function onEnter() { targetSpeedRef.current = 0; }
    function onLeave() { targetSpeedRef.current = SPEED; }

    function onDown(e: PointerEvent) {
      didDrag.current = false;
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startOffset: offsetRef.current,
        lastX: e.clientX,
        lastTime: performance.now(),
        velocity: 0,
      };
    }

    function onMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag.active) return;
      if (Math.abs(e.clientX - drag.startX) > 5) didDrag.current = true;
      offsetRef.current = drag.startOffset - (e.clientX - drag.startX);
      const now = performance.now();
      const vDt = (now - drag.lastTime) / 1000;
      if (vDt > 0) {
        drag.velocity = -(e.clientX - drag.lastX) / vDt;
      }
      drag.lastX = e.clientX;
      drag.lastTime = now;
    }

    function onUp() { dragRef.current.active = false; }

    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        dragRef.current.velocity = 0;
        offsetRef.current += e.deltaX;
      }
    }

    section.addEventListener("mouseenter", onEnter);
    section.addEventListener("mouseleave", onLeave);
    section.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    section.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      section.removeEventListener("mouseenter", onEnter);
      section.removeEventListener("mouseleave", onLeave);
      section.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      section.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <section
      className="h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
      style={{ touchAction: "none", padding: CARD_GAP }}
    >
      <div
        ref={stripRef}
        className="flex h-full"
        style={{ gap: CARD_GAP, willChange: "transform" }}
      >
        {LOOPED.map((item, i) => {
          const heroFn = HERO_MAP[item.handle];

          return (
            <Link
              key={`${item.id}-${i}`}
              href={item.href}
              draggable={false}
              onClick={(e) => {
                if (didDrag.current) {
                  e.preventDefault();
                  return;
                }
                e.preventDefault();
                window.location.href = item.href;
              }}
              className="group relative h-full shrink-0 overflow-hidden rounded-2xl transition-all duration-700"
              style={{
                aspectRatio: "4 / 5",
                backgroundColor: BG_MAP[item.handle] || "var(--black)",
                border: "3px solid var(--black)",
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--coin)";
                e.currentTarget.style.transform = "rotate(-1.3deg)";
                const label = e.currentTarget.querySelector("[data-card-label]") as HTMLElement;
                if (label) label.style.color = "var(--coin)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--black)";
                e.currentTarget.style.transform = "rotate(0deg)";
                const label = e.currentTarget.querySelector("[data-card-label]") as HTMLElement;
                if (label) label.style.color = "var(--white)";
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.borderColor = "var(--coin)";
                e.currentTarget.style.transform = "rotate(-1.3deg)";
                const label = e.currentTarget.querySelector("[data-card-label]") as HTMLElement;
                if (label) label.style.color = "var(--coin)";
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.borderColor = "var(--black)";
                e.currentTarget.style.transform = "rotate(0deg)";
                const label = e.currentTarget.querySelector("[data-card-label]") as HTMLElement;
                if (label) label.style.color = "var(--white)";
              }}
            >
              {heroFn && (
                <div className="absolute inset-0">{heroFn()}</div>
              )}
              <span
                data-card-label
                className="absolute bottom-5 left-5 z-10 rounded-2xl px-4 py-2 font-mono text-3xl font-bold uppercase tracking-[0.3em] transition-colors duration-300"
                style={{ backgroundColor: "var(--black)", color: "var(--white)" }}
              >
                {LABEL_MAP[item.handle]?.() || item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
