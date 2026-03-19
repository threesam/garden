"use client";

import { useState, useRef } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/", label: "home" },
  { href: "/signal", label: "signal" },
  { href: "/source", label: "source" },
  { href: "/resonance", label: "resonance" },
] as const;

export function Guide() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [navHover, setNavHover] = useState(false);
  const lockedRef = useRef(false);
  const coinRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Coin — fixed top-right */}
      <button
        onClick={() => {
          setOpen((o) => {
            if (o) {
              setHovered(false);
              lockedRef.current = true;
            }
            return !o;
          });
        }}
        onMouseEnter={() => {
          if (!lockedRef.current) setHovered(true);
        }}
        onMouseLeave={() => {
          setHovered(false);
          lockedRef.current = false;
        }}
        aria-label="Menu"
        style={{
          border: "0",
          outline: "0",
          background: "none",
          padding: 0,
          margin: 0,
          appearance: "none",
          WebkitAppearance: "none",
          boxShadow: "none",
        }}
        className="fixed top-5 right-5 z-[60] cursor-pointer md:top-6 md:right-8"
      >
        <div
          ref={coinRef}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "var(--coin)",
            boxShadow: "inset 0 0 0 1.5px var(--black)",
            transformStyle: "preserve-3d",
            transform: open
              ? "rotateY(180deg) rotate(45deg)"
              : hovered
                ? "rotateY(180deg)"
                : "rotateY(0deg)",
            transition: "transform 300ms ease-in-out",
            position: "relative",
          }}
        >
          {/* Front face — hamburger */}
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 14,
              display: "block",
              transform: "translate(-50%, -50%)",
              backfaceVisibility: "hidden",
            }}
          >
            <span
              style={{
                display: "block",
                height: 1,
                width: "100%",
                backgroundColor: "var(--black)",
                transform: "translateY(-3px)",
              }}
            />
            <span
              style={{
                display: "block",
                height: 1,
                width: "100%",
                backgroundColor: "var(--black)",
                transform: "translateY(3px)",
              }}
            />
          </span>
          {/* Back face — plus */}
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 14,
              display: "block",
              transform: "translate(-50%, -50%) rotateY(180deg)",
              backfaceVisibility: "hidden",
            }}
          >
            <span
              style={{
                display: "block",
                height: 1,
                width: "100%",
                backgroundColor: "var(--black)",
              }}
            />
            <span
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                height: 14,
                width: 1,
                backgroundColor: "var(--black)",
                transform: "translate(-50%, -50%)",
              }}
            />
          </span>
        </div>
      </button>

      {/* Menu overlay */}
      <nav
        className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md transition-all duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        style={{ backgroundColor: navHover ? "var(--white)" : "var(--coin)" }}
      >
        <Link
          href="/"
          onClick={() => setOpen(false)}
          onMouseEnter={() => setNavHover(true)}
          onMouseLeave={() => setNavHover(false)}
          className="font-mono text-2xl font-bold tracking-[0.3em]"
          style={{ color: "var(--black)" }}
        >
          THREESAM
        </Link>
      </nav>
    </>
  );
}
