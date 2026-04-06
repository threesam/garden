import type { Metadata } from "next";
import { MetaballCanvas } from "@/components/canvas/metaball-canvas";
import { getBooks, type Book } from "@/lib/goodreads";

export const metadata: Metadata = {
  title: "vibe — threesam",
  description: "Books, media, and the things that shape how I think.",
};

function Stars({ rating }: { rating: number }) {
  if (rating === 0) return null;
  return (
    <span className="font-mono text-[10px] tracking-wider text-zinc-500">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

function BookCover({ book, eager }: { book: Book; eager?: boolean }) {
  return (
    <div className="group relative aspect-[2/3] md:hover:z-20">
      <a
        href={`https://www.goodreads.com/book/show/${book.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 overflow-hidden bg-zinc-900 md:transition md:duration-300 md:ease-out md:hover:will-change-transform md:group-hover:scale-[1.8] md:group-hover:shadow-2xl md:group-hover:shadow-black/60"
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
        <div className="pointer-events-none absolute inset-0 hidden flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-200 md:flex md:group-hover:opacity-100">
          <p className="text-xs font-medium leading-tight text-white">
            {book.cleanTitle}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400">{book.author}</p>
          <Stars rating={book.rating} />
        </div>
      </a>
    </div>
  );
}

export default async function VibePage() {
  const books = await getBooks("read");
  const sorted = [...books].sort((a, b) => {
    const dateA = a.readAt?.getTime() ?? a.addedAt.getTime();
    const dateB = b.readAt?.getTime() ?? b.addedAt.getTime();
    return dateB - dateA;
  });

  return (
    <main className="copy-lower min-h-screen pb-16">
      <section className="relative flex h-[50dvh] items-center justify-center overflow-hidden">
        <MetaballCanvas />
        <h1 className="relative z-10 font-mono text-3xl font-bold tracking-[0.2em] text-white md:text-5xl">
          what&apos;s my vibe?
        </h1>
      </section>

      <section className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
        {sorted.map((book, i) => (
          <BookCover key={book.id} book={book} eager={i < 24} />
        ))}
      </section>
    </main>
  );
}
