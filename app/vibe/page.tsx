import type { Metadata } from "next";
import { MetaballCanvas } from "@/components/canvas/metaball-canvas";
import { getBooks, type Book } from "@/lib/goodreads";

export const metadata: Metadata = {
  title: "vibe — threesam",
  description: "Books, media, and the things that shape how I think.",
};

function BookCover({ book, eager }: { book: Book; eager?: boolean }) {
  return (
    <a
      href={`https://www.goodreads.com/book/show/${book.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block break-inside-avoid p-1 md:transition-[background-color,box-shadow] md:duration-300 md:ease-out md:hover:z-10 md:hover:bg-[var(--coin)] md:hover:shadow-[0_0_0_4px_var(--coin)]"
    >
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt={book.cleanTitle}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="block w-full md:transition-[filter] md:duration-300 md:group-hover:grayscale"
        />
      ) : (
        <div className="flex aspect-[2/3] w-full items-center justify-center bg-zinc-900 p-3 text-center text-xs text-zinc-600">
          {book.cleanTitle}
        </div>
      )}
    </a>
  );
}

export default async function VibePage() {
  const books = await getBooks("read");
  const sorted = [...books].sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());

  return (
    <main
      className="copy-lower min-h-screen pb-16"
      style={{ background: "linear-gradient(to bottom, var(--black) 40%, var(--white))", color: "var(--white)" } as React.CSSProperties}
    >
      <section
        className="relative flex h-[50dvh] items-center justify-center overflow-hidden"
        style={{
          background: "var(--black)",
          cursor: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><text y='24' font-size='24'>🧲</text></svg>") 16 16, auto`,
        }}
      >
        <MetaballCanvas color={[0.91, 0.64, 0.09]} />
        <h1 className="pointer-events-none relative z-10 font-mono text-3xl font-bold tracking-[0.2em] md:text-5xl" style={{ color: "var(--black)" }}>

          what&apos;s my vibe?
        </h1>
      </section>

      <section className="columns-4 gap-0 overflow-hidden py-1 sm:columns-6 md:columns-8 lg:columns-10 xl:columns-12">
        {sorted.map((book, i) => (
          <BookCover key={book.id} book={book} eager={i < 24} />
        ))}
      </section>
    </main>
  );
}
