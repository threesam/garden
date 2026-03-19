"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/", label: "home" },
  { href: "/signal", label: "signal" },
  { href: "/source", label: "source" },
  { href: "/resonance", label: "resonance" },
] as const;

export function Guide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Coin — fixed top-right */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        className="fixed top-5 right-5 z-[60] md:top-6 md:right-8"
      >
        <div
          className="group relative h-10 w-10 rounded-full border border-foreground/10 bg-foreground/5 backdrop-blur-sm transition-transform duration-300 ease-out"
          style={{ transformStyle: "preserve-3d" }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            e.currentTarget.style.transform = `perspective(200px) rotateY(${x * 20}deg) rotateX(${-y * 20}deg)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform =
              "perspective(200px) rotateY(0deg) rotateX(0deg)";
          }}
        >
          {/* Hamburger lines */}
          <span className="absolute left-1/2 top-1/2 block w-3.5 -translate-x-1/2 -translate-y-1/2">
            <span
              className={`block h-px w-full bg-foreground/60 transition-all duration-300 ${open ? "translate-y-[0.5px] rotate-45" : "-translate-y-[3px]"}`}
            />
            <span
              className={`mt-px block h-px w-full bg-foreground/60 transition-all duration-300 ${open ? "-translate-y-[0.5px] -rotate-45" : "translate-y-[3px]"}`}
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
