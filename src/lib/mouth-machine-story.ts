// The annotated telling of /thoughts/mouth-machine: what went onto the piece,
// one layer at a time, in the order it went on. The raw log it distils is
// content/thoughts/mouth-machine.md, served at /thoughts/mouth-machine/raw.
//
// `ask` is Sam, verbatim from the log (mouth-machine-story.test.ts checks it
// letter for letter). `title`, `told` and the captions are claude's.

export interface Still {
  kind: "img";
  src: string;
  alt: string;
  caption: string;
  /** A sound the picture plays when it is pressed. */
  sound?: string;
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
  /** What the ask put on, in a line or two. Left out where the creative says it. */
  told?: string;
  /** Where it sits in the raw log. The first is the one the layer links to. */
  phases: readonly [number, ...number[]];
  media: readonly (Still | Clip)[];
  /** Two stills meant to be read against each other, side by side. */
  pair?: true;
}

export const PUBLISHED = "2026-10-09";
export const POSTER = "/assets/mouth-machine/piece-19-poster.jpg";

export const layers: readonly Layer[] = [
  {
    title: "a beat",
    ask: "Can we make a really cool sample machine that looks at the clip and quantizes samples that you can then play with?",
    told: "a voice memo, nine seconds of mouth drums. the first three sounds were kept, boom, boom, pap, snapped to a count of four and set looping out of the Mac.",
    phases: [1, 3],
    media: [
      {
        kind: "img",
        src: "/assets/mouth-machine/take-1-beat.webp",
        alt: "waveform of the first voice memo, New Recording 22: nine seconds of mouth drums",
        caption:
          "the memo: boom, boom, pap, and a breath in. press the picture to hear it",
        sound: "/assets/mouth-machine/take-1-beat.m4a",
      },
      {
        kind: "img",
        src: "/assets/mouth-machine/memo-first-look.webp",
        alt: "a spectrogram of the same memo in seafoam: each mouth sound is a bright streak or arc",
        caption:
          "the first picture made of it. the same nine seconds as every frequency in the sound: low at the bottom, brighter where there is more",
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
        src: "/assets/mouth-machine/take-2-over-the-beat.webp",
        alt: "waveform of the second voice memo, busier than the first, recorded while the loop played in the room",
        caption: "the second take, over the beat",
      },
      {
        kind: "img",
        src: "/assets/mouth-machine/take-3-go-to-sleep.webp",
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
        src: "/assets/mouth-machine/piece-4-one-ring-one-bar.webp",
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
        src: "/assets/mouth-machine/guitar-only-second-video.webp",
        alt: "two waveforms of the same five bars: as the phone heard them, and with the room loop turned down so the gaps between notes go quiet",
        caption: "top, as the phone heard it. bottom, the room loop turned down",
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
        src: "/assets/mouth-machine/video-4-in-the-dark.webp",
        alt: "a dark, grainy still from the first phone video: Sam in profile with a guitar",
        caption: "as filmed",
      },
      {
        kind: "img",
        src: "/assets/mouth-machine/seafoam-and-olive.webp",
        alt: "a filtered still in two flat colours, seafoam shapes on olive, with the ask set over it as a block quote",
        caption: "filtered",
      },
    ],
  },
  {
    title: "night",
    ask: "I think having everything black background and then the sea foam movement would be nicer.",
    told: "the whole piece goes onto black, with seafoam for everything that moves. the guitar came up with it, and the loop and the hiss stayed where they were.",
    phases: [41],
    media: [
      {
        kind: "clip",
        src: "/assets/mouth-machine/story-night.mp4",
        poster: "/assets/mouth-machine/story-night-poster.jpg",
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
        src: "/assets/mouth-machine/story-go-round.mp4",
        poster: "/assets/mouth-machine/story-go-round-poster.jpg",
        alt: "the last bar into the first, no sound: a seafoam ring on black closes to a point and opens from it again",
        caption: "the last bar, into the first",
      },
    ],
  },
];

/** Give the raw log's phase headings an id, so a layer can link to its phases. */
export const withPhaseIds = (html: string): string =>
  html.replace(/<h2 ([^>]*)>Phase (\d+):/g, '<h2 id="phase-$2" $1>Phase $2:');
