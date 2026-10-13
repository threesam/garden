// The annotated telling of /thoughts/love-bombed: the steps that moved the
// piece forward, in the order they went on. The raw log it distils is
// content/thoughts/love-bombed.md, served at /thoughts/love-bombed/raw.
//
// `ask` is Sam, verbatim from the log (love-bombed-story.test.ts checks it
// letter for letter). The titles and captions are claude's. No `told` here:
// the creative says what the ask put on. Addresses are written out whole, so
// the build can fingerprint them.

import type { Layer } from "./mouth-machine-story";

export const PUBLISHED = "2026-10-13";
export const POSTER = "/assets/love-bombed/love-bombed-poster.jpg";
/** How many phases the raw log has. */
export const TURNS = 60;

export const layers: readonly Layer[] = [
  {
    title: "a beat in three",
    ask: "It should be 3-4 timing.",
    phases: [1, 2],
    media: [
      {
        kind: "img",
        src: "/assets/love-bombed/three-four-snapped.webp",
        alt: "two waveforms of a voice memo of mouth sounds: as played, and snapped to its own beat",
        caption: "the loop. press the picture to hear it",
        sound: "/assets/love-bombed/three-four-soft.m4a",
      },
    ],
  },
  {
    title: "its own colours",
    ask: "This one's not called Seafoam. So it should be different.",
    phases: [5, 6],
    media: [
      {
        kind: "clip",
        src: "/assets/love-bombed/story-first-look.mp4",
        poster: "/assets/love-bombed/story-first-look-poster.jpg",
        alt: "four bars, no sound: hands on a guitar in flat wine on flat pink",
        caption: "a guitar over the loop, in pink and wine",
      },
    ],
  },
  {
    title: "three guitars",
    ask: "cut the one video with threshold effect and beat underneath and the sequencing of clips.",
    phases: [9, 10],
    media: [
      {
        kind: "clip",
        src: "/assets/love-bombed/story-three-guitars.mp4",
        poster: "/assets/love-bombed/story-three-guitars-poster.jpg",
        alt: "four bars, no sound: one guitar take cuts to another, both in wine on pink",
        caption: "one take into the next, on the beat",
      },
    ],
  },
  {
    title: "old videos, in letters",
    ask: "I don't need transparent letters. I need black letters, right?",
    phases: [13, 14],
    media: [
      {
        kind: "clip",
        src: "/assets/love-bombed/story-letters.mp4",
        poster: "/assets/love-bombed/story-letters-poster.jpg",
        alt: "four bars, no sound: behind the guitar, an older video drawn in rows of small letters",
        caption: "behind the guitar, years of phone videos",
      },
    ],
  },
  {
    title: "twelve heads",
    ask: "4 corners x 3 measures = the twelve takes",
    phases: [17, 20, 41],
    media: [
      {
        kind: "clip",
        src: "/assets/love-bombed/story-heads.mp4",
        poster: "/assets/love-bombed/story-heads-poster.jpg",
        alt: "four bars, no sound: four small pink heads along the bottom sing, with the words my love between them",
        caption: "four at a time, singing my love",
      },
    ],
  },
  {
    title: "the end, backwards",
    ask: "nah go straight to the reverses but reverse the whole clip first, then do the quarter reverses until it ends",
    phases: [27],
    media: [
      {
        kind: "clip",
        src: "/assets/love-bombed/story-backwards.mp4",
        poster: "/assets/love-bombed/story-backwards-poster.jpg",
        alt: "four bars, no sound: the guitar take running backwards over a video in letters",
        caption: "the first take, run backwards",
      },
    ],
  },
  {
    title: "the words",
    ask: "the last word I say is my love, and my love should line up with the my loves in the outro",
    phases: [27, 58, 60],
    media: [
      {
        kind: "img",
        src: "/assets/love-bombed/captions-band.webp",
        alt: "four lines of the spoken piece in thin pink letters on wine: that start with your blue eyes, with how the world sees you, left to live, to realize how lucky i am",
        caption: "spoken over it, and written along the bottom",
      },
    ],
  },
  {
    title: "around the sun",
    ask: "and replace one around the sun with happy birthday",
    phases: [44, 47],
    media: [
      {
        kind: "clip",
        src: "/assets/love-bombed/story-title.mp4",
        poster: "/assets/love-bombed/story-title-poster.jpg",
        alt: "eight seconds, no sound: rows of the words around the sun come up out of black, growing as they go down",
        caption: "the first eight seconds",
      },
    ],
  },
];
