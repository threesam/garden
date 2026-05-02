import wordsData from "@/data/messages/dianchik/words-data.json";

export function TotalWords() {
  const total = wordsData.sam_total_words + wordsData.dia_total_words;
  return (
    <div>
      <span className="font-mono text-[10px] text-zinc-500">words written</span>
      <p className="mt-1.5 text-2xl font-bold text-black">
        {total.toLocaleString()}
      </p>
      <div className="mt-3 space-y-1">
        <div className="flex justify-between font-mono text-[10px] text-zinc-500">
          <span>sam</span>
          <span>{wordsData.sam_total_words.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-mono text-[10px] text-zinc-500">
          <span>dianchik</span>
          <span>{wordsData.dia_total_words.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export function BusiestDay() {
  return (
    <div>
      <span className="font-mono text-[10px] text-zinc-500">busiest day</span>
      <p className="mt-1.5 text-2xl font-bold text-black">
        {wordsData.peak_messages.count}
      </p>
      <p className="mt-1.5 font-mono text-[10px] text-zinc-500">
        messages on {wordsData.peak_messages.date}
      </p>
    </div>
  );
}

export function MostWords() {
  return (
    <div>
      <span className="font-mono text-[10px] text-zinc-500">most words in a day</span>
      <p className="mt-1.5 text-2xl font-bold text-black">
        {wordsData.peak_words.count.toLocaleString()}
      </p>
      <p className="mt-1.5 font-mono text-[10px] text-zinc-500">
        words on {wordsData.peak_words.date}
      </p>
    </div>
  );
}
