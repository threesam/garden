import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { Prose } from "@/components/prose";
import { PlaylistSlider } from "@/components/benny/playlist-slider";
import { BENNY_PLAYLISTS } from "./playlists";

export const metadata: Metadata = {
  title: "benny — threesam",
  description: "remembering 102 jackson street.",
};

export default async function BennyPage() {
  const markdown = await getContent("benny");

  return (
    <main
      className="min-h-screen bg-zinc-900"
      style={{ color: "var(--white)" }}
    >
      <section className="relative grid min-h-[80vh] place-content-center overflow-hidden text-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/assets/sixtomidnight-tribute-poster.jpg"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          aria-label="six to midnight productions montage"
        >
          <source src="/assets/sixtomidnight-tribute.webm" type="video/webm" />
          <source src="/assets/sixtomidnight-tribute.mp4" type="video/mp4" />
        </video>
        <div className="relative z-10 px-6">
          <h2 className="font-mono text-sm uppercase tracking-[0.22em] text-[var(--coin)] md:text-base">
            remembering
          </h2>
          <h1
            className="mt-3 font-mono text-3xl font-bold uppercase tracking-[0.1em] md:text-6xl"
            style={{ color: "var(--white)" }}
          >
            102 Jackson Street
          </h1>
        </div>
      </section>

      <section className="pt-12 md:pt-18">
        <h3 className="mb-3 px-6 font-mono text-sm font-bold uppercase tracking-[0.22em] text-[var(--coin)] md:px-9">
          playlists
        </h3>
        <PlaylistSlider playlists={BENNY_PLAYLISTS} />
      </section>

      {markdown && (
        <section>
          <div className="mx-auto max-w-3xl px-6 py-18 md:px-9 md:py-24">
            <Prose content={markdown} />
          </div>
        </section>
      )}

      <section className="pb-18">
        <div className="mx-auto flex w-max flex-col items-center rounded-2xl border border-zinc-700 p-6 shadow-[inset_0_0_2px_black]">
          <h3 className="m-0 font-mono text-sm font-bold uppercase tracking-[0.22em] text-[var(--coin)]">
            Social Links
          </h3>
          <span className="mt-1.5 text-xs text-zinc-400">(archived)</span>
          <div className="mt-3 flex h-12 flex-row items-center gap-6">
            <a
              href="https://www.facebook.com/pages/Six-to-Midnight-Production-Studios/166143110389253"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="facebook"
              className="opacity-70 transition-opacity hover:opacity-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-9 w-9"
                aria-hidden="true"
              >
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12Z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/sixtomidnightproductions"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="instagram"
              className="opacity-70 transition-opacity hover:opacity-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-9 w-9"
                aria-hidden="true"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.069 1.646.069 4.85s-.011 3.584-.069 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.069-4.85.069s-3.584-.011-4.85-.069c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.416 2.175 8.796 2.163 12 2.163Zm0 1.802c-3.141 0-3.5.012-4.732.069-1.018.046-1.926.21-2.633.917-.708.708-.871 1.616-.917 2.633C3.66 8.5 3.648 8.859 3.648 12c0 3.141.012 3.5.069 4.732.046 1.018.21 1.926.917 2.633.708.708 1.616.871 2.633.917 1.232.057 1.591.069 4.732.069s3.5-.012 4.732-.069c1.018-.046 1.926-.21 2.633-.917.708-.708.871-1.616.917-2.633.057-1.232.069-1.591.069-4.732s-.012-3.5-.069-4.732c-.046-1.018-.21-1.926-.917-2.633-.708-.708-1.616-.871-2.633-.917C15.5 3.977 15.141 3.965 12 3.965Zm0 3.063A4.973 4.973 0 1 0 12 17a4.973 4.973 0 0 0 0-9.972Zm0 8.205a3.232 3.232 0 1 1 0-6.464 3.232 3.232 0 0 1 0 6.464ZM18.406 6.78a1.163 1.163 0 1 0-.001-2.327 1.163 1.163 0 0 0 .001 2.327Z" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <div className="relative w-full">
        <img
          src="/assets/sixtomidnight-banner.jpg"
          alt="Six to Midnight banner"
          className="block w-full"
        />
      </div>
    </main>
  );
}
