A plain record of the turns taken: what Sam asked for, what came back, what was kept.
It is not a code changelog. The code has git for that. This is the story of the thing being made.

"Mouth machine" is a working name. Nobody has named this yet.

## How this is kept

- One entry per turn that changes what is heard. Sam's words are quoted as typed or spoken.
- Every such turn is also a commit, with three things in it:
  - `takes/` is what Sam recorded, untouched
  - `states/` is one full cycle of the loop each time Sam said keep it, saved lossless
  - `sketch/` is the scripts that got from one to the other
  - `cuts/` is pieces cut out of a take on the bar lines, sound only
  - `pictures/` is what it looked like: each take with its title, the screen, stills from the videos
- `NOTES.md` is the other half: how the work itself goes, what slows it down, what to change.
- A state is only "kept" when Sam says so. Until then it is marked not yet kept.
- Versions are counted by what the thing can do, not by commits. The list is "Versions, by what it can do", below. A new line goes in only when something became possible that was not before.
- Every thing that got made is tied to what it was made from and the words that asked for it: the voice note, the ask, the loop. That chain is the next section, "From seed to now". It gets a new line whenever something new exists.

## Rules Sam has set

- "First layer is conformed to a beat. Every layer after that has no quantization. It's just meant to be played exactly as it is on top."
- The kept version is the one playing when Sam said it was good. Not a later rebuild of it.
- Nothing that is playing gets swapped without saying so first.
- Least possible delay between a tap and a sound. "If native means potentially zero latency, that should be what we use."

## From seed to now

The whole thing in one line each: what it started as, what Sam said, what it turned into. The phases below tell each step in full.

**The beat**
1. Seed: a voice memo, mouth drums. `takes/1-beat.m4a`
2. The ask: "Can we make a really cool sample machine that looks at the clip and quantizes samples that you can then play with?"
3. Then, trimming it down: "kill silence front end, start with beat, clip to maybe 8", and "only gone me those first 3 beats over 4 count, quantized"
4. What it became: boom, boom, pap, snapped to the beat, four counts. `states/1-boom-boom-pap.flac`. "Yeah, this is great." (phases 1 to 3)

**The second layer**
1. Seed: a second voice memo, recorded on the phone while the beat played in the room. `takes/2-over-the-beat.m4a`
2. The ask: "use this drum signal, the first loop signal, to cancel out it on this layered signal on top, that becomes the new loop and you know the placement"
3. What it became: the layer on its own, drums turned down, left where it was played. `cuts/2-over-the-beat-layer.flac`
4. Laid over the beat: `states/2-two-layers.flac`. "first two layers were perfect" (phase 4)
5. Later: "a bit lower volume, with high pitch should be softened". `cuts/2-over-the-beat-layer-softer.flac` (phase 18)
6. Then "drop db more on second loop", then "down 13". Same file, rebuilt each time (phase 20)

**The drums, an octave down**
1. Seed: the two drum layers above
2. The ask: "what would it be like if we dropped the first two loops (drums) pitch down by 12 and rounded out of the lower tones, and makes sure the upper mid are softly audible"
3. What it became: `cuts/drums-octave-down.flac`, and with the voice `states/5-drums-octave-down.flac`. A listening version, not kept. (phase 24)

**The voice**
1. Seed: a third voice memo. `takes/3-go-to-sleep.m4a`
2. The ask: "Overlaid with me saying to go to sleep, which is the first thing I say in it. Trimmed to the front, and then just let the rest play out."
3. What it became: `cuts/3-go-to-sleep-layer.flac`, the quiet before the words cut off
4. Laid over the other two, every four bars: `states/3-go-to-sleep.flac`, twelve bars (phase 5)

**The screen**
1. Seed: the drops on the Maschine pads and the Portal screen, falling on their own timer
2. The ask: "I need the drops on the desktop screensaver looking thing to line up exactly with the tempo beats."
3. What it became: the loop plays through Portal's own player, and the drops fall on the one. (phase 7)

**The videos**
1. Seed: two phone videos of Sam playing guitar over the loop in the dark. Sound in `takes/4-guitar-in-the-dark.m4a` and `takes/5-guitar-with-an-ending.m4a`
2. The asks: "I need the last four measures", then "there's like two measures before that I think I was on point, and that's where the loop should be. But then I should also have this ending as a sample too."
3. What they became: cuts on the bar lines, found by the drums in the room. `cuts/4-*`, `cuts/5-*` (phases 9 and 10)
4. Later: "the audio from video should have canceled out drums so we just hear guitar". `cuts/4-four-bars-guitar-only.flac`, `cuts/5-last-five-bars-guitar-only.flac` (phase 19)

**The look**
1. The ask: "can we filter video so everything above x threshold brightness goes white (seafoam), and below goes black (olive)"
2. What it became: two colours, one line. (phases 11 and 12)

**The piece**
1. "run the first one once and the second one twice": `piece-1.mp4` (phase 13)
2. "the first one twice, last one last": `piece-2.mp4` (phase 14)
3. Drops first, the videos, then "go to sleep" alone: `piece-3.mp4` (phase 15)
4. "the last drop should be allowed to fade all the way out": `piece-3-carry.mp4` and `piece-3-wait.mp4` (phase 16)
5. "the second video ends too abruptly and should play all the way out", and "drops need to be whole notes": `piece-4-four-drops.mp4` (phases 21, 22 and 25)
6. "double drops (more measures) at the beginning so we get full spiral": `piece-4-sixteen-drops.mp4` (phase 26)
7. "measure of second drum loop first then full drums one measure then go to sleep": `piece-5-second-loop-as-recorded.mp4` and `piece-5-second-loop-down-13.mp4` (phase 26)
8. "the loop should be the thing that plays and we should phase out the loop of the video so we just hear guitar. and kill the last go to sleep": `piece-6-beat-then-loop.mp4` and `piece-6-loop-all-through.mp4` (phase 27)
9. "i would like to see the inner 4 start out": `piece-7-inner-four.mp4` and `piece-7-inner-four-long-fade.mp4` (phase 28)
10. "i don’t like the random grain that was added to drops, the drops can get thicker rings": `piece-8-clean-rings.mp4` and `piece-8-clean-rings-long-fade.mp4` (phase 30)
11. "no just fade to black, i don’t like the video repeat, just one for each, and fade out should go to olive": `piece-9-ends-on-video.mp4` and `piece-9-rings-fade.mp4` (phase 31)
12. "no drops at the end": `piece-10-no-drops-at-the-end.mp4`, made and not sent (phase 32)
13. "i kind of like it all white bg, including drops, the drops should be grain (just no random grain noise in the whole video)", then "no, end with light too": `piece-11-light-ground.mp4` (phases 32 to 34)
14. "the grain looks bad, go back to organics": `piece-12-smooth-rings.mp4` (phase 35)
15. "where’s music video": `piece-13-black-white-grain.mp4` (phase 37)
16. "no, white bg pls": `piece-14-white-ground-black-grain.mp4` (phase 38)
17. "can you replace a couple measures with the video i just airdropped (i basically want the whole video in there", then "let's try seafoam bg and olive bg": `piece-15-third-video-seafoam.mp4`, `piece-15-third-video-olive.mp4` and `piece-15-third-video-squeezed-seafoam.mp4` (phase 40)
18. "I think having everything black background and then the sea foam movement would be nicer.", then "we got to make sure that the guitar from the video is actually louder.": `piece-16-night-guitar-up.mp4` and `piece-16-night-guitar-even.mp4` (phase 41)
19. "yea, videos are good if we phase out the loop we recorded over": `piece-17-room-loop-out.mp4` and `piece-17-room-loop-out-guitar-alone.mp4`. Both were wrong, each in its own way (phases 42 and 43)
20. "reverse drops at end so the last one collapses into the starting point of the first one -- perfect loop": `piece-18-round.mp4`, sixteen bars that go round (phase 43)
21. "dont need the fade on last video just cut when done": `piece-19-round-cut.mp4` (phase 44)

## Phase 1: a voice memo becomes a beat

Thursday October 8, 2026, 8:38 pm

**Sam:** "I just dropped a little beat voice memo [...] It was like a boom, boom, pap, and then a breathe in. [...] Can we make a really cool sample machine that looks at the clip and quantizes samples that you can then play with?"

What came back: a page that listens to the memo, finds each sound, sorts them by kind, snaps them to a grid and lets you play them back and move them around.

Then: "i like 77bpm", "now play it", "just play on loop". The loop started playing out of the Mac.

Take: `takes/1-beat.m4a`

![the first take](/assets/mouth-machine/take-1-beat.webp)

## Phase 2: go native

8:45 pm

**Sam:** "We want the absolute minimum latency here for whatever we decide to do. [...] I have an iPhone and I have a Mac. [...] I think we should probably go native, at least to try it out."

What came back: a small native program, `chop`, that does what the page does without a browser in the way. On Sam's audio interface it hands sound to the speakers in chunks of 1.3 thousandths of a second.
It is waiting for review in pull request 32. It has not been wired to the pads, and there is nothing for the phone yet.

## Phase 3: finding the beat that was actually played

8:47 to 8:54 pm

**Sam:** "how many beats?" then "kill silence front end, start with beat, clip to maybe 8"

**Sam:** "what was this even like originally, quantization might be wild"

That question found a real mistake. The first version had counted the beat wrong: it heard sixteenth notes at 77. What Sam played was eighth notes at 111. Same speed in the room, counted on the wrong ruler, and the wrong ruler was dragging sounds as much as 84 thousandths of a second off where they were played. On the right one the worst is 51.
So the 77 Sam liked was never a tempo choice. It was how fast Sam was already going.

**Sam:** "and only gone me those first 3 beats over 4 count, quantized"

What came back: boom, boom, pap, snapped to the beat, over a count of four.

**Sam:** "let me hear original", then "yeah first 3 sounds", then "Yeah, this is great."

**Kept: `states/1-boom-boom-pap.flac`**

## Phase 4: a second layer, played over the first

8:57 to 9:12 pm

**Sam:** "I want you to take the voice memo I just sent again, and I want you to overlay it. You should be able to hear the drums in the background. So then if you could use this drum signal, the first loop signal, to cancel out it on this layered signal on top, that becomes the new loop and you know the placement"

Take: `takes/2-over-the-beat.m4a`, recorded on the phone while the loop played in the room.

![the second take](/assets/mouth-machine/take-2-over-the-beat.webp)

What came back:
- Placement came from the recording itself. The drums are faintly in it, so it is known exactly where in the bar Sam started.
- The layer is not snapped to anything. It sits where it was played.
- The drums in the recording were turned down, by about 11 decibels where a drum hit stands alone. That is turning down, not true cancelling. True cancelling was tried and measured at nothing: a phone in a room does not hear the same drum the same way twice.

What went wrong on the way: playback was switched to the new native program without asking, and that program was squashing the sound.

**Sam:** "Put the first layer back to what it was right now, please." "Sounds like the sample how it was got distorted somehow." "Needs to be where it says EF first three sounds, like I need that version. That's when I said it was great."

The exact kept file went back on. The squashing was taken out of the program. Two of the rules above come from this.

Choices made without asking, still open to change: the layer is two bars long, and how loud it sits.

**Sam, at 9:12:** "first two layers were perfect"

**Kept: `states/2-two-layers.flac`**

## Phase 5: a third layer

9:10 pm

**Sam:** "Do the one I just sent. Overlaid with me saying to go to sleep, which is the first thing I say in it. Trimmed to the front, and then just let the rest play out."

Take: `takes/3-go-to-sleep.m4a`

![the third take](/assets/mouth-machine/take-3-go-to-sleep.webp)

What came back:
- The half second of quiet before "go to sleep" is cut. The rest of the take plays out whole, all 9.8 seconds.
- The loop cannot be heard in this recording, so this time there was nothing to place it by. The first word is on the first beat. It comes around every four bars.
- Nothing was cleaned out of it. After the words it is the sound of the room, and that is in the loop now.
- The first two layers are the same samples as the kept state. Checked, not assumed.

**Sam:** "second loop got moved a bit"

Not resolved. Nothing in the layers had changed. Best guess: the loop was a five minute file that restarted with a bump, and one restart landed just then. It is a thirty minute file now. Sam has not confirmed that was it.

**Not yet kept: `states/3-go-to-sleep.flac`**

## Phase 6: keeping track

9:14 pm

**Sam:** "whatever this project is feels like it needs to be tracked. [...] I feel like everything should have been a commit so far, for sure. It should be version controlled, but also there should be phases. [...] Like what were the turns that were taken? [...] But not tech. More from communication, documentation of whatever it is that I'm doing."

What came back: this file, and the takes, states and sketches beside it.

One gap, said plainly: the small script that laid the second layer onto the first was never saved. What it did is written in phase 4 and the result is in `states/`, but that one step cannot be rerun as it was.

## Phase 7: it is all Portal, and the drops land on the beat

9:20 to 9:31 pm

**Sam:** "This all has to be a part of Portal, 3SAM Portal. But I need [...] the drops thing on the screen that emulates, you know, the drops that are on the machine, the native instruments machine. But I need the drops on the desktop screensaver looking thing to line up exactly with the tempo beats. It shouldn't be too fast. Maybe half notes."

What was found: the drops had no idea a beat existed. They fell on a fixed timer, one every 1.7 seconds, and the screen made up its own timing whenever the Maschine was unplugged, which it was.

What came back:
- The loop now plays through the native player instead of a sound file. Same samples as the third state.
- That player tells Portal's engine where the beat is, read off the same clock the sound runs on. So the picture cannot wander away from the sound.
- The engine drops a puddle on that beat, on the pads and on the screen, plugged in or not. With nothing playing it goes back to the old timer.
- This is the first time a sketch became part of the instrument: layers went into the native player too.

**Sam, while it was being built:** "maybe start with whole notes so it's obvious the start points"

So it is whole notes: one drop per bar, landing on the one. Half notes is a one-number change.

![the drops, a moment after the one](/assets/mouth-machine/drops-on-the-one.webp)

Not confirmed: nobody has yet said the drops look on the beat. The sound reaches the ear a few thousandths of a second after the clock, and the screen draws a frame or two late. There is a nudge for that if it looks early or late.

Waiting for review in pull request 34.

## Phase 8: take notes on the process itself

9:27 pm

**Sam:** "make sure to be taking notes throughout this process, distill down the process of everything that's going on with the intent of optimizing whatever this flow is, but also documenting the things that happened along the way. If needed, take screenshots [...] A screenshot of a voice memo is cool. See the title."

What came back: `NOTES.md`, and `pictures/`. The take pictures are drawn from the audio with the phone's title on them, not screenshots of the phone. The screen picture is a real screenshot.

**Sam, at 9:46:** "these screenshots are beautiful, must use them to tell story"

So every phase gets a picture from here on.

## Phase 9: a video, and the last four bars of it

9:35 pm

**Sam:** "I just sent like a whole long video, but I feel like I just want to clip the end. Probably like the last four measures. There might be like a little tiny snip at the end that would need to be trimmed to be within the frame, but you can hear the drums beating throughout. So you would be able to match the video to the sound."

Take: `takes/4-guitar-in-the-dark.m4a` is the sound of the video. Two minutes twenty-three, guitar over the loop, filmed in the dark.

![still from the first video](/assets/mouth-machine/video-4-in-the-dark.webp)

![the first video's sound](/assets/mouth-machine/take-4-guitar-in-the-dark.webp)

What came back:
- The bar lines were found from the drums in the video's sound. The match is strong.
- The last whole bar ends six tenths of a second before the video does. That is the snip, and it is cut.
- Two cuts, because "the last four" can be read two ways:
  - `cuts/4-last-four-bars`: the last four whole bars. "Go to sleep" comes in at the start of its fourth bar.
  - `cuts/4-four-bars-from-go-to-sleep`: one bar earlier, so it starts where "go to sleep" starts.
- The very end of the first cut may show Sam starting to reach for the phone. The frames there are too dark to tell.

Something the video showed without being asked: the light on Sam's face rises and falls once per bar, and starts to rise at the bar line. That is the first evidence that the drops land on the one. It is only as fine as a video frame, about four hundredths of a second.

Nothing that is playing was changed.

## Phase 10: a second video, a loop and an ending

9:41 pm

**Sam:** "I just sent another one over. And this one I'd want the last two measures of it actually playing. [...] what happens is I play like a last note and then my tone stuff that I'm playing on the guitar fades out. And it's the end. And I don't know how long that goes on for, but I know there's like two measures before that I think I was on point, and that's where the loop should be. But then I should also have this ending as a sample too."

**Sam:** "the ending with just the last note fade out."

Take: `takes/5-guitar-with-an-ending.m4a`, the sound of the video.

![still from the second video](/assets/mouth-machine/video-5-guitar.webp)

![the second video's sound](/assets/mouth-machine/take-5-guitar-with-an-ending.webp)

What was found, by measuring and not by ear:
- The guitar plays a figure two bars long, over and over: one bar sitting on one low note, the next bar a step below it.
- The last bar is different. The low note is held, it stops, and one last note lands on the fourth beat.
- On the recording that last note is gone in about half a second, before the next bar line. Sam remembered a longer fade. If there was one in the room, the phone did not pick it up over the loop.

What came back:
- `cuts/5-loop-two-bars`: the two bars before the last bar. It starts on the lower bar, because that is where "two bars before the ending" falls. Put back at its own place over the loop, it lines up.
- `cuts/5-ending-last-bar`: the whole last bar. The held note, the stop, the last note.
- `cuts/5-ending-last-note`: only the last note, half a second.

The loop from the room is in all of these, quiet under the guitar. Nothing was cleaned out.

Not done: none of this is laid onto the loop yet. Nothing that is playing was changed.

## Phase 11: two colours

9:49 pm

**Sam:** "can we filter video so everything above x threshold brightness goes white (seafoam), and below goes black (olive)"

**Sam:** "that prompt as block quote over bottom right over a sill with the filter"

![the prompt over a filtered still](/assets/mouth-machine/seafoam-and-olive.webp)

What came back:
- Every pixel is one of two colours. Brighter than the line goes seafoam, the rest goes olive.
- The room is very dark, so the line sits low: 5 on a scale of 100. At 3 the whole wall goes seafoam. At 7 there is only a head and the top of the guitar.
- The picture is softened a little first, so the grain of a dark room does not sparkle. That can be turned off for a rougher look.
- Because the light in the room swells with the drops, the shapes swell with the bar.
- All five cuts were run through it. They are beside the others in `~/Movies/mouth-machine/`, ending in `-seafoam`.

Choices made without asking: the exact seafoam and olive, the line at 5, and how much softening.

One frame with the line at 3, 3.5, 4, 4.5, 5.5 and 7, then 4.5 with no softening:

![one frame, six lines](/assets/mouth-machine/seafoam-six-lines.webp)

**Sam:** "yeah that still, with all of them next to each other, beautiful."

## Phase 12: the colours flip on "go"

9:52 pm

**Sam:** "when we add that second clip with fade out as soon as it starts on the go (in go to sleep) can we invert the threshold"

How that was read: in the ending from the second video, the moment "go" lands, the two colours trade places. Bright goes olive, dark goes seafoam.

What came back:
- The ending now runs two bars: the last bar of guitar, then one more bar while "go to sleep" comes around.
- The flip is on the bar line where "go" lands, to the nearest video frame.
- It is `IMG_6533-ending-through-go-seafoam.mp4` in `~/Movies/mouth-machine/`.

![the flip, six frames a second](/assets/mouth-machine/seafoam-flip-on-go.webp)

## Phase 13: the first piece

9:55 pm

**Sam:** "just light for right now, render so i can hear too just restart this loop"

**Sam:** "run the first one once and the second one twice"

How that was read: put the clips together into one thing that can be watched and heard. The first video once. The second video twice, light the whole way, with no flip in the middle for now. Then it starts over.

What came back: `piece-1.mp4` in `~/Movies/mouth-machine/`. Twelve bars, 26 seconds.
- Bars 1 to 4: the first video, four bars from "go to sleep". Seafoam shapes on olive.
- Bars 5 to 8: the second video, its last four bars from "go". Olive shapes on seafoam. This is the one that ends on the last note.
- Bars 9 to 12: the same four bars again.
- Twelve bars is exactly one trip around the loop in the room, so on repeat it comes back to "go" on the one.
- The sound is each video's own sound, turned up by one amount for both. Nothing squashed. The cuts have a hundredth of a second of fade so they do not click.

One frame from each bar:

![the piece, bar by bar](/assets/mouth-machine/piece-1-twelve-bars.webp)

The loop playing in the room was not touched.

## Phase 14: the other order

10:02 pm

**Sam:** "the first one twice, last one last"

What came back: `piece-2.mp4`, beside the first. Same clips, same twelve bars, other order.
- Bars 1 to 8: the first video, twice. Seafoam shapes on olive.
- Bars 9 to 12: the second video, once, light. It ends on the last note, and then the whole thing starts over in the dark.

![piece 2, bar by bar](/assets/mouth-machine/piece-2-twelve-bars.webp)

The order is now one word to change: `sketch/piece.sh "a a b"`. Piece 1 was `"a b b"`. It is still there.

The loop playing in the room was not touched.

## Phase 15: drops first, "go to sleep" last

10:06 pm

**Sam:** "we need the ring droplets to drop to a beat and probably get through like I don't know 12 beats so like three measures worth no however many of the drops is for it to complete a whole cycle that's probably 16 so it should go 16 of the drops and the drops should be more organic grainy than digitized the blocks and they should also be the olive background and wherever they are it should be the sea foam white just those two colors to demonstrate everything for the droplets and then goes the ending that we just worked on with the two videos that were sent the first one playing twice for the first eight beats together and then the last video plays once and fades out and then it ends on just the go to sleep no other sounds just that layer and you let that play out in the silence for like one measure So I can hear the sound too."

What came back: `piece-3.mp4`, 37 seconds, seventeen bars, with sound.

![piece 3, start to end](/assets/mouth-machine/piece-3-drops-to-sleep.webp)

- Bars 1 to 4: sixteen drops, one on every beat. They walk the same path the drops walk on the Portal screen: along the bottom, up the right side, back across the top, down the left, then into the middle. Sixteen was the right guess. The whole path is 26 stops, but the first sixteen touch every pad once, and the rest go back over old ground.
- The drops are not blocks any more. Each one is a soft ring with grain in it, cut at a line into seafoam and olive, the same way the videos are. A ring spreads for one bar, gets thinner, and breaks into specks.
- Under the drops: the beat alone, the first layer, nothing else.
- Bars 5 to 12: the first video, twice. Seafoam shapes on olive.
- Bars 13 to 16: the second video, once, light. Over its last bar the olive spreads until the frame is empty, and the sound goes out under the last note.
- Bar 17: "go to sleep" by itself on plain olive. The voice is about half a second. After it there is true silence to the end of the bar, no room sound.

Choices made without asking, each one a single number in `sketch/piece-3.py`:
- One drop per beat, so sixteen drops are four bars. On the Portal screen the drops are one per bar. At that speed sixteen of them would be over half a minute before any video.
- The sound under the drops is the beat alone. Sam asked for drops "to a beat" and did not say which sound.
- The beat is turned down 7 dB from its file, so it sits near the phone recordings and the video does not arrive quiet. Set by meter. Nobody on this side heard it.
- "The first one playing twice for the first eight beats together" was read as eight bars: the first video, then the first video again.
- The picture of the second video drains over its whole last bar. The sound stays full until the last note and goes out with it, in the last half second.
- The last screen is plain olive. No drop on "go".

The voice layer on its own is now kept as `cuts/3-go-to-sleep-layer.flac`. Until now it lived only in a scratch folder.

10:17 pm, while it rendered

**Sam:** "beautiful, better be documenting"

This entry, the picture, the script and the voice layer went in together, the same turn.

The loop playing in the room was not touched.

## Phase 16: the last drop fades all the way out

10:18 pm

**Sam:** "no the last drop should be allowed to fade all the way out"

In piece 3 the last drop lands on the last beat of the fourth bar, and the video cut it off one beat later. A ring needs a whole bar to fade.

That reads two ways, so both were made. `piece-3.mp4` is still there as it was.

- `piece-3-carry.mp4`: the rings keep fading over the first bar of the video. Nothing gets longer. For most of a bar the drops and the guitar are on the screen together.

![carry: the rings fade over the video](/assets/mouth-machine/piece-3-carry.webp)

- `piece-3-wait.mp4`: the drops get a fifth bar, with the beat still under them, and the video starts once the screen is empty. Two seconds longer, eighteen bars.

![wait: the rings fade, then the video](/assets/mouth-machine/piece-3-wait.webp)

One word picks between them: `python3 sketch/piece-3.py OUT.mp4 carry` or `wait`.

10:24 pm

**Sam:** "Yeah, the ending should fade out and with its own, so it fades all the way to black because when it loops back to the beginning, then you're going to start to see the drops again from at the beginning of the video. Very cool."

That is what all three versions do: the second video drains until the frame is empty, "go to sleep" plays over nothing, and on repeat the first drop lands on an empty screen. The empty screen is the olive, which is this look's black. Nothing was changed for this.

## Phase 17: tie every thing to where it came from

10:19 to 10:20 pm

**Sam:** "remember to be documenting like what happened anytime there's an artifact that relates to it like a prompt that's particularly well formulated and and a static or a video or something that relates to what just happened or the outline of a sequence of steps whatever makes sense in the storytelling process documenting the creation from seed to stop"

**Sam:** "Like another artifact would be the voice notes that I sent that got turned into the loops, the original ones."

**Sam:** "And then you could know that I took the loop and asked for it to be quantized and trimmed."

What came back:
- A new section near the top of this file, "From seed to now". For each thing that exists: what it started as, the words that asked for it, what it became, and the picture if there is one.
- The voice notes were already here untouched, in `takes/`. What was missing was the middle step for two of them. The second layer and the voice layer, each on its own before being laid into the loop, are now saved in `cuts/`. Both had been sitting in a scratch folder.
- Still missing, said plainly in phase 6 and still true: the small script that first laid the second layer over the beat. The layer itself is saved now. The step that placed it is described, not rerunnable.

## Phase 18: the second layer, lower and softer

10:21 pm

**Sam:** "i think the second voice note loop on drums should be a bit lower volume, with high pitch should be softened"

What the second layer is, looked at on its own: three "tss" sounds, very high, and a few quieter sounds in the middle. Up where the "tss" sits, it was about ten times stronger than anything the drums put there. That is the part that pokes out.

What came back: `states/4-second-layer-softer.flac`, twelve bars.
- The whole second layer is 2 dB lower.
- Everything in it above 3 kHz is 4 dB lower again. So the "tss" hits come down about 6, and the middle sounds about 2 and a half.
- The beat and "go to sleep" are the same samples as before. Checked, not assumed.

![the second layer before and after](/assets/mouth-machine/layer-2-softer.webp)

How much is "a bit" was a guess. Nobody on this side heard it. Both amounts are plain numbers: `python3 sketch/soften-layer2.py 2 4`.

**The loop in the room was not swapped.** It is still the third state. Swapping means stopping the player and starting it again, which is a gap of a moment. A copy to listen to went to Sam's phone instead.

The videos cannot change this way. The loop in them is the sound of the room as the phone heard it.

**Not yet kept: `states/4-second-layer-softer.flac`**

## Phase 19: only the guitar from the videos

10:26 pm

**Sam:** "the audio from video should have canceled out drums so we just hear guitar"

The phone heard two things at once: the guitar, and the loop playing in the room. Cancelling the loop out, by subtracting it, does not work with a phone in a room. That was learned in phase 4. What does work is turning the loop's share down, one band of pitch at a time, at the moments the loop is known to be playing.

What came back: `sketch/guitar_only.py`. It lays the loop along the video by the bar lines, learns how the loop sounds once it has crossed the room into the phone, and turns that much down.

The first try took off 2 dB, which is nothing. It was learning from the wrong moments. The second try learns from the quietest fifth of the video, where only the loop is playing.

By meter, not by ear:
- The bar of the second video where nobody is playing: 34 dB under full went to 43 under. Nine quieter.
- A drum hit on its own at the start of the first video: 28 under went to 42 under.
- The loudest guitar moments lost less than 1 dB.

![the second video's last five bars, before and after](/assets/mouth-machine/guitar-only-second-video.webp)

The first video is harder. There the guitar is only a little louder than the loop, so there is less room to turn one down without the other.

![the first video's four bars, before and after](/assets/mouth-machine/guitar-only-first-video.webp)

Said plainly: the drums are turned down, not gone. Nobody on this side has heard it.

The pieces use this sound from here on. The phone's own sound is one word away: `python3 sketch/piece-3.py OUT.mp4 16 spiral room`.

Saved: `cuts/4-four-bars-guitar-only.flac`, `cuts/5-last-five-bars-guitar-only.flac`.

## Phase 20: the second layer, down more, then down 13

10:27 pm

**Sam:** "drop db more on second loop"

Rebuilt at 6 down, highs 4 softer again: `python3 sketch/soften-layer2.py 6 4`. A copy went to Sam's phone.

10:33 pm

**Sam:** "down 13"

**Sam:** "db on second"

Rebuilt at 13 down. The highs are still 4 softer on top of that, so the "tss" hits end up about 17 down. If "down 13" meant 13 and nothing else, that is `python3 sketch/soften-layer2.py 13 0`.

![the second layer as it was, and down 13](/assets/mouth-machine/layer-2-down-13.webp)

The layer went from 28 dB under full to 44 under. Its loudest moment went from 0.60 to 0.09.

`states/4-second-layer-softer.flac` is the 13 version now. The 2 and the 6 are not saved as files. Each is one command.

**The loop in the room was not swapped.** It is still the third state.

**Not yet kept: `states/4-second-layer-softer.flac`**

## Phase 21: the second video plays all the way out

10:30 pm

**Sam:** "the second video ends too abruptly and should play all the way out (1 or 2 measures), then go to sleep endcap"

The second video was being cut four bars in, on the bar line, while the last note was still ringing.

What came back: a fifth bar. The last note rings through it. The picture drains to olive across that bar, and the room eases away under its second half. Then "go to sleep".

![the last bar of the second video, draining, then the empty screen](/assets/mouth-machine/piece-4-second-video-plays-out.webp)

One bar, not two. There is only one clean bar after the last note: the phone gets bumped a second and a half before the video ends.

## Phase 22: the drops are whole notes

10:33 pm

**Sam:** "drops need to be whole notes"

One drop a bar, on the one. This was already the rule on the Portal screen, set in phase 7 "so it's obvious the start points". Piece 3 drew one on every beat. That was a wrong call on this side, not something Sam asked for.

Each ring now lives exactly one bar. It is gone as the next one lands. So the last drop fades all the way out before the video starts, with nothing added. The carry and wait versions from phase 16 are not needed any more.

![one ring, one bar](/assets/mouth-machine/piece-4-one-ring-one-bar.webp)

Two lengths were made, because how many drops was not said:
- `piece-4-four-drops.mp4`: four drops, eighteen bars, 39 seconds
- `piece-4-sixteen-drops.mp4`: sixteen drops, thirty bars, 65 seconds

**A mistake on this side.** The first whole-note render was not whole notes. The new script failed to save, the render ran the old one, and two files came out with the new names and the old drops. It was caught because the two files were the same length and should not have been. They were deleted before anything was sent, and made again.

## Phase 23: commit every step, and count versions by what it can do

10:34 pm

**Sam:** "better be git committing, and versioning based on capabilities (in documenting progress)"

What came back:
- A commit as each thing lands, not one at the end of the turn.
- A new section near the top, "Versions, by what it can do". One line each time the mouth machine can do something it could not do before, with the phase that tells it and the commit that holds it. Fourteen at the time of this phase.
- A fix, a second try or a new number for an old knob does not get a version.

## Phase 24: what if the drums were an octave down

10:37 pm

**Sam:** "what would it be like if we dropped the first two loops (drums) pitch down by 12 and rounded out of the lower tones, and makes sure the upper mid are softly audible (remember git)"

What came back: `states/5-drums-octave-down.flac`, twelve bars, and the drums alone in `cuts/drums-octave-down.flac`. To listen: four bars as they were, then eight bars dropped.

How it was read, piece by piece:
- "the first two loops (drums)": the beat and the second layer. The second layer is the one last asked for, down 13. The voice is not touched.
- "pitch down by 12": the way a sampler does it. Each hit is found and played at half speed from the moment it started. Same tempo, every hit starts where it did. All 18 hits of the beat were found in the same places after.
- "rounded out of the lower tones": the rumble under 35 Hz is rolled away, and 60 to 150 Hz comes up 4 dB.
- "upper mid are softly audible": dropping an octave empties the upper mid, 2 to 5 kHz. It fell 4 dB. It was brought back up 4, and after the level trim it sits 2 under where it began.
- The drums were then turned down 1.9 dB so their loudest moment is what it was.

![the drums before, and an octave down](/assets/mouth-machine/drums-octave-down.webp)

What the picture shows that the ear should check: at half speed every hit lasts twice as long. The gaps between hits are almost gone. It may feel heavier and slower even though the tempo is the same.

Both 4s are guesses set by meter. Nobody on this side heard it. `python3 sketch/octave-down.py LOWS UPPER_MID`.

**The loop in the room was not swapped,** and no video uses this.

**Not yet kept: `states/5-drums-octave-down.flac`**

## Phase 25: show the video, show the timeline

10:42 pm

**Sam:** "i need to see video, and show me timeline"

"Timeline" was read as the piece laid out left to right, not the history of the project. That history is this file.

What came back: `sketch/timeline.py`. One picture of any render: stills from the file over the moment each was taken, the sections with a dot where each drop lands, and the sound under it.

![piece 4 with four drops, left to right](/assets/mouth-machine/piece-4-timeline-four-drops.webp)

The four-drop video went to Sam's phone with this picture.

Two things the picture showed that had not been measured:
- The first video is much quieter than the second: 31 dB under full against 25. With the loop turned down there is not much guitar left in it.
- The sharp spike near the end is in the phone's own recording. It is a knock, not something made here.

## Phase 26: the full spiral, and the drums come back before "go to sleep"

10:48 pm

**Sam:** "we can get double drops (more measures) at the beginning so we get full spiral"

The drop path goes round the twelve outside pads, then the inner four. That is sixteen stops. At one drop a bar the full spiral is sixteen bars. Double of four is eight, which would stop two thirds of the way round the outside. So "full spiral" was taken over "double": sixteen.

`piece-4-sixteen-drops.mp4` was already being made. It went to Sam's phone as a lighter copy, because the full file is over the size a message can carry.

10:50 pm

**Sam:** "that last go to sleep is louder for some reason. i think there should be measure of second drum loop first then full drums one measure then go to sleep"

The reason: the voice alone had been set to a round number on the meter, half of full. Against the beat that is five and a half dB louder than the voice sits in the loop. A wrong call on this side.

What came back:
- The beat, the second drum loop and the voice now share one amount. They sit against each other exactly as they do in the loop. The voice came down from 25 under full to 31 under.
- After the second video drains: one bar of the second drum loop alone, one bar with the beat under it, then "go to sleep" alone.
- A drop lands on each of those two bars, carrying on round the path. That was not asked for. The drums had no picture otherwise.

![piece 5, left to right](/assets/mouth-machine/piece-5-timeline.webp)

It reads two ways, so both were made. They share one picture and differ only in sound:
- `piece-5-second-loop-as-recorded.mp4`: the second drum loop as it was recorded. Alone it is 35 under full, close to the beat.
- `piece-5-second-loop-down-13.mp4`: the second drum loop as last set for the mix, down 13. Alone it is 51 under full, twenty quieter than anything around it. That bar will sound close to empty.

A layer turned down to sit inside a mix is not the same as that layer heard alone.

`python3 sketch/piece-3.py OUT.mp4 16 spiral noloop endcap`, and add `soft` for the second loop down 13. `OUT.wav` writes only the sound, to lay under a picture already made.

## Phase 27: the loop is the thing that plays

10:56 pm

**Sam:** "the loop should be the thing that plays and we should phase out the loop of the video so we just hear guitar. and kill the last go to sleep"

Until now the videos carried their own sound: the guitar, and whatever was left of the room loop after it was turned down. So under the guitar there was a thin, far-off copy of the loop and nothing else.

What came back:
- Under both videos the loop itself plays, clean, from the file. It is laid so its own start falls on the first bar of the first video. Both videos were cut on a "go to sleep" line, which is where the loop starts, so the two stay locked.
- The videos give only the guitar (phase 19). "Phase out" was read as that: the room loop turned down as far as it will go. It cannot be cancelled outright, for the reason in phase 4.
- The last "go to sleep" alone is gone. The piece ends on the two drum bars.
- The loop that plays is the one last asked for: the second layer down 13. It gets the same one amount as the beat, so nothing in it is louder or quieter than it is in the loop.
- If the whole thing would clip, all of it comes down together. It did not need to.

"Go to sleep" is still heard, where the loop says it: on the first bar of each four. The last time is under the second video's ring-out bar, as the picture drains.

By meter, with the loop under them: the first video went from 31 dB under full to 28 under, the second from 25 to 23, and the ring-out bar from 40 to 28. That bar used to be nearly empty.

![the sound of piece 6, with the loop under the videos](/assets/mouth-machine/piece-6-timeline.webp)

What "the loop should be the thing that plays" covers reads two ways, so both soundtracks were laid under one picture:
- `piece-6-beat-then-loop.mp4`: the beat alone under the drops, as before. The whole loop comes in with the first video.
- `piece-6-loop-all-through.mp4`: the whole loop from the first bar, under the drops too.

Neither went to Sam's phone. Two minutes after asking for them Sam asked for a different opening, and both of these open with the sixteen drops. They are in the movies folder. The way of making them is in the next piece.

In the second drum loop's own bar, the layer plays as it was recorded, not down 13. Alone at down 13 it is nearly silent (phase 26). So that one layer is at two levels in the piece: low inside the loop, up when it is alone. One word, `soft`, puts it at one level.

## Phase 28: the inner four start it

10:58 pm

**Sam:** "i think i would like to see the inner 4 start out out and then the last of the four fades for a full measure out two and then switches to video part"

**Sam:** "document"

How it was read: the opening is four drops, on the four inside pads, one a bar. Then the last one fades, then the video. "A full measure out two" was read as "a full measure or two".

The inner four are the last four stops of the pad path: bottom left, bottom right, top right, top left. They are kept in that order.

![the inner four, and the last ring taking two bars to go](/assets/mouth-machine/piece-7-inner-four.webp)

How long the last one fades reads two ways, so both were made:
- `piece-7-inner-four.mp4`: every ring gets one full bar, the last one too. The video starts on bar five. Seventeen bars before the drums come back, nineteen in all.
- `piece-7-inner-four-long-fade.mp4`: the last ring gets two bars and spreads at half the speed. The video starts on bar six. Twenty bars in all.

![piece 7, left to right](/assets/mouth-machine/piece-7-timeline.webp)

![piece 7 with the long fade, left to right](/assets/mouth-machine/piece-7-timeline-long-fade.webp)

Measured after the render: 987 frames, 41.1 s, and 1039 frames, 43.3 s. Loudest moment 1.3 dB under full in both. Both sent to Sam at 11:09 pm with the second timeline.

Everything after the opening is as in phase 27: the loop under the videos, guitar only, two drum bars, no last "go to sleep". Under the drops it is the beat alone.

The two drops over the drum bars at the end carry on round the inner four: bottom left, then bottom right.

`python3 sketch/piece-3.py OUT.mp4` makes the first. Add `long` for the second. The sixteen-drop spiral is `16 spiral`.

## Phase 29: the loop in the room is paused

11:21 pm. Sam: "pause the looper for now"

The player (`chop`, the one making the sound) is frozen where it stood, not quit. Nothing was unloaded. It is still state 3.
The drops window was left running.

To carry on from the same spot: `kill -CONT 16976`. No picture: nothing new to look at.

## Phase 30: no grain on the drops, thicker rings

11:47 pm

**Sam:** "i don’t like the random grain that was added to drops, the drops can get thicker rings"

The grain was this side's addition in piece 3 (phase 15), when the drops became rings: speckle laid over the picture so a ring broke up as it faded. It is off now.

What changed in `sketch/piece-3.py`:
- No speckle. A ring has a clean edge from the moment it lands to the moment it is gone.
- Thicker. A ring is 120 px thick when it lands (it was about 58), and thins steadily to nothing by the end of its bar. `RING_THICK` is the one number to change.
- Without the grain a ring would have vanished about two thirds of the way through its bar. It is now drawn so it lasts the whole bar and still fades all the way out, as Sam asked before.

Kept, and said here because it is also random: the rings are still not quite round. Each has a slow wobble to its outline. That is the shape, not speckle. If Sam means that too, it is the `WOBBLE` number.

![the four drops with clean thick rings, the last one over two bars](/assets/mouth-machine/piece-8-clean-rings.webp)

Thickness was picked by eye from this picture, about double. Nothing else in the piece changed: `piece-8-clean-rings.mp4` and `piece-8-clean-rings-long-fade.mp4` are piece 7 with the new rings.

![piece 8 with the long fade, left to right](/assets/mouth-machine/piece-8-timeline-long-fade.webp)

Measured after the render: 987 frames, 41.1 s, and 1039 frames, 43.3 s, the same lengths as piece 7. Sam: "let’s see it". Both sent at 11:50 pm.

The old look was one word away at this commit: `python3 sketch/piece-3.py OUT.mp4 4 grain` (the word is `speckle` from phase 32 on).

## Phase 31: just fade, each video once

11:57 pm

**Sam:** "no just fade to black, i don’t like the video repeat, just one for each, and fade out should go to olive"

Two parts are plain:
- Each video plays once. The first video's repeat is gone. That takes four bars out.
- A fade goes to olive, not black. Olive is the ground of the whole piece.

"no just fade" reads two ways, so both were made, each with the videos once:

1. It is about the end. No drum bars after the second video. The second video's last bar fades to olive, picture and loop together, and that is the end. This answers the question left open in phase 27, whether the drum bars stay.
   `piece-9-ends-on-video.mp4`, 13 bars. The rings are as in piece 8.
2. It is about the rings. A ring should not thin to nothing. It keeps the thickness it landed with and fades to olive over its bar.
   `piece-9-rings-fade.mp4`, 15 bars. The two drum bars are still at the end, and the last ring fades out with the last bar.

Until now every frame was two colours and nothing between. A fade needs the colours between, so this is the first piece that has them.

Both use one bar for the last ring of the opening. The two-bar fade is still the word `long`.

![piece 9, ending on the video](/assets/mouth-machine/piece-9-timeline-ends-on-video.webp)

![piece 9, the rings fading](/assets/mouth-machine/piece-9-timeline-rings-fade.webp)

Measured after the render: 675 frames, 28.1 s, and 779 frames, 32.5 s. Loudest moment 1.3 dB under full in both. Both sent to Sam at 12:01 am.

Seen in the second picture, not asked about: where the second video drains to olive in its last bar, the picture breaks into speckle on the way down. That is the same kind of grain Sam did not like on the drops. The first file does not have it, because its last bar fades.

`python3 sketch/piece-3.py OUT.mp4 4 nodrums` makes the first, `4 fade` the second. Piece 8 is now `4 twice`.

To make an earlier piece again, check out the commit named for it in the versions table and run the command written in its phase. The script's defaults move with each ask.

## Phase 32: no drops at the end, the light ground, grain in the rings only

12:03 am

**Sam:** "no drops at the end"

The drop on each of the two closing drum bars was this side's addition (phase 26). They are gone. The drum bars play over plain olive.
`piece-10-no-drops-at-the-end.mp4` was made with the fading rings of piece 9. It was not sent: the next message came while it rendered.

12:05 am

**Sam:** "i kind of like it all white bg, including drops, the drops should be grain (just no random grain noise in the whole video)"

How it was read:
- "white bg" is the seafoam ground the second video has, with the shapes in olive. The whole piece is on it now: the drops are olive rings on seafoam, and the first video has its two colours traded to match.
- "the drops should be grain": the rings are grainy again. They thin as they spread and break into grain, as in pieces 3 to 7.
- "no random grain noise in the whole video": what was wrong was never the grain in the rings. It was the specks scattered over the open ground, far from any ring. Those are gone. Grain is drawn only where a ring is.
- So phase 30 misread it. Taking all the grain out was more than Sam asked.

![olive rings on seafoam, grain in the ring only](/assets/mouth-machine/piece-11-light-ground-drops.webp)

Also changed, and said here because Sam did not ask for it in these words:
- The rings are about twice as thick as in pieces 3 to 7, from "the drops can get thicker rings".
- The second video's last bar fades to olive. It used to drain, by its cut line sinking, and that speckled the whole frame on the way down: random grain, in the video. The word `drain` puts it back.

Left as it was: the fade at the end goes to olive, as Sam said in phase 31, so the piece starts light and ends dark, and the two drum bars play over olive.
If the end should stay light too, that is not built yet.

`piece-11-light-ground.mp4`: `python3 sketch/piece-3.py OUT.mp4`. Words that step back: `dark` (olive ground), `clean` and `fade` (the rings of pieces 8 and 9), `speckle` (specks everywhere), `enddrops`.

## Phase 33: end on the light ground too, and the room comes back after a restart

12:47 am

**Sam:** "no, end with light too"

Phase 32 left the end going to olive and asked. The answer: the end stays light. The second video's last bar now fades its shapes away into seafoam, and the two drum bars play over plain seafoam. The piece starts and ends on the same ground, so it loops without a flip.
The word `endolive` puts the old end back.

The render of piece 11 started in phase 32 never finished: the Mac restarted at about 12:44 am. `piece-11-light-ground.mp4` is made here instead, with the light end.

**Sam:** "also start the loop again"

**Sam:** "and portal drops too"

The restart had stopped everything in the room: the player, the drops window, and the pause from phase 29 with them. Started again, the same way as before, with the same loop (state 3):
- `open -g maschine/dist/drumkit.app`
- from the `chop` worktree's `maschine/`: `./target/release/chop takes/1-beat.m4a --take 0 --bpm 110.9 --layer states/3-go-to-sleep.flac`
- Portal was already running. It was told to show the drops: the word `open` sent to it on udp 127.0.0.1:17321.

One thing went wrong and was put right. The first start came up while the audio interface was still waking, and the player logged "default output device changed". It does not follow a change like that, so it was quit and started again once the interface was the output. The second start is clean: 48000 Hz, 64-frame buffers.

The loop starts from its top, not from where it was paused. No picture: nothing new to look at in the room.

## Phase 34: the "tss tss" layer, down 13 then down 7, and kept

12:50 am

**Sam:** "the tss tss second loop i believe needs a 13db reduction (like how we do in video)"

The room had come back with state 3, the second layer at full. The loop with that layer turned down already existed (state 4, phase 20) and is what plays under the videos. It went into the room. This is the first time state 4 has played there.

12:52 am

**Sam:** "can’t really hear at so maybe only down 7db"

Looked at before changing the number, and found something. State 4 was made as "down 13, and the high sounds 4 softer". The second layer is nearly all high sounds, so the two stack: the "tss" was about 17 down, not 13. That is why it could not be heard.

So state 4 is made again as 7 down and nothing more: `python3 sketch/soften-layer2.py 7 0`. By meter the layer goes from -28.2 dB to -35.2 dB, and its loudest moment from 0.60 to 0.27. Not checked by ear on this side.
The softer highs from phase 20 are off, so that 7 means 7. `7 4` brings them back, and takes the "tss" to about 10 down.

`states/4-second-layer-softer.flac` and `cuts/2-over-the-beat-layer-softer.flac` are written over. The 13-down versions are in git at `58e14c1`.

It is in the room now, and the piece uses it in both places: under the videos, and for the second loop's bar alone near the end (that bar used to be as recorded; `asis` puts that back).

**Sam:** "anna what does video look like now" (dictation: "and")

`piece-11-light-ground.mp4`, 779 frames, 32.5 s, sent at 12:54 am. The picture was rendered once; the sound with the layer 7 down was laid under it after.

![piece 11, left to right](/assets/mouth-machine/piece-11-timeline.webp)

Seen in the picture: the last two bars are plain seafoam with nothing moving, a little over four seconds, while the drums play.

A mistake on this side, the same one as phase 22: the commit `af6926c` says it holds this entry and it did not. The step that wrote the entry failed on a check, and the commit after it ran anyway. The files were right; the log was a commit behind. This commit puts it in. The write and the commit are chained now, so one cannot run without the other.

## Phase 35: the grain goes, the smooth rings come back

12:54 am

**Sam:** "the grain looks bad, go back to organics"

This reads two ways, and one was taken.
- Taken: the smooth rings of piece 8. No grain at all, clean edges, never quite round, thinning to nothing. That is the look that is not grain.
- Not taken: the first grainy rings (pieces 3 to 7), which came from Sam asking for drops "more organic grainy" in phase 15. Those put specks over the whole frame, and Sam has said no to that twice.

`piece-12-smooth-rings.mp4`, 779 frames, 32.5 s, sent at 12:59 am. Everything else is piece 11: the light ground start to end, each video once, no drops at the end, the second layer 7 down.

![olive rings on seafoam, smooth, no grain](/assets/mouth-machine/piece-12-smooth-rings.webp)

![piece 12, left to right](/assets/mouth-machine/piece-12-timeline.webp)

Smooth rings are now what the script makes when asked for nothing. `grain` brings back piece 11's rings.

Seen in the picture, not asked about yet: on the light ground a ring's last moments are a hairline, one or two pixels wide, before it is gone.

## Phase 36: the Portal screen gets a second look

1:01 am

**Sam:** "Can we have an alternate version of the portal desktop grid? Drops and can we get a more organic version that blends it with the black background and white grain"

This is the Portal screen in the room, not the piece. Until now its drops were orange blocks on black, eight blocks down the short side.

The second look is the same drops from the same pads on the same clock. Only the drawing changes: a soft white ring, never quite round, thick when it lands, thinning as it spreads, breaking into grain and gone before it reaches the edge of the screen. The grain is only where a ring is. The open black stays clean, which is the lesson of phase 32.

The blocks are still there. It is a switch: "Organic drops" in the menubar, or the message `look organic` / `look grid` to the Portal. The choice is remembered.

It lives on its own branch in the same repository, `feat/organic-drops`, commit `d34d348`. Not merged.

Not changed, and said here so it is not a surprise: a pad strike still shows its picture or a white block, and the burst that opens the Portal is still orange blocks.

1:06 am

**Sam:** "nice, and make sure video has sound"

Both piece videos were checked: each has its sound (loudest moment about -1.3 dB).

For the new look there was no video yet, so one was made: `portal-organic-drops.mp4`, 26 seconds, one turn of the loop, one drop a bar along the pad path, with the room loop (state 4) under it. Sent at 1:08 am. The frames come off the real screen code on a stepped clock, `sketch/portal-look-video.js`.

![the Portal screen, organic look, two bars](/assets/mouth-machine/portal-organic-drops.webp)

Then it went into the room, and three things went wrong on this side.
- The Portal is started by the Mac at login, and it is brought back if it is stopped. Stopping the old one to start the new one gave two at once. Fixed by putting the new build where the Mac starts it from. The old build is kept beside it as `portal.app.grid-only`.
- The screen pictures taken to check it were black. The Mac was at its lock screen: the display had slept, because the thing that keeps it awake did not come back after the restart at 12:44. So nothing was seen live.
- So it was checked another way: the screen code was run in the same engine the app uses, with no display, and it painted rings at every step with no errors (`scripts/webkit-check.swift` on the branch).

A second model read the branch and found three real things, all fixed in `61e9a9d`: when the Portal is opened by a burst, one missed square could keep the drops off for good; the screen was being redrawn in full even with no ring on it; and the organic look's working memory was being set up in the block look too. It is pull request 35 on the portal repository. Not merged.

Where it stands: the build with those fixes is running, set to the organic look, and told to open. Nobody has seen it on the real screen yet. The sound was not touched.

## Phase 37: "where's music video", and no sound on the phone

1:16 am

**Sam:** "where’s music video"

Two things this could mean, and both were answered.
- Where is the music video as it stands: piece 12 was sent again.
- The ask at 1:01 may have been about the music video all along, not the Portal screen: the piece itself with drops in the organic look, on black, in white grain. Phase 36 read it as the Portal screen only. So the piece was cut that way too.

`piece-13-black-white-grain.mp4`, 779 frames, 32.5 s, sent at 1:20 am. Black and white in place of olive and seafoam. The whole piece is on the black ground: the drops, both videos, the end. The rings are the grainy ones, grain in the ring only. The sound is piece 12's. `python3 sketch/piece-3.py OUT.mp4 4 black`.

![piece 13, left to right](/assets/mouth-machine/piece-13-timeline.webp)

One thing in it that is new and was not asked for: the second video is on the dark ground. Until now it was always on the light ground, the flip on "go". On black, a flip would be five bars of a white screen.

1:18 am

**Sam:** "not hearing sound"

Checked, by meter, not by ear. Every video sent tonight has a sound track, in the same form as the earlier pieces, and at the same level as piece 7, bar for bar. The loop in the room is still playing on the Scarlett. So the files are not silent.

What is true about the level: it is low. The loudest moment is near the top, but the average is around -27 dB, which is quiet for a phone speaker at low volume, and the first four bars are the beat alone, which is mostly low sound a phone barely makes.

Sent to tell the two apart: `piece-12-sound-only.m4a`, the sound with no picture. If that plays, the video player is muted. If it does not, it is the level or the phone.

Not done, because it changes the sound and was not asked for: making the piece louder for a phone. It would need the drum peaks held down.

## Phase 38: white ground

1:22 am

**Sam:** "no, white bg pls"

Said about piece 13, the black one. This reads two ways.
- Taken: piece 13 turned over. True white ground start to end, black shapes, the same grainy rings. `piece-14-white-ground-black-grain.mp4`, 779 frames, 32.5 s, sent at 1:25 am. `python3 sketch/piece-3.py OUT.mp4 4 white`.
- Already in hand: "white" has been Sam's word for the seafoam ground since phase 32. That is piece 12, seafoam with smooth olive rings, sent twice tonight.

![piece 14, left to right](/assets/mouth-machine/piece-14-timeline.webp)

Said plainly, because phase 35 was about this: piece 14 has grain in the rings on a light ground, which is what looked bad in piece 11. Here it is black on white, not olive on seafoam. If it still looks bad, `white` with smooth rings is one more word to add.

## Phase 39: still no sound on the phone

1:27 am

**Sam:** "no sound on phone"

Two more things were ruled out, by meter.
- The left and right sides do not cancel when a phone folds them into one speaker. Folded together the level is the same.
- The piece is quiet but not silent: -22.9 LUFS overall, where a phone video is usually near -14. Above the bass, where a phone speaker works, it is about 4 dB lower again.

So the files should be heard, faintly. Silence points at the phone: its silent switch, its volume, or sound going to something paired with it. That cannot be checked from here.

What could be done from here was done: a louder copy for the phone, `piece-14-white-ground-phone-loud.mp4`, sent at 1:29 am. Same picture. The sound is brought up about 9 dB to -13.8 LUFS, with the drum peaks held down to make room:
`ffmpeg -i piece-14-white-ground-black-grain.mp4 -map 0:v -map 0:a -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 256k OUT.mp4`

This is a listening copy. It changes how the drums hit, so it is not the piece. The piece is the file without "phone-loud" in its name.

## Phase 40: a third video for the ending, on seafoam and on olive

1:35 am

**Sam:** "can you replace a couple measures with the video i just airdropped (i basically want the whole video in there"

The video is `IMG_6526.MOV`: 13.3 seconds, which is six bars and a third of a second. It is a dark phone video, taller than wide but not as narrow as the piece, so its sides are cropped to fill the frame.

It took a few minutes to find. It reached the Mac at 1:34 am but kept the date it was shot, 8:55 pm, so a search for new files by date missed it.

"A couple measures" and "the whole video" do not fit together: the video is six bars long. So this read two ways, and both were cut.
- Taken: the video plays whole, at its own speed, in place of the two plain closing bars. Those were the only bars with no picture of their own. The ending grows from two bars to six, so the piece is 19 bars and 41.1 s, where it was 15 bars and 32.5 s. The last third of a second of the video is cut. `python3 sketch/piece-3.py OUT.mp4 4 third`
- The other reading: the piece keeps its length, and the whole video runs about three times fast inside the two closing bars. `python3 sketch/piece-3.py OUT.mp4 4 third squeeze`, `piece-15-third-video-squeezed-seafoam.mp4`, 779 frames, 32.5 s.

Nothing before the ending changed: the drops, the first video and the second video are as they were. The sound of the first 13 bars is the same as piece 12, sample for sample.

Two things were chosen on this side and not heard.
- The new video gives its picture only. Its own sound is left out. It is the quiet of a room, -39 LUFS, far under the loop.
- Under its six bars the drums come back the way they did under the two plain bars, only longer: the second drum loop alone for one bar, then the beat under it for five. By meter those six bars sit where the two did (peak -8.0 dB against -8.1). Nobody on this side has heard a six-bar drum ending.

1:40 am

**Sam:** "man's adjust threshold to get more contrast in that video"

Read as "and adjust threshold", about the new video.

With the line where the guitar videos have it (5), the new video came out as mush: a quarter to a third of the frame sat right at the line, against about a tenth for the guitar videos. One line cannot fix it, because the light in this video moves. It is dim at the start and the end and lit in the middle. A low line empties the middle, a high line empties the ends.

So for this video the line follows each frame's own light. For every frame it finds the line that pulls the light side and the dark side furthest apart (Otsu's method), never higher than 7.3 (75 of 1023), and it eases toward that over about a quarter second so it does not flicker. The guitar videos keep their fixed line.

![the third video: one fixed line on top, the following line under it](/assets/mouth-machine/third-video-line-fixed-and-following.webp)

That picture is from before the cap. Without it the line climbed so high in the lit middle that the frame emptied (bottom row, frames 5 to 7). The cap is what keeps the middle.

1:42 am

**Sam:** "i like the seafoam instead of white"

1:43 am

**Sam:** "let's try seafoam bg and olive bg"

Two cuts, the same piece on each ground. Both sent at 1:50 am, with the squeezed one after.
- `piece-15-third-video-seafoam.mp4`: olive shapes on seafoam, start to end. `4 third`
- `piece-15-third-video-olive.mp4`: seafoam shapes on olive, start to end. `4 third olive`

`olive` is a new word. Before, the nearest was `dark`, which left the second video on seafoam.

The rings are smooth in both, as kept in phase 35. The grain in pieces 13 and 14 came with the black and white words, not with these colours.

![the third video on seafoam and on olive](/assets/mouth-machine/piece-15-third-video-both-grounds.webp)

![piece 15 on seafoam, left to right](/assets/mouth-machine/piece-15-timeline-seafoam.webp)

![piece 15 on olive, left to right](/assets/mouth-machine/piece-15-timeline-olive.webp)

![piece 15 squeezed, left to right](/assets/mouth-machine/piece-15-timeline-squeezed.webp)

The two long files were just over the size that can be sent, so what was sent is a slightly smaller copy of each (`-send` in the name, same sound). The full files are beside them.

## Phase 41: seafoam on black, and the guitar louder

1:35 pm, the same day

**Sam:** "I like sea foam and olive. I think having everything black background and then the sea foam movement would be nicer."

**Sam:** "I don't like the grain on the drops actually. So let's go back to just the regular drops that we had before that."

**Sam:** "we got to make sure that the guitar from the video is actually louder. Because it's not really popping through that much. Probably just make it louder or compress it, maybe. But I don't want to bring floor noise in there. And I know that we use the loop to cancel it out of that audio. So... Yeah, let's bring the volume up for the guitar for both video clips. Do not make the go to sleep louder. Do not make it louder."

### The picture

A new word, `night`: the whole piece on a black ground, start to end, with seafoam for everything that moves. The drops, both guitar videos and the third video.

The drops are the smooth rings from phase 35. The grain only ever came with the black and white words (pieces 13 and 14), so nothing had to be undone: this piece does not use those words.

The ending is still the third video whole, six bars, as in piece 15. Sam has not yet said six bars or squeezed.

![piece 16, left to right](/assets/mouth-machine/piece-16-timeline-night-guitar-up.webp)

### The guitar

Three things were measured before anything was turned up.

- The second video's guitar already peaked at -1.3 dB, with the whole piece's loudest point on one of its picks. Six more would have gone over, and then the rule in the script turns the whole piece down together. So "just louder" was not on the table for that video. Its loudest picks have to be held first. That is the "compress it" half of what Sam said.
- A plain turn-up lifts everything in the phone's sound: guitar, the hiss, and what is left of the room's loop. That is the floor noise Sam did not want.
- The first try at lifting the guitar only brought the room's "go to sleep" up 3 dB with it, in the moments nobody is playing. The loop is turned down in the phone's sound, not removed, and what is left of the voice passed for guitar. The test was made stricter until it did not.

What was built, in `guitar_only.py` (`lift`) and `piece-3.py` (words `up`, `even`):

- **Lift.** Each frequency, each moment, is turned up by how clear it stands of the loop and of the room's hiss. Guitar gets the full amount. Loop and hiss get none.
- **Hold.** A pick that peaks over -6 dB goes a third as far past it. The gain rides 30 ms at a time, so a note keeps its shape.
- The clean loop under the videos, the beat under the drops and the closing drums are not touched.

By meter, with `up` (`python3 sketch/guitar-up-check.py third night up`):

| measured | first video | second video |
|---|---|---|
| guitar | -31.4 to -26.3 dB (+5.1) | -24.9 to -19.8 dB (+5.1) |
| the quiet between notes | +0.0 | +0.3 |
| guitar against the loop under it | 1.3 under, now 3.9 over | 4.7 over, now 9.8 over |
| loudest point | -15.2 to -9.3, nothing held | -1.3 to -2.5; held 1.5% of the time, 7 dB at the most |

"go to sleep", each place it sounds inside the piece:
- First video, bar 1. Nobody is playing over it. The video's sound moved +0.1 dB in the voice's frequencies. The loop's own voice sits 17 dB over it, before and after.
- Second video, bar 5 (the last note ringing). Moved 0.0. The loop's voice sits 24 dB over it.
- Second video, bar 1. The guitar comes in over the words here, and the guitar is 5 louder, as asked. The voice itself comes from the loop file and is at the level it was. Against a louder guitar it will be less in front in this one bar.

The drops' four bars and the six closing bars are the same as piece 15, sample for sample. The whole piece peaks at -2.5 dB, where it peaked at -1.3. Nothing was turned down to make room. It reads -20.0 LUFS, where piece 15 read -23.3.

![the two videos' bars, before and after](/assets/mouth-machine/piece-16-guitar-up.webp)

### Two cuts, one picture

"Louder for both" does not say whether both by the same amount. The first video's guitar has always been about 6 quieter than the second's (it is in the open list). So there are two, with the same picture.

- Taken: both up 6. `piece-16-night-guitar-up.mp4`. `python3 sketch/piece-3.py OUT.mp4 4 third night up`
- The other: the first video up 12 and the second up 6, so both sit about 9 over the loop. `piece-16-night-guitar-even.mp4`. Its sound is `python3 sketch/piece-3.py OUT.wav 4 third night even`, laid under the first file's picture. -18.9 LUFS.

![the evened cut, left to right](/assets/mouth-machine/piece-16-timeline-night-guitar-even.webp)

Both sent at 1:52 pm. Each file was just over the size that can be sent, so what went is a slightly smaller copy (`-send`), same sound.

Chosen on this side and not heard: the amount (6), the line the picks are held at, and how strict the guitar test is. All three are knobs at the top of the scripts (`GUITAR_UP`, `HOLD_OVER`, `LIFT_OVER`).

## Phase 42: the loop we recorded over, further out

2:13 pm

**Sam:** "yea, videos are good if we phase out the loop we recorded over"

The loop that was playing in the room is in the phone's sound of both videos, under the guitar. Until now it was turned down there, by 18 dB at the very most and by about 6 in practice, and the same loop from its file plays over it. So the piece had the loop twice under the videos: once clean, once as the phone heard it.

It cannot be cancelled by phase. That was measured in phase 4: the room never gives the phone the same drum twice, so there is nothing steady to subtract. What can be done is to turn it down harder, and that is what this is.

A new word, `deep`. Whatever in the videos' sound does not stand 13 dB clear of the loop goes, down 40 at the most. Before, a sound had to be about level with the loop to go.

By meter (`python3 sketch/guitar-up-check.py third night up deep`, against piece 15's sound):

| measured | first video | second video |
|---|---|---|
| guitar, loudest 15% | +5.3 (it was +5.5 in piece 16) | +5.0 (it was +5.2) |
| the quiet between notes | 19.6 down | 15.5 down |
| the room's "go to sleep" where nobody plays over it | 17.9 down | 25.1 down |

The cost can be seen in the picture: the ends of notes. A note's tail sinks into the loop, and once it is no longer clear of it, it goes with it. Notes stop sooner and more squarely than they did. Under the clean loop that may not be heard. Nobody on this side has heard it.

![the two videos' bars, piece 16 and piece 17](/assets/mouth-machine/piece-17-room-loop-out.webp)

"Phase out the loop we recorded over" reads two ways, so there are two cuts. The picture is piece 16's, untouched, and so is the sound of the drops and of the closing six bars, sample for sample.

- Taken: the loop the phone recorded is taken out of the videos' sound, as above. The clean loop still plays under the videos, as set in phase 27. Sam said "phase out" there too, and it was read the same way then. `piece-17-room-loop-out.mp4`. Sound: `python3 sketch/piece-3.py OUT.wav 4 third night up deep`. -20.2 LUFS.
- The other reading: the loop goes from under the videos altogether. The same, with no clean loop either, so the guitar is alone from bar 5 until the drums come back. `piece-17-room-loop-out-guitar-alone.mp4`. Sound: the same words and `noloop`. -20.0 LUFS. With nothing under it, the squared-off note ends are in the open here.

![piece 17 with the clean loop under, and with the guitar alone](/assets/mouth-machine/piece-17-guitar-alone.webp)

Both are on the cut with both guitars up 6. Sam said the videos are good and did not say which of piece 16's two guitar cuts, so the one taken then is the one built on.

Both sent at 2:19 pm, as the smaller copies.

## Phase 43: the go-round

2:52 pm

**Sam:** "the guitar sounds super weird now, and theres no beat at all ( i wanted the beat hopefully ripped out of video but left steady in og loop, also same thing for the ending video"

Both piece 17 cuts were wrong, each in its own way. The harder turn-down made the guitar sound wrong: the squared-off note ends that the picture in phase 42 showed are what Sam heard. And the second cut took the beat away, which was never asked. What was meant: the beat goes from the videos' own sound and stays steady from the loop's file. That is what piece 16 already did. So `deep` is out and the guitar is piece 16's again, both videos up 6.

"Same thing for the ending video" needed one thing found first: where the room's beat is inside the third video. Its sound was never used, so nobody had looked. The loop is in there, quiet (44 dB down). Matching it against the loop's file, the room was 5.26 s into a four-bar phrase when the phone started, so the room's first bar line is 1.23 s into the video and a "go to sleep" starts at 3.40 s.

A first try at an ending built on that was half written when the next message came. It was never cut and it is not in the repository.

2:55 pm

**Sam:** "i think a measure of drops, then the video from the end (a % number of measures and lined up based on beat (also kill the audio here since i dont think we contribute anthing other than recoridng of beat), then the guitar ones, then let the beat play another measure with some more drops (reverse drops at end so the last one collapses into the starting point of the first one -- perfect loop"

A new order, and a new word for it, `round`. Piece 18, sixteen bars, 34.6 s:

| bars | what is on the screen | what is heard |
|---|---|---|
| 1 | one drop, opening from a point | the beat alone |
| 2 to 6 | the ending video, five bars | the beat alone. The video's own sound is off |
| 7 to 10 | the first guitar video | its guitar, over the loop |
| 11 to 15 | the second guitar video, fading over its last bar | its guitar, over the loop |
| 16 | the same drop, run backwards, closing into the point | the beat alone |

![piece 18, bar by bar](/assets/mouth-machine/piece-18-timeline-round.webp)

The ending video starts on its own first bar line, 1.23 s in, so the beat the phone filmed and the beat that is heard are the same beat at the same moment. Five whole bars fit from there. The first 1.23 s and the last 1.24 s of the video are not shown.

The loop point, checked by counting lit pixels in each frame: the last three frames of the piece are the second, third and fourth frames of the piece, backwards (25,946 lit, 35,861, 46,229 going out; 35,861, 25,946 coming back, then frame one at 17,479). The drop closes to one step above the dot it opens from, at the same place on the screen, and the next frame is that dot. The beat was checked the same way: bar 16 ends where bar 1 begins in the beat's file, to within two samples.

![the last four frames shown and the first four, with the loop point between them](/assets/mouth-machine/piece-18-loop-point.webp)

By meter: -19.5 LUFS, loudest point 2.5 dB under full. The guitar bars (7 to 15) are piece 16's bars 5 to 13, sample for sample. Nobody on this side has heard it.

`python3 sketch/piece-3.py OUT.mp4 1 night up round`. Sent at 3:03 pm, whole, 29 MB.

What was read into the words, and what was not cut:

- "A measure of drops" and "some more drops": the rule from phase 22 is one drop a bar, and it was kept. So the opening bar is one drop and the last bar is that one drop backwards. The other reading is several drops inside the bar, the inner four on the quarter notes, then the four backwards at the end. Not cut.
- "A % number of measures" was read as a whole number of bars. Five is what fits.
- "Kill the audio here": the video's sound was already off. The beat alone plays under it, not the whole loop, so no "go to sleep" is heard until the guitar videos.
- The last bar has the beat, as asked, and nothing else.

## Phase 44: no fade on the last video

3:23 pm

**Sam:** "dont need the fade on last video just cut when done"

The second guitar video is the last video in the piece. Its fifth bar is the last note ringing out, and since phase 31 the picture faded to the plain ground through that bar. Now it does not. The picture stays at full strength to the end of the bar and the next frame is the last bar of the piece, the drop coming back in. A new word, `cut`.

Top row piece 18, bottom row piece 19, the same six moments: four through the video's last bar, then the first frame after it, then the ring arriving.

![the last bar of the second video, faded and cut](/assets/mouth-machine/piece-19-cut-not-fade.webp)

By counting lit pixels: the frame before the cut was empty in piece 18 and has 153,846 lit in piece 19. One frame after the cut is empty, because the ring starts wider than the screen, and its edge is in from the frame after that. Every frame before the video's last bar is the same in both pieces, and so is the loop point.

The sound had its own small fade there, on the guitar only, over the second half of that bar. It went with the picture's. It changes almost nothing: by the bar line the last note has rung down to 51 dB under full, 31 under the video's own level, and the loop is over it. Piece 19's sound is piece 18's, sample for sample, up to the middle of bar 15, and 0.1 dB from it after. Loudest point still 2.5 dB under full. Nobody on this side has heard it.

![piece 19, bar by bar](/assets/mouth-machine/piece-19-timeline-round-cut.webp)

"When done" was read as when its five bars are done, not when the phone stopped filming, which is a second and a half later and not on a bar line.

`python3 sketch/piece-3.py OUT.mp4 1 night up round cut`. `piece-19-round-cut.mp4`, sent at 3:28 pm, whole, 29 MB.

## Phase 45: the loop off

8:42 pm

**Sam:** "also kill loop on computer"

The loop had been playing in the room for 19 hours and 49 minutes. `chop` was stopped, and that is the only thing that was. The drops engine and the screen are still running, with nothing clocking the drops. The display is still held awake.

To bring it back, the command it was running, from the `chop` worktree's `maschine/`, with this log's folder as `MM`:

`./target/release/chop $MM/takes/1-beat.m4a --take 0 --bpm 110.9 --layer $MM/states/4-second-layer-softer.flac`

`MM=~/Code/Me/portal.worktrees/mouth-log/maschine/mouth-machine`

No picture: nothing was made, something was switched off.

## Versions, by what it can do

A version is a thing the mouth machine could not do before. Fixes and second tries do not get a number. The commit is where it first sits in this folder; the engine's own code is in pull requests 32 and 34.

| version | what it can do | phase | first here |
| --- | --- | --- | --- |
| 1 | turn a voice memo into a beat: find the hits, find the count, snap them to it | 1 to 3 | `85b2783` |
| 2 | lay a second take over the beat, placed by the room sound in it, not snapped | 4 | `85b2783` |
| 3 | lay a voice over both: three layers, twelve bars | 5 | `85b2783` |
| 4 | play the loop through Portal's own player, with the drops falling on the one | 7 | `3fa68d5` |
| 5 | cut a phone video on the bar lines, by the drums in the room | 9, 10 | `65ad13d` |
| 6 | show a video in two colours, and trade them at a chosen moment | 11, 12 | `0b009cf` |
| 7 | put cuts in any order into one piece that repeats on the bar | 13, 14 | `4d54caf` |
| 8 | draw drops and lay them with footage and a lone voice, every frame off one clock | 15, 16 | `1ffe82f` |
| 9 | change one layer after the fact and leave the others exactly as they were | 18, 20 | `a9a26dd` |
| 10 | turn the room loop down in a phone video so the guitar is what is left | 19 | `7ffe3d5` |
| 11 | drops as whole notes for as many bars as asked, and a video that plays out and drains | 21, 22 | `dcf67ce` |
| 12 | draw any render as one timeline: stills, sections, sound | 25 | `dcf67ce` |
| 13 | drop a layer an octave without changing the tempo, hit by hit | 24 | `dcf67ce` |
| 14 | bring the drums back at the end at the loop's own balance; one picture, more than one soundtrack | 26 | `adcb9cb` |
| 15 | play the loop itself, clean, under a video's guitar, locked to the video's bar lines | 27 | `6355521` |
| 16 | start the drops anywhere on the pad path, and give the last ring longer to fade | 28 | `6355521` |
| 17 | draw the drops as clean rings, thick when they land, with no speckle | 30 | `cf69137` |
| 18 | fade a ring, or the end of the piece, through the colours between seafoam and olive | 31 | `d57044c` |
| 19 | put the whole piece on the light ground, and keep grain inside the rings only | 32 | `2a7175a` |
| 20 | end the piece on the ground it starts on; start the room again after a restart | 33 | `58e14c1` |
| 21 | keep a loop: the second layer 7 down, in the room and in the piece | 34 | `af6926c` |
| 22 | draw the rings smooth, with no grain anywhere | 35 | `44d8282` |
| 23 | draw the Portal screen's drops a second way: white grain rings on black, switchable | 36 | portal `d34d348` |
| 24 | make the whole piece in black and white grain, with one word | 37 | `3f01e3d` |
| 25 | put the black and white piece on the white ground | 38 | `93bfac2` |
| 26 | end the piece on a third video, all of it, in place of the plain closing bars | 40 | `81776ff` |
| 27 | let a video's cut line follow each frame's own light, so dim footage still splits cleanly | 40 | `81776ff` |
| 28 | put the whole piece on the olive ground, both videos too, with one word | 40 | `81776ff` |
| 29 | put the whole piece on black with seafoam shapes, with one word | 41 | `a3fb0fd` |
| 30 | turn the guitar up in a phone video without turning up the loop or the hiss left in it | 41 | `a3fb0fd` |
| 31 | hold a video's loudest picks, so it can come up without the rest of the piece coming down | 41 | `a3fb0fd` |
| 32 | take the room's loop nearly all the way out of a phone video's sound, at the cost of the ends of notes | 42 | `e6a1e79` |
| 33 | make a piece that goes round: a drop run backwards closes into the point the first drop opens from, and the beat carries over the join | 43 | `4506293` |
| 34 | find the room's beat inside a phone video and lay the video on the piece's bar lines by it | 43 | `4506293` |

## Open

- Piece 15: six bars at its own speed, or squeezed into two
- Piece 18: one drop a bar was kept, so the opening is one drop and the close is that drop backwards. Or several drops inside each of those bars
- Piece 18: the beat alone under the ending video and the two drop bars, or the whole loop with "go to sleep"
- Piece 18: five bars of the ending video from its first bar line. Its first and last 1.2 s are not seen
- Piece 18: does the join read as one move when it repeats
- Piece 16: is the guitar loud enough now, and is it both up 6 or the first one brought level
- Piece 16: did the second video's loudest picks keep their snap with the hold on
- Piece 16: in the second video's first bar the guitar now covers more of "go to sleep". Is that right
- Piece 16: is plain black the right black, and does the third video read on it
- Piece 15: should the new video's own sound be in, and is a six-bar drum ending right
- Piece 15: is the new video's line right now, or does it want more
- Piece 7: one bar or two for the last ring
- Piece 7: the beat alone under the drops, or the whole loop from the first bar
- Piece 7: are the two drum bars at the end still wanted now that the last "go to sleep" is gone
- Piece 7: the second drum loop alone, as recorded or down 13
- Piece 7: are the two drops over the drums at the end wanted, or should that be an empty screen
- Guitar only: is the loop turned down enough, and did the guitar keep its sound
- The drums an octave down: keep, drop, or other numbers. And does it go into the room or a piece
- The second layer at 13 down: are the highs meant to be 4 softer on top. And should it go into the room
- Is the beat under the drops the right sound, and is it too loud or too quiet against the videos
- Piece 19: the second video's last bar is a note ringing out, now in full picture. Five bars, or stop after four
- Piece 19: one empty frame between the video and the ring coming in. Wanted, or should the ring already be there
- The two colours: are these the right seafoam and olive, and is 5 the right line
- Was the flip read right: on "go", inside the ending. And does it flip back
- Piece 1 or piece 2, and is it loud enough
- If "just restart this loop" meant the loop in the room, it has not been restarted
- Which cut of the first video is the one: the last four bars, or the four from "go to sleep"
- Is the guitar loop the right two bars. Nobody on this side has heard it
- Is the ending the last bar or only the last note, and was there a longer fade than the phone caught
- Should the guitar loop become a layer, and should the video loop with it on the screen
- Do the drops look on the one, or do they need the nudge. The video says yes, to within a frame
- Whole notes, or down to half
- Does the loop sound the same through the native player as it did from the file
- Is the third layer kept, moved, or redone
- Did the bump go away
- Should the room sound after "go to sleep" stay
- The native player plays layers now, but only ones built ahead of time. It cannot yet take a new one while running
- Pads, and the phone
- A name
