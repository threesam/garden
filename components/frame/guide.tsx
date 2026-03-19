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
  const coinRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Coin — fixed top-right */}
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
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
            backgroundColor: "#e8a317",
            transformStyle: "preserve-3d",
            transform: hovered
              ? "perspective(300px) rotateX(-25deg)"
              : "perspective(300px) rotateX(0deg)",
            transition: "transform 500ms ease-out",
            position: "relative",
          }}
        >
          {/* Coin edge (visible on tilt) */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -3,
              height: 4,
              backgroundColor: "#b8800d",
              borderRadius: "0 0 20px 20px",
              transformOrigin: "top",
            }}
          />
          {/* Hamburger lines */}
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 14,
              display: "block",
              transform: "translate(-50%, -50%)",
            }}
          >
            <span
              style={{
                display: "block",
                height: 1,
                width: "100%",
                backgroundColor: "rgba(90, 50, 0, 0.6)",
                transition: "all 300ms",
                transform: open
                  ? "translateY(0.5px) rotate(45deg)"
                  : "translateY(-3px)",
              }}
            />
            <span
              style={{
                display: "block",
                height: 1,
                width: "100%",
                backgroundColor: "rgba(90, 50, 0, 0.6)",
                transition: "all 300ms",
                transform: open
                  ? "translateY(-0.5px) rotate(-45deg)"
                  : "translateY(3px)",
              }}
            />
          </span>
        </div>
      </button>

      {/* Menu overlay */}
      <nav
        className={`fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <ul className="flex flex-col items-center gap-8">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-mono text-sm tracking-[0.25em] text-foreground/50 transition hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
