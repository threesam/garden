"use client";

import dynamic from "next/dynamic";

const WordCloud = dynamic(
  () => import("@/components/messages/word-cloud").then((m) => ({ default: m.WordCloud })),
  { ssr: false, loading: () => <div style={{ height: 400 }} /> }
);

export function LazyWordCloud() {
  return <WordCloud />;
}
