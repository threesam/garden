import type { Metadata } from "next";
import { MetaballCanvas } from "@/components/canvas/metaball-canvas";
import { getBooks, type Book } from "@/lib/goodreads";

export const metadata: Metadata = {
  title: "vibe — threesam",
  description: "Books, media, and the things that shape how I think.",
};

function BookCover({ book, eager }: { book: Book; eager?: boolean }) {
  return (
    <div className="group relative aspect-[2/3] md:hover:z-20">
      <a
        href={`https://www.goodreads.com/book/show/${book.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 origin-top-left overflow-hidden bg-zinc-900 md:transition md:duration-300 md:ease-out md:hover:will-change-transform md:group-hover:scale-[2] md:group-hover:shadow-2xl md:group-hover:shadow-black/60"
      >
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.cleanTitle}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-3 text-center text-xs text-zinc-600">
            {book.cleanTitle}
          </div>
        )}
      </a>
    </div>
  );
}

export default async function VibePage() {
  const books = await getBooks("read");
  const sorted = [...books].sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());

  return (
    <main className="copy-lower min-h-screen pb-16">
      <section className="relative flex h-[50dvh] items-center justify-center overflow-hidden">
        <MetaballCanvas />
        <h1 className="relative z-10 font-mono text-3xl font-bold tracking-[0.2em] text-white md:text-5xl">
          what&apos;s my vibe?
        </h1>
      </section>

      <style>{`
        @media (max-width: 639px) { .book-grid > *:nth-child(4n) > a { transform-origin: top right; } }
        @media (min-width: 640px) and (max-width: 767px) { .book-grid > *:nth-child(6n) > a { transform-origin: top right; } }
        @media (min-width: 768px) and (max-width: 1023px) { .book-grid > *:nth-child(8n) > a { transform-origin: top right; } }
        @media (min-width: 1024px) and (max-width: 1279px) { .book-grid > *:nth-child(10n) > a { transform-origin: top right; } }
        @media (min-width: 1280px) { .book-grid > *:nth-child(12n) > a { transform-origin: top right; } }
      `}</style>
      <section className="book-grid grid grid-cols-4 overflow-x-hidden sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
        {sorted.map((book, i) => (
          <BookCover key={book.id} book={book} eager={i < 24} />
        ))}
      </section>
    </main>
  );
}
