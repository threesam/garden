// What /thoughts/love-bombed shows: the finished piece taken apart, in the
// four parts Sam asked for (the song, the visual layers, the words and chorus,
// the cover). It reads backwards from the final cut, not through the turns it
// took: those are the raw log, content/thoughts/love-bombed.md, at /raw.
//
// The numbers come from the scripts that make the final cut
// (love-bombed-sound.py, love-bombed-render.sh, heads-spec.json in the portal
// repo). Addresses are written out whole so the build can fingerprint them.

export const PUBLISHED = "2026-10-13";
export const POSTER = "/assets/love-bombed/love-bombed-poster.jpg";
/** The picture a link to the page carries: 1200 x 630, where the poster is a tall frame. */
export const OG = "/assets/love-bombed/love-bombed-og.jpg";
export const VIDEO = "/assets/love-bombed/love-bombed.mp4";
/** How many phases the raw log has. */
export const TURNS = 60;
/** The piece is 89 bars of three: 1.0545 s a bar. */
export const BARS = 89;

export interface Clip {
  src: string;
  poster: string;
  alt: string;
  caption: string;
  /** How it was done, in a line. */
  how?: string;
  /** The clip carries its own sound (it still starts muted). */
  sound?: true;
  /** A strip across the page, not a whole frame. */
  wide?: true;
}

/** A stretch of the timeline, in bars from the start. */
export interface Span {
  from: number;
  len: number;
  /** Which guitar clip it is, by its number in `song`. */
  n?: number;
  /** There, but under something else. */
  faint?: true;
}

/** Where it started: the loop everything else was played over. */
export const loop = {
  /** The loop's loudness, 240 slices across its four bars, 0 to 99. Drawn in pink. */
  peaks: [8,4,7,11,55,80,79,72,68,43,79,89,57,18,29,21,7,1,1,4,21,20,15,13,10,7,5,7,4,2,3,0,0,0,1,0,0,0,0,0,3,2,1,4,10,10,21,7,10,6,5,4,1,1,0,0,0,0,0,0,4,2,57,99,90,55,68,60,65,57,52,22,29,35,22,22,7,6,8,4,6,4,5,5,2,2,3,2,1,1,0,0,1,0,0,0,1,1,0,2,8,4,5,3,2,1,1,2,2,1,0,0,0,0,0,0,0,0,0,0,2,1,6,23,64,49,36,14,11,20,20,21,20,42,25,15,5,1,1,1,1,3,1,1,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,2,1,0,0,0,0,0,1,1,1,1,0,1,1,1,0,0,0,0,3,3,9,10,17,29,49,48,46,24,46,31,37,42,68,26,17,3,1,6,6,5,4,5,6,8,13,9,6,15,20,13,17,9,3,1,1,1,1,0,5,4,16,13,10,7,7,6,9,12,26,13,18,16,14,13,28,13,13,15],
  bars: 4,
  beats: 3,
  alt: "the waveform of the loop: four bars of three, a big low sound on each one and smaller ones between",
  sound: "/assets/love-bombed/three-four-soft.m4a",
  caption:
    "the loop came first: a voice memo of mouth drums, snapped to four bars of three. every take was played over it",
} as const;

/** The guitar, in the order it plays. */
export const song: readonly (Clip & { bars: string })[] = [
  {
    src: "/assets/love-bombed/song-center.mp4",
    poster: "/assets/love-bombed/song-center-poster.jpg",
    alt: "hands on a guitar in flat wine on flat pink, the player sitting in the middle of the frame",
    caption: "the center take. its first half four times, then all of it",
    bars: "bars 1 to 48",
    sound: true,
  },
  {
    src: "/assets/love-bombed/song-bottom-left.mp4",
    poster: "/assets/love-bombed/song-bottom-left-poster.jpg",
    alt: "the same guitar and hands in wine on pink, the player lower and to the left",
    caption: "the bottom-left take, whole",
    bars: "bars 49 to 64",
    sound: true,
  },
  {
    src: "/assets/love-bombed/song-top-right.mp4",
    poster: "/assets/love-bombed/song-top-right-poster.jpg",
    alt: "the guitar neck coming down from the top right corner in wine on pink",
    caption: "the top-right take",
    bars: "bars 65 to 72",
    sound: true,
  },
  {
    src: "/assets/love-bombed/song-backwards.mp4",
    poster: "/assets/love-bombed/song-backwards-poster.jpg",
    alt: "the bottom-left take running backwards in wine on pink",
    caption:
      "the first quarter of the bottom-left take, backwards, four times, fading",
    bars: "bars 73 to 88",
    sound: true,
  },
];

/** The rows of the timeline. */
export const timeline: readonly { label: string; spans: readonly Span[] }[] = [
  {
    label: "mouth drums",
    spans: [
      { from: 0, len: 72, faint: true },
      { from: 72, len: 15 },
    ],
  },
  {
    label: "guitar",
    spans: [
      { from: 0, len: 8, n: 1 },
      { from: 8, len: 8, n: 1 },
      { from: 16, len: 8, n: 1 },
      { from: 24, len: 8, n: 1 },
      { from: 32, len: 16, n: 1 },
      { from: 48, len: 16, n: 2 },
      { from: 64, len: 8, n: 3 },
      { from: 72, len: 4, n: 4 },
      { from: 76, len: 4, n: 4 },
      { from: 80, len: 4, n: 4 },
      { from: 84, len: 4, n: 4 },
    ],
  },
  { label: "spoken", spans: [{ from: 12, len: 62 }] },
  {
    label: "sung",
    spans: [
      { from: 73, len: 2 },
      { from: 77, len: 2 },
      { from: 81, len: 2 },
      { from: 85, len: 2 },
    ],
  },
];

/** The picture, from the back to the front. */
export const visual: readonly Clip[] = [
  {
    src: "/assets/love-bombed/layer-letters.mp4",
    poster: "/assets/love-bombed/layer-letters-poster.jpg",
    alt: "four bars, no sound: an older phone video drawn in rows of small letters, wine on pink",
    caption: "at the back, older phone videos",
    how: "letters: each small cell of the picture becomes one letter. the darker the picture, the denser the letter",
  },
  {
    src: "/assets/love-bombed/layer-guitar.mp4",
    poster: "/assets/love-bombed/layer-guitar-poster.jpg",
    alt: "four bars, no sound: the guitar in flat wine over the letters",
    caption: "over them, the guitar",
    how: "two colours: darker than 60 percent goes flat wine. the rest goes clear, so the letters show through",
  },
  {
    src: "/assets/love-bombed/layer-pink.mp4",
    poster: "/assets/love-bombed/layer-pink-poster.jpg",
    alt: "four bars, no sound: the bottom of the frame on its own, four small pink heads and the words my love on plain wine",
    caption: "on top, along the bottom, the words and the heads",
    how: "one grey video the size of the page: wherever it is dark, the page is painted pink",
    wide: true,
  },
];

/** The spoken piece, a line per caption, as it is written along the bottom. */
export const words: readonly string[] = [
  "10 years of birthdays",
  "of libra season",
  "i still don't know what that means",
  "but it doesn't matter",
  "what matters to me",
  "is ten years of mornings",
  "that start with your blue eyes",
  "adjusting to the light",
  "of the sunrise",
  "golden hair that catches it",
  "10 years of adventure",
  "not one resembling the next",
  "you become more different",
  "every day",
  "more generous",
  "more comfortable in your own skin",
  "in who you are",
  "and less concerned",
  "with how the world sees you",
  "which is good",
  "because we have plenty of world",
  "left to see",
  "and plenty of life",
  "left to live",
  "i've had ten years",
  "to realize how lucky i am",
  "to push for the next hundred",
  "with you",
  "my love",
];

export const chorus: Clip = {
  src: "/assets/love-bombed/chorus.mp4",
  poster: "/assets/love-bombed/chorus-poster.jpg",
  alt: "the last eighteen seconds: the guitar runs backwards and fades, four pink heads along the bottom sing my love, four times",
  caption:
    "the last spoken words are my love. the sung my love answers, four times, four bars apart, four heads each time",
  how: "the heads: nine phone videos of a face singing in front of a dark backdrop. the bright face is kept and painted pink, the backdrop goes clear",
  sound: true,
};

export const cover: Clip = {
  src: "/assets/love-bombed/story-title.mp4",
  poster: "/assets/love-bombed/story-title-poster.jpg",
  alt: "the first eight bars, no sound: rows of the words around the sun come up out of black and go back to it",
  caption: "the first eight bars",
  how: "around the sun, over and over, in Poiret One. the letters grow down the page, and each next phrase along a row gets three more dots before it. up from black corner to corner, then gone",
};

export const coverStills = [
  {
    src: "/assets/love-bombed/title-happy-birthday.webp",
    alt: "a strip of the title: one of the phrases says happy birthday",
    caption: "one of them says happy birthday",
  },
] as const;
