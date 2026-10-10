// The annotated telling of /thoughts/mouth-machine: what went onto the piece,
// one layer at a time, in the order it went on. The raw log it distils is
// content/thoughts/mouth-machine.md, served at /thoughts/mouth-machine/raw.
//
// `ask` is Sam, verbatim from the log (mouth-machine-story.test.ts checks it
// letter for letter). `title`, `told` and the captions are claude's.

interface Still {
  kind: "img";
  src: string;
  alt: string;
  caption: string;
}

interface Clip {
  kind: "clip";
  src: string;
  poster: string;
  alt: string;
  caption: string;
}

export interface Layer {
  title: string;
  ask: string;
  told: string;
  /** Where it sits in the raw log. The first is the one the layer links to. */
  phases: readonly [number, ...number[]];
  media: readonly (Still | Clip)[];
  /** Two stills meant to be read against each other, side by side. */
  pair?: true;
  /** One wide still under the rest: a row of frames, read left to right. */
  strip?: Still;
}

const A = "/assets/mouth-machine";

export const PUBLISHED = "2026-10-09";
export const POSTER = `${A}/piece-19-poster.jpg`;

export const layers: readonly Layer[] = [
  {
    title: "a beat",
    ask: "Can we make a really cool sample machine that looks at the clip and quantizes samples that you can then play with?",
    told: "a voice memo, nine seconds of mouth drums. the first three sounds were kept, boom, boom, pap, snapped to a count of four and set looping out of the Mac.",
    phases: [1, 3],
    media: [
      {
        kind: "img",
        src: `${A}/take-1-beat.webp`,
        alt: "waveform of the first voice memo, New Recording 22: nine seconds of mouth drums",
        caption: "the memo: boom, boom, pap, and a breath in",
      },
    ],
  },
  {
    title: "two more takes, left as played",
    ask: "First layer is conformed to a beat. Every layer after that has no quantization. It's just meant to be played exactly as it is on top.",
    told: "a second memo, recorded on the phone while the beat played in the room. it sits where it was played. then a voice saying go to sleep, which comes around every four bars.",
    phases: [4, 5],
    media: [
      {
        kind: "img",
        src: `${A}/take-2-over-the-beat.webp`,
        alt: "waveform of the second voice memo, busier than the first, recorded while the loop played in the room",
        caption: "the second take, over the beat",
      },
      {
        kind: "img",
        src: `${A}/take-3-go-to-sleep.webp`,
        alt: "waveform of the third voice memo: one burst at the start, then a flat line of room sound",
        caption: "the third: the words, then the room",
      },
    ],
  },
  {
    title: "drops, one a bar",
    ask: "I need the drops on the desktop screensaver looking thing to line up exactly with the tempo beats.",
    told: "the drops on the screen were falling on a timer of their own. now the player that makes the sound tells the screen where the beat is. one ring opens on the one and is gone as the next lands.",
    phases: [7, 22],
    media: [
      {
        kind: "img",
        src: `${A}/piece-4-one-ring-one-bar.webp`,
        alt: "one ring, step by step, opening from a dot until it is wider than the frame",
        caption: "one ring, one bar",
      },
    ],
  },
  {
    title: "a guitar, over the loop",
    ask: "the loop should be the thing that plays and we should phase out the loop of the video so we just hear guitar.",
    told: "two phone videos of a guitar played over the loop in a dark room. the phone heard the loop too, so it was turned down in the videos' sound until the guitar is what is left. the loop under it is the clean one, from the file.",
    phases: [9, 10, 19, 27],
    media: [
      {
        kind: "img",
        src: `${A}/guitar-only-second-video.webp`,
        alt: "two waveforms of the same five bars: as the phone heard them, and with the room loop turned down so the gaps between notes go quiet",
        caption:
          "top, as the phone heard it. bottom, the room loop turned down",
      },
    ],
  },
  {
    title: "two colours",
    ask: "can we filter video so everything above x threshold brightness goes white (seafoam), and below goes black (olive)",
    told: "every pixel is one of two colours. the room is dark, so the line between them sits low. the light in the room swells with the drops, so the shapes swell with the bar.",
    phases: [11],
    pair: true,
    media: [
      {
        kind: "img",
        src: `${A}/video-4-in-the-dark.webp`,
        alt: "a dark, grainy still from the first phone video: Sam in profile with a guitar",
        caption: "as filmed",
      },
      {
        kind: "img",
        src: `${A}/seafoam-and-olive.webp`,
        alt: "a filtered still in two flat colours, seafoam shapes on olive, with the ask set over it as a block quote",
        caption: "filtered",
      },
    ],
    strip: {
      kind: "img",
      src: `${A}/seafoam-six-lines.webp`,
      alt: "one filtered frame seven times, side by side. at the lowest line seafoam floods the wall and breaks up into speckle. at the highest only a head and the top of a guitar are left. the last is rough with grain",
      caption:
        "one frame, the line moved six times: 3, 3.5, 4, 4.5, 5.5 and 7 out of 100. the last is 4.5 again, with no softening",
    },
  },
  {
    title: "night",
    ask: "I think having everything black background and then the sea foam movement would be nicer.",
    told: "the whole piece goes onto black, with seafoam for everything that moves. the guitar came up with it, and the loop and the hiss stayed where they were.",
    phases: [41],
    media: [
      {
        kind: "clip",
        src: `${A}/story-night.mp4`,
        poster: `${A}/story-night-poster.jpg`,
        alt: "two bars of the second guitar video, no sound: seafoam shapes on black, swelling with the bar",
        caption: "two bars, as they are in the piece",
      },
    ],
  },
  {
    title: "the go-round",
    ask: "reverse drops at end so the last one collapses into the starting point of the first one -- perfect loop",
    told: "sixteen bars: one drop, a third video, the two guitar videos, then the same drop run backwards, closing into the point it opens from. the beat carries over the join.",
    phases: [43],
    media: [
      {
        kind: "clip",
        src: `${A}/story-go-round.mp4`,
        poster: `${A}/story-go-round-poster.jpg`,
        alt: "the last bar into the first, no sound: a seafoam ring on black closes to a point and opens from it again",
        caption: "the last bar, into the first",
      },
    ],
  },
];

/** The one that finished it. It closes the story, just above the piece. */
export const LAST_ASK = {
  ask: "dont need the fade on last video just cut when done",
  told: "the last ask. the picture holds to the end of its bar, the drop comes back in, and it goes round.",
  phases: [44],
} as const;

/** Give the raw log's phase headings an id, so a layer can link to its phases. */
export const withPhaseIds = (html: string): string =>
  html.replace(/<h2 ([^>]*)>Phase (\d+):/g, '<h2 id="phase-$2" $1>Phase $2:');
