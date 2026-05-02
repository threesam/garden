"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { VoronoiCanvas } from "@/components/canvas/voronoi-canvas";
import { MetaballCanvas } from "@/components/canvas/metaball-canvas";
import { ParticleTextCanvas } from "@/components/canvas/particle-text-canvas";
import { SketchHost } from "@/components/art/sketch-host";
import { EmojiCardBg } from "@/components/messages/emoji-card-bg";
import { DanaLabel } from "@/components/messages/dana-label";
import { setCanvasThrottled } from "@/lib/perf-flags";

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
    <ParticleTextCanvas countOverride={4000} hideText pointSize={2} repelRadius={50} lowDpr />
  ),
  // Under-construction routes preview their sketch background via
  // SketchHost — day30 (crowd walkers) for /thoughts and day25
  // (eye/dot grid) for /sounds. Day25 has no tick so it's static
  // after first paint; day30 runs at the mobile-tier walker count
  // because the card width stays below the w<768 threshold.
  thoughts: () => <SketchHost slug="30" active />,
  sounds: () => <SketchHost slug="25" active />,
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
  { label: "thoughts", handle: "thoughts", href: "/thoughts" },
  { label: "sounds", handle: "sounds", href: "/sounds" },
];

// Two full passes so the modulo wrap is seamless — when the offset cycles
// past stripW and snaps back, the trailing pass has already painted in
// place of the leading pass, hiding the wrap. Virtualization caps the
// number of *mounted* canvases to the visible window regardless of the
// total rendered Link count, so the DOM overhead of a second pass is
// minimal and the canvases beyond the window are never instantiated.
const LOOPED = [...UNIQUE_ITEMS, ...UNIQUE_ITEMS].map((it, i) => ({ id: i, ...it }));
const UNIQUE_COUNT = UNIQUE_ITEMS.length;

const CARD_GAP = 24;

const SPEED = 30;

// Number of extra cards to keep mounted on each side of the visible window.
// One card is comfortably off-screen (gives WebGL canvases ~card-width of
// warm-up time before they enter view, avoiding a visible cold-start flash)
// without paying for a fourth or fifth idle canvas. At SPEED=30px/s a card
// takes ~several seconds to traverse the viewport, so 1 is plenty.
const LOOKAHEAD = 1;

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
  // Virtualization: track which card indices have their heavy hero canvas
  // mounted. All <Link> wrappers stay in the DOM (so measured strip width
  // stays stable) but heroFn() only runs for indices in this range. Initial
  // range is narrow — tick() expands it within a frame once stripW is
  // measured. Starting narrow avoids mounting all 8 WebGL contexts on
  // first paint only to tear most of them down immediately.
  const [activeRange, setActiveRange] = useState<[number, number]>([0, 2]);
  const activeRangeRef = useRef<[number, number]>([0, 2]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const section = strip.parentElement!;

    lastRef.current = performance.now();

    // Card width is now derived from height via CSS (aspect-ratio 4/5), so
    // we can't hard-code STRIP_W at module scope — it changes when the
    // viewport resizes. Re-measure on resize; wrap unit is one full
    // pass of the unique items (4 cards), so after offset cycles
    // UNIQUE_COUNT × stride the strip visually resets to itself —
    // the second rendered pass covers the visible gap during wrap.
    let stripW = 1; // filled in on first tick once the card has rendered
    let measured = false;
    function measure() {
      const firstCard = strip!.firstElementChild as HTMLElement | null;
      // Only accept measurements where the card actually has a width.
      // If tick fires before the card has laid out (offsetWidth === 0),
      // we'd compute stripW = UNIQUE_COUNT * CARD_GAP, collapsing the
      // virtualization stride and briefly mounting every card. Guarding
      // on >0 keeps the initial narrow `activeRange` until real layout
      // is available.
      if (firstCard && firstCard.offsetWidth > 0) {
        stripW = UNIQUE_COUNT * (firstCard.offsetWidth + CARD_GAP);
        measured = true;
      }
    }
    const ro = new ResizeObserver(() => {
      measure();
      wake();
    });
    ro.observe(section);

    function wake() {
      if (!rafRef.current) {
        lastRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    }

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

      const isMoving =
        Math.abs(speedRef.current) > 0.5 ||
        Math.abs(drag.velocity) > 0.5 ||
        drag.active;
      setCanvasThrottled(isMoving);

      // Virtualization window update. Stride = one card + gap; the visible
      // slice of the strip is [offset, offset + sectionW]. We expand it by
      // LOOKAHEAD cards on each side, convert to card indices, and clamp
      // to the rendered range. setState is a no-op when the range is
      // unchanged (React bails on Object.is-equal previous state), but we
      // also gate via activeRangeRef to avoid allocating a new tuple.
      // Skip entirely until `measured` — before the first card lays out,
      // any range we compute would be based on the fake `stripW` fallback
      // and would briefly mount every slot.
      const stride = stripW / UNIQUE_COUNT;
      if (measured && stride > 0) {
        const sectionW = section.clientWidth;
        const first = Math.floor(offsetRef.current / stride) - LOOKAHEAD;
        const last = Math.ceil((offsetRef.current + sectionW) / stride) + LOOKAHEAD - 1;
        const lo = Math.max(0, first);
        const hi = Math.min(LOOPED.length - 1, last);
        const cur = activeRangeRef.current;
        if (cur[0] !== lo || cur[1] !== hi) {
          activeRangeRef.current = [lo, hi];
          setActiveRange([lo, hi]);
        }
      }

      // Stop scheduling the rAF when the strip has settled — wake()
      // restarts it on any input that resumes motion.
      const isIdle =
        targetSpeedRef.current === 0 &&
        speedRef.current === 0 &&
        Math.abs(drag.velocity) < 0.5 &&
        !drag.active;
      if (isIdle) {
        rafRef.current = 0;
        setCanvasThrottled(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    function onEnter() { targetSpeedRef.current = 0; }
    function onLeave() {
      targetSpeedRef.current = SPEED;
      wake();
    }

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
      wake();
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
        wake();
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
      // Release the throttle so sketches/canvases on the next route run at full rate.
      setCanvasThrottled(false);
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
          // Card is visible (in the virtualization window) if its index
          // falls within [activeRange[0], activeRange[1]]. Cards outside
          // the range keep their <Link> wrapper (so strip width stays
          // measured) but skip mounting the heavy WebGL heroFn().
          const isVisible = i >= activeRange[0] && i <= activeRange[1];

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
              {heroFn && isVisible && (
                <div className="absolute inset-0">{heroFn()}</div>
              )}
              <span
                data-card-label
                className="absolute bottom-6 left-6 z-10 rounded-2xl p-3 font-mono text-xl font-bold uppercase tracking-[0.3em] transition-colors duration-300 lg:text-2xl"
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
