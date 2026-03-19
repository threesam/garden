"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";

const ITEMS = [
  { id: 0, label: "history", handle: "history" },
  ...Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    label: `${i + 2}`,
    handle: null as string | null,
  })),
];

const LOOPED = [...ITEMS, ...ITEMS];

const CARD_W = 320;
const CARD_GAP = 24;
const STRIP_W = ITEMS.length * (CARD_W + CARD_GAP);

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

    function tick(now: number) {
      const dt = Math.min((now - lastRef.current) / 1000, 0.1);
      lastRef.current = now;

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

      offsetRef.current = ((offsetRef.current % STRIP_W) + STRIP_W) % STRIP_W;
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
      className="w-full cursor-grab overflow-hidden active:cursor-grabbing"
      style={{ touchAction: "none", paddingTop: CARD_GAP, paddingBottom: CARD_GAP }}
    >
      <div
        ref={stripRef}
        className="flex"
        style={{ gap: CARD_GAP, willChange: "transform" }}
      >
        {LOOPED.map((item, i) =>
          item.handle ? (
            <Link
              key={`${item.id}-${i}`}
              href={`/canvas/${item.handle}`}
              draggable={false}
              onClick={(e) => {
                if (didDrag.current) {
                  e.preventDefault();
                  return;
                }
                // Explicitly navigate — ensures click works
                e.preventDefault();
                window.location.href = `/canvas/${item.handle}`;
              }}
              className="group relative shrink-0 rounded-2xl transition-all duration-300"
              style={{
                width: CARD_W,
                height: CARD_W * (5 / 4),
                backgroundColor: "var(--black)",
                border: "3px solid var(--black)",
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--coin)";
                e.currentTarget.style.transform = "rotate(-1.3deg)";
                (e.currentTarget.firstElementChild as HTMLElement).style.color = "var(--coin)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--black)";
                e.currentTarget.style.transform = "rotate(0deg)";
                (e.currentTarget.firstElementChild as HTMLElement).style.color = "var(--white)";
              }}
            >
              <span
                className="absolute bottom-4 left-4 font-mono text-sm font-bold tracking-[0.3em] transition-colors duration-300"
                style={{ color: "var(--white)" }}
              >
                {item.label}
              </span>
            </Link>
          ) : (
            <div
              key={`${item.id}-${i}`}
              className="relative shrink-0 rounded-2xl"
              style={{
                width: CARD_W,
                height: CARD_W * (5 / 4),
                backgroundColor: "var(--black)",
                border: "3px solid var(--black)",
              }}
            >
              <span
                className="absolute bottom-4 left-4 font-mono text-sm font-bold tracking-[0.3em]"
                style={{ color: "var(--white)" }}
              >
                {item.label}
              </span>
            </div>
          )
        )}
      </div>
    </section>
  );
}
