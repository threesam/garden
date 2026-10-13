Piece 2 of the mouth machine series. The first piece is "sea foam", and its log is `../LOG.md`. This one is its own: its own name, its own colours, its own folder. The rules in that log hold here too: every turn that changes what is heard is a log entry and a commit, Sam's words are quoted, nothing playing is swapped without saying so first, and a thing is "kept" only when Sam says so.

Sam named it on October 12: "This one's not called Seafoam. So it should be different. [...] This should be called Love Bomb. Love Bombed." Written here as "love bombed", the way "sea foam" is written, and the name is read as the second of the two he said.

- `takes/` what Sam recorded, untouched. `states/` one full cycle of the loop each time. `pictures/` what it looked like
- The scripts are in `../sketch/`, shared with the series. Commands below are run from this folder
- The videos are in `~/Movies/mouth-machine/`, named `love-bombed-*`

## From seed to now

**The beat in three**
1. Seed: a voice memo, 5.7 seconds, low mouth sounds. `takes/1-three-four.m4a`
2. The ask: "It should be 3-4 timing. Trim the, you know, front for the first to get the, the first beat and quantize it. And then play it."
3. What it became: four bars of three, snapped to its own beat, one sound per beat. `states/1-three-four.flac` ![two waveforms of the mouth beat: as played, and snapped to its own beat](/assets/love-bombed/three-four-snapped.webp) (phase 1)
4. Then: "This needs a filter [...] It should be soft with a little bit of bassiness to it." and "Timing's great though." `states/2-three-four-soft.flac` ![a chart of the loop from low sound to high: the soft version falls away above 1,000 Hz](/assets/love-bombed/three-four-soft-low.webp) (phase 2)

**Music on the loop**
1. Seed: a phone video of Sam playing over the soft loop in the room. Sound in `takes/2-three-four-music.m4a`
2. The ask: "it should line up pretty perfectly with the beat over [...] like four measures [...] Map it. And then I want to hear it and see it play."
3. What it became: nineteen bar lines found by the loop in the room, and four bars cut on them. ![a picture of every frequency in the phone video's sound, with the loop's bar lines drawn over it](/assets/love-bombed/bar-map.webp) (phase 3)

**The look**
1. The ask: "This is also a new project. This one's not called Seafoam. So it should be different."
2. What it became: three pairs of colours to choose from, rose on wine first. ![the first frame in three pairs of colours: pink on wine, red on near-black, pale pink on crimson](/assets/love-bombed/colours.webp) (phase 5)

## Phase 1: a beat in three

Monday October 12, 9:41 AM

**Sam:** "All right, let's make some music. I just airdropped a voice memo. It should be 3-4 timing. Trim the, you know, front for the first to get the, the first beat and quantize it. And then play it."

**Sam:** "Make sure to document."

Take: `takes/1-three-four.m4a`, 5.7 seconds, from the phone. The name is this side's. The memo's own title is not written here.

What is in it: four big low sounds, each a little over a second after the last. Two quieter sounds follow the first. Three sounds fill the last bar. That is one two three, four times.

What the hit finder heard, the same one the player uses:

- A beat of 351.5 ms. That is 170.7 beats a minute.
- Twelve beats. Four bars of three. 4.22 seconds.
- The step was found, not assumed. The finder tried every step from 120 to 450 ms and this one fit best. There is one sound per beat and nothing between.

What was done:

- Trimmed: 55 ms off the front, up to the first sound. About 1.4 seconds of room after the last sound is left out.
- Snapped: ten sounds, each moved to its beat. The least moved 2 ms, the most 52 ms. The four big ones moved 2, 45, 38 and 6.
- Beats 8 and 9 have no sound of their own. What is heard there is the tail of beat 7.
- The tail of the last sound runs past the end of the loop, so it comes back in at the start.

![the take as played over the same take snapped: twelve beat lines, a heavier one every three, and green marks where each sound began](/assets/love-bombed/three-four-snapped.webp)

One new rule had to be made. The finder cut three of the sounds in two: it heard the first big one as a hit at 0.06 s and another at 0.22 s. Snapping both would move the second half 168 ms back, on top of the first half. So on each beat only the hit nearest the beat is kept. Any other hit on that beat stays inside its neighbour and rides along. Nothing is stacked on itself.

Playing: started in the room at 9:41, through Portal's own player, as snapped. Nothing was playing before it, so nothing was swapped. Nobody on this side has heard it.

How to get here:

- from this folder: `chop takes/1-three-four.m4a --div 1 --sens 0.5 --dry | python3 ../sketch/snap-beats.py take.wav 12 loop.wav pictures/three-four-snapped.png "Take 1: four bars of three, snapped to its own beat" 3`
- `take.wav` is the memo as a 48 kHz wave file. `loop.wav` was saved as `states/1-three-four.flac`
- to play: `chop states/1-three-four.flac --div 1 --beats 12 --tight 0 --sens 0.5`. `--tight 0` means play it as it is, since it is already snapped

**Not yet kept: `states/1-three-four.flac`**

Saved: `sketch/snap-beats.py`.

## Phase 2: soft, with a little bass

Monday October 12, 9:43 AM

**Sam:** "This needs a filter. Listen to it. It sounds too windy and harsh. It should be soft with a little bit of bassiness to it."

**Sam:** "Timing's great though."

The timing was not touched. Only the tone.

This side cannot listen. It measured instead. The sound comes out of the Scarlett, so the low end is really heard. Where the loop's sound sat:

- Most of it between 40 and 320 Hz. That is the body.
- A long shelf of air from 640 Hz up to 10,000. Mouth sounds carry breath, and a phone picks it up. That was read as "windy" and "harsh".
- Some under 55 Hz. That is breath hitting the microphone, a thump more than a note.

What was done, three moves:

- Everything above 1,000 Hz falls away, steeply. By 2,000 it is 25 down, by 3,000 it is gone.
- Everything below 55 Hz falls away, gently.
- 80 to 180 Hz comes up 3. That is the "little bit of bassiness".

It is as loud as it was. Nothing moved in time: the filter runs forwards and backwards, so each sound starts where it started.

![how much sound there is at each height, before in grey and after in orange: the same from 100 to 700 Hz, lower under 55, and falling off a cliff above 1,000](/assets/love-bombed/three-four-soft-low.webp)

Playing: the harsh one was stopped and the soft one started in its place at 9:43, because Sam asked for the filter on what was playing. There was a moment of silence at the swap. Nobody on this side has heard it.

One thing found on the way. The player could not read the soft loop by itself. With the sharp edges gone it heard a beat of 141 ms, not 351. So the soft loop is played as a whole file, end to end, the way "go to sleep" was in phase 5. The player still keeps the count of twelve at 170.7 for the drops.

How to get here:

- `python3 ../sketch/soft-low.py loop.wav soft.wav 55 1000 3 pictures/three-four-soft-low.png "Take 1: the air off the top, the thump off the bottom"`. `loop.wav` is `states/1-three-four.flac` as a wave file. Saved as `states/2-three-four-soft.flac`
- the three numbers are the low cut, the high cut and the lift. They are first guesses
- to play: `chop takes/1-three-four.m4a --take 0 --div 1 --beats 12 --bpm 170.7 --layer states/2-three-four-soft.flac`

**Not yet kept: `states/2-three-four-soft.flac`.** The timing in `states/1-three-four.flac` is the part Sam called great.

Saved: `sketch/soft-low.py`.

## Phase 3: the music on the beat, mapped

Monday October 12, 9:55 AM

**Sam:** "I just sent through a video where when I start playing the music, it should line up pretty perfectly with the beat over, I don't, I don't know, like four measures or something like that. Map it. And then I want to hear it and see it play."

**Sam:** "first three lines on that waveform look like setup"

Take: `takes/2-three-four-music.m4a`, the video's sound, 20.8 seconds. The video itself is in `~/Movies/mouth-machine/source/love-bombed-three-four-music.MOV`. Nobody on this side has watched it. The first frame shows a guitar neck and two hands.

How the loop was found in the room sound. The loop was playing in the room while Sam played, so it is faint under the music. Its loudness was slid along the loop's own, in two bands, in the first three seconds before the music starts. Both bands put the bar lines at the same spot, to the millisecond, 0.824 s in and every 1,054.5 ms after. The loop in the room could be either the harsh one or the soft one. Both give the same answer. That is the timing Sam called great.

The check that it is right: the music was not used to find the bar lines, so it can be checked against them. Its chord changes land on the bar lines. Of 35 notes after the 3-second mark the middle half sit between 6 and 62 ms after the beat, and the middle one 35 ms after. That is a small, steady lateness, about the same as a speaker and a phone microphone add. It is not measured as that.

![the video's sound as a picture: nineteen numbered bar lines in seafoam, thin beat lines, white marks where notes start. Quiet until line 3, then chords that change on the lines](/assets/love-bombed/bar-map.webp)

"first three lines look like setup": read as the three bar lines before the music. Bars 1 and 2 are quiet and busy only with the loop and small sounds. The first chord comes at the third line, 66 ms after it. So the four bars start on the third line and run to the seventh, 2.934 to 7.152 s. That is one full cycle of the loop, so it repeats without a seam. If "setup" meant the third line too, the four bars start one bar later, at 3.989 s.

What was made:

- `love-bombed-bars-3-to-6.mov`, the four bars as the phone shot them, sound and all. In `~/Movies/mouth-machine/`
- `love-bombed-bars-3-to-6-seafoam.mp4`, the same in two colours (removed in phase 5). It is 4.23 s, upright, 1080 by 1920. A look at four thresholds picked 35: at the usual 5 the room is bright enough that the whole frame went seafoam. At 35 the frets and the hands show. ![the first frame in seafoam and olive: a guitar neck and two hands](/assets/love-bombed/first-frame-seafoam.webp)

The sound in it is the room as recorded: the music and the loop under it, not the loop alone.

Playing: the soft loop that was running in the room was stopped for this, because Sam asked to hear the video. The video is open in QuickTime Player but is not playing. QuickTime did not answer a request to play it (`AppleEvent timed out`), so there is no sound in the room now. It needs the space bar, or the play button.

**Not yet kept: the four bars.**

How to get here, from this folder:

- `python3 ../sketch/map-bars.py take.wav states/2-three-four-soft.flac 351.5 3 4 pictures/bar-map.png "title"`. `take.wav` is `takes/2-three-four-music.m4a` as a 48 kHz wave file
- `sh ../sketch/clip.sh source/love-bombed-three-four-music.MOV 2.934 4.218 love-bombed-bars-3-to-6.mov`
- `sh ../sketch/duotone.sh love-bombed-bars-3-to-6.mov love-bombed-bars-3-to-6-seafoam.mp4 (removed in phase 5) 35 3`

Saved: `sketch/map-bars.py`.

## Phase 4: why QuickTime

Monday October 12, 9:56 AM

**Sam:** "Why are we using QuickTime? We should probably have our own [...] video rendering without any additional [...] going on. This is mostly going to be lo-fi anyway, so"

Nothing was made or played. Looked at what exists.

Why QuickTime, plainly: a stock player was the thing already on the Mac, and it was used for every piece in this log. It was never a decision. It has three real faults here:

- It can be asked to play only through AppleScript, and it did not answer in phase 68. Nothing could be played without Sam pressing a key.
- Its sound is the video's own sound, with the loop recorded into it. It cannot play the loop from the engine and the picture from the file on one clock.
- Every file has to be rendered to a movie first. No change to a take can be seen until a render ends.

What Portal has: no video playback. The word "AVFoundation" appears once in `Sources/portal/Looper.swift`, and that is audio. The screen is a web view that draws the drops. The engine that plays the loop, `chop`, already sends the screen its place in the loop about a hundred times a second (the `clock` message in `PROTOCOL.md`).

The shape that fits, not built: the picture is a few small pictures, not a movie. Lo-fi helps. The two-colour step cuts each frame to one bit a pixel, so a cut of four bars at 12 frames a second and 360 wide is a few hundred kilobytes. The screen plays the picture from the loop's own place, so picture and sound cannot drift, and a change to the take shows on the next pass with no render. This is series phase 63's "two clocks" rule: the loop has one clock and everything else follows it.

Cost, named: this is a feature in Portal, a pull request of its own. The video's sound would not play: the engine would play the loop and the music as layers. That needs the music cut out on its own, which is the open item on the loop under the music in phase 68.

Waiting on Sam: build it, or keep rendering movies for now.

## Phase 5: a piece of its own

Monday October 12, 9:58 AM

**Sam:** "This is also a new project. This one's not called Seafoam. So it should be different. Right, so port that over to something else. This should be called Love Bomb. Love Bombed."

What was read: everything since the three-count beat, phases 66 to 69 of the series log, is not part of sea foam. It is a second piece. "Port that over" was read as: give it its own place, and do not reuse sea foam's colours.

What was done:

- A folder of its own, `love-bombed/`, with this log. The takes, states and pictures moved in with `git mv`, so their history came with them. Renumbered from 1 inside the piece: `takes/1-three-four.m4a`, `takes/2-three-four-music.m4a`, `states/1-three-four.flac`, `states/2-three-four-soft.flac`
- Phases 66 to 69 became phases 1 to 4 here. The series log keeps a pointer, its two version rows (36 and 37, since snapping to any count and mapping bar lines are things the series can do now) and the one open question that is about every piece, the video player
- The scripts stayed in the series' `sketch/`, shared, since they are tools and not the piece
- The videos in `~/Movies/mouth-machine/` were renamed `love-bombed-*`. The seafoam render of the four bars was removed. It was for the wrong piece and comes back from the `.mov` in one command

New colours. Sea foam is seafoam and olive. This piece should not be. Three pairs were tried on the first frame, same threshold of 35:

![the first frame three times: pink on dark wine, coral red on near black, pale pink on crimson](/assets/love-bombed/colours.webp)

- left: pink `#FF8FB3` on wine `#240A14`
- middle: coral `#FF4D5E` on near black `#160709`
- right: pale pink `#F7C6D4` on crimson `#B0123B`

These are this side's guesses. The left one was rendered as a video, `love-bombed-bars-3-to-6-rose.mp4`, 4.2 s, so there is one to look at. The other two take a minute each. The look of the loved and the bombed is Sam's to choose, so this is not kept.

Nothing is playing in the room. The loop and the video are both stopped.

Not yet kept: the colours, the four bars.

How to get here, from `love-bombed/`:

- `sh ../sketch/duotone.sh ~/Movies/mouth-machine/love-bombed-bars-3-to-6.mov out.mp4 35 3 FF8FB3 240A14`

## Phase 6: more silhouette

Sam: "need to change the threshold a bit so we get more silhouette for movement because right now it's all washing to white."

Why it washed: the room is bright, so most of the picture is brighter than the line at 35 and all of it goes to the light colour. Only the dark guitar and the neck were left. Raising the line turns more of the picture dark, so the arms, hands and head show against the wall as shapes.

Tried 35, 55, 70, 85 on one frame: 55 and 70 show the arms and hands, 85 is mostly dark. Picked 60 as the middle. Pink and wine kept for now, still not Sam's pick.

The four-bar clip was cut again at 60, same 4.2 s, same sound. Picture: `pictures/threshold-35-and-60.png` (top row 35, bottom row 60, three moments each) and `pictures/first-frame.png`.

Nothing is playing in the room.

Sam, shown 35 over 60: "bottom one". **Kept: threshold 60.**

Not yet kept: the colours, the four bars.

How to get here, from `love-bombed/`:

- `sh ../sketch/duotone.sh ~/Movies/mouth-machine/love-bombed-bars-3-to-6.mov out.mp4 60 3 FF8FB3 240A14`

## Phase 7: the whole video's sound, and where to cut it

Sam: "play the loop again. This time with the music." Then, after hearing the four-bar loop: "I don't hear the whole musical composition", "I need the full video to play. The full audio from the video to play." Then "that last measure needs to be cut", "more needs to be cut at the end... Maybe it's four bars", then "put that all back. Maybe I'm hearing it wrong and there's shit at the beginning."

What played, in order: the four-bar cut (the loop's cadence only, too fast), the full 20.8 s sound of the video, minus the last bar (ends 19.805 s), minus four bars (ends 15.587 s), the full sound again, and now from bar 3 (starts 2.934 s, ends 20.799 s). It is played with ffplay on repeat, not chop, so there are no drops on the screen.

The loudness chart does not show the music stopping: it runs to 19.6 s. The first 2.8 s is nearly silent with three small bumps. That fits Sam's second guess, the beginning.

Sam asked for a picture of it with a slider that snaps to the tick points. `sketch/cut-picker.py` builds one page: the waveform with bar lines (numbered) and beat ticks, two handles that snap to bars (box for beats), Play runs between them on repeat, and the page shows the start and end times and the cut command. Not committed with its sound: the page is built at `~/Movies/mouth-machine/love-bombed-cut-picker.html`.

- `python3 ../sketch/cut-picker.py ~/Movies/mouth-machine/love-bombed-full-audio.wav out.html 0.824 351.5 3 "love bombed, where to cut"`

Sam, after hearing it: "the latency is a little bit off... the whole sample probably needs to be shifted a certain amount so that that first spike, the attack of the guitar, is lined up with that measure you cut... and the last one needs to be cut as well, the last measure."

The first attack is at 3.010 s. The bar line from the room mapping is at 2.934 s, so the guitar was 76 ms after it (the notes after 3 s sit 35 ms late on average, the first one is later than that). Fix: move the grid, not the sound. Bar lines now start at 0.900 s (was 0.824). The cut starts on the attack at 3.010 s and runs 16 bars, 16.871 s, to 19.881 s. That drops the last measure. Playing now with ffplay on repeat: `~/Movies/mouth-machine/love-bombed-16-bars-on-the-attack.mov`. The picker page is rebuilt on the new grid.

Sam: "maybe you shifted the sample a little too much. And then also, I need some type of crossfade so you don't get the pop from the loop restarting."

Backed the shift off from 76 ms to 35 ms, the average the later notes sit after the bar line. The cut now starts at 2.969 s, still 16 bars (16.871 s). `sketch/loop-xfade.py` fades the 80 ms of sound just past the end in over the start (equal power), so the end runs into the start with no jump. Playing now: `~/Movies/mouth-machine/love-bombed-loop-xfade.wav` (picture of the video: `love-bombed-16-bars-shift-35.mov`). No picture of the loop point: it is an 80 ms join, heard not seen.

- `python3 ../sketch/loop-xfade.py ~/Movies/mouth-machine/love-bombed-full-audio.wav out.wav 2.969 16.871 80`

Sam: "All of these clips are going to need to get that treatment." Then "the first two have 16, the last one has 8" (bars).

Same treatment as the first video, on each: find the first guitar attack near bar 3 (the quiet before it is the part cut), start 41 ms before it, keep whole bars, drop the last measure, crossfade the loop point (80 ms).

| video | bar 3 line | first attack | cut starts | bars | length |
| --- | --- | --- | --- | --- | --- |
| 6613 | 2.386 s | 2.528 s (+142 ms) | 2.487 s | 16 | 16.872 s |
| 6616 | 2.712 s | 2.830 s (+118 ms) | 2.789 s | 16 | 16.872 s |
| 6619 | 2.965 s | 3.146 s (+181 ms) | 3.105 s | 8 | 8.436 s |

Files in `~/Movies/mouth-machine/`: `love-bombed-take-<n>-cut.mov` (video, with sound) and `love-bombed-take-<n>-loop.wav` (crossfaded loop). Picture: `pictures/new-takes-envelopes.png` (guitar loudness with bar lines for the three). Each video starts with a click at 0 s (the phone's start), which the cut removes. These attacks sit later after the bar line than the first video's (76 ms), so the shift here is not the same number of ms from the bar line, it is the same 41 ms before the attack. Not played yet.

Not yet kept: any of the cuts.

## Phase 8: three new videos replace the first

Sam: "sent three new videos through that are going to replace the first video I sent." They are IMG_6613 (21.5 s), IMG_6616 (21.8 s) and IMG_6619 (13.6 s), copied to `~/Movies/mouth-machine/source/love-bombed-take-<n>.MOV`. The first video (IMG_6607) is replaced by these and stays on disk. Each was mapped against the soft beat the same way as the first (`sketch/map-bars.py`, 351.5 ms, 3 beats, 4 bars).

| video | bar lines at | notes after 3 s, middle half, ms off the beat | middle |
| --- | --- | --- | --- |
| 6613 | 0.277 s + k x 1054.5 ms | 0 to +60 | +23 |
| 6616 | 0.603 s + k x 1054.5 ms | 0 to +63 | +45 |
| 6619 | 0.856 s + k x 1054.5 ms | +2 to +22 | +5 |

6619 sits tightest on the beat but has only eight notes. Nothing cut yet. Pictures: `pictures/bar-map-6613.png`, `bar-map-6616.png`, `bar-map-6619.png`.

Not yet kept: any of the cuts.

## Phase 9: one video, the sequence

Sam: "cut the one video with threshold effect and beat underneath and the sequencing of clips." The order he asked for before: first clip once, last clip three times, first clip twice, last clip once. Read as 6613 (first), 6619 (last): 6613, 6619 x3, 6613 x2, 6619, 84.4 s. 6616 is not in it.

Threshold 60, pink and wine, as kept. The beat is the one in the room recording of each clip, not a second one laid on top (two would not line up). To keep that beat running through the joins, all cuts now start the same distance after a bar line (77 ms) instead of 41 ms before each attack: 6613 from 2.463 s (16 bars), 6619 from 3.042 s (8 bars). Each cut is whole bars, so the beat does not jump at a join. The guitar attacks sit where they were.

Files in `~/Movies/mouth-machine/`: `love-bombed-sequence-rose.mp4` (1080 x 1920, 41 MB) and `love-bombed-sequence-rose-720.mp4` (720 wide, the one sent). Built by cutting with `clip.sh`, `duotone.sh ... 60 3 FF8FB3 240A14`, joining the pictures and the sounds, one pass of sound.

Sam: "the second clip is cut wrong", then "should start at 4 i think". 6619 (the second clip) started on bar 3, a small blip, and the loud music starts on bar 4. Recut: 6619 from 4.096 s (bar 4 line 4.019 s plus the same 77 ms), still 8 bars, 8.436 s, so it ends before the loud attack on bar 12. Same order and look. New files: `love-bombed-sequence-rose-v2.mp4` and `-v2-720.mp4` (the one sent). The first version is kept beside it. Not checked: whether 6613 should also start on bar 4 (its loud chord is on bar 4 too).

Not yet kept: the colours, the sequence.

## Phase 10: the clips get names, all three in one cut

Sam: "I'm not actually seeing all three videos right now. I'm only seeing two of them... they all have different positions. So the one where I'm sitting in the center, one where I'm sitting to the left, bottom left, one where I'm sitting top right. Let's just label them that."

The earlier sequence only used 6613 and 6619, so 6616 never showed. Named by where Sam sits in the picture (read off one frame of each, so check them): 6613 = bottom-left, 6616 = center, 6619 = top-right. Files in `~/Movies/mouth-machine/` renamed: `source/love-bombed-<position>.MOV`, `love-bombed-<position>-cut.mov`, `-cut.wav`, `-loop.wav`. Old take-<n> names are gone from disk; the numbers are here in the log.

New cut with all three, once each, in the order bottom-left, center, top-right (my order, not Sam's): `love-bombed-all-three-rose.mp4` (and `-720.mp4`, the one sent), 41.2 s. Cuts: bottom-left from 2.463 s (16 bars), center from 2.789 s (16 bars), top-right from 4.096 s (8 bars, starts on bar 4). Same look: threshold 60, pink and wine.

The 84 s sequence with only two clips (`love-bombed-sequence-rose-v2`) still exists. Not yet kept: the order, which clips start on bar 4.

## Phase 11: the threshold goes clear, over a gradient

Sam: "the way the threshold... actually work is it doesn't fade to the color, it fades to transparent. And then we can have a background for the whole thing that's actually just a gradient. A gradient of those wine to pink colors. Similar to how we did it for the Pyre Divers background."

The dark part of the picture (the silhouette) stays one flat wine-black, 240A14. The bright part goes clear, with a soft edge (3 percent of brightness either side of the threshold, still 60), and the background shows through. The background copies the pyre-divers splash (`#splash` in `src/app.css`): one base colour with a light glow at 22% / 16% and a dark glow at 84% / 84%. Here: base B02E5C, light glow FF8FB3 (the pink), dark glow 6B1530 (wine). My colours, not Sam's, for the base and wine glow.

New scripts in `../sketch/`: `gradient.py` makes the background picture, `duotone-clear.sh` does the clear threshold (`sh duotone-clear.sh in.mov out.mp4 bg.png 60 3 240A14 3`). Same cut as phase 10 (bottom-left, center, top-right, 42 s): `~/Movies/mouth-machine/love-bombed-all-three-gradient.mp4` and `-720.mp4` (sent). Picture: `pictures/gradient-first-frame.png`.

Sam: "I think light source was top right, also, gradient not smooth enough, see ring lines." Then "i don't like it as much" and "might need bg movement".

Three changes. The light glow is now top right and the dark one bottom left (the pyre splash flipped left to right). The rings were banding: the gradient only had 256 steps per colour, so each step showed as a ring. Fixed by drawing it small, scaling it up with error-diffusion dither, and adding a touch of noise. And the background now moves: the light glow circles slowly top right and the dark glow circles bottom left, going opposite ways, one full circle per loop cycle (4.218 s), so it comes round with the music. Every cut is a whole number of cycles, so it runs on unbroken across the joins.

"I don't like it as much" was said about the still gradient with the clear threshold. I read it as the gradient looking dead, since "bg movement" came right after. If it is the clear look itself, the flat pink and wine version is `love-bombed-all-three-rose-720.mp4`.

New in `../sketch/`: `gradient-move.py`; `duotone-clear.sh` now takes a video background and an offset. File: `~/Movies/mouth-machine/love-bombed-all-three-moving.mp4` (and `-720.mp4`, sent). Picture: `pictures/moving-background-two-moments.png`. The earlier still-gradient files are kept (`...-gradient...`). Not yet kept: the look, the circle size and speed.

Not yet kept: the gradient colours, the soft edge.

## Phase 12: flat again, a new order, a softer last clip

Sam: "let's just go to the flat background. It makes it look crisper... I think we're going to be something else back there." Back to the flat pink and wine, threshold 60 (the moving and still gradients are kept on disk, not used).

New order, from Sam's words: first half of bottom-left twice, bottom-left in full, center; then that whole block again; then top-right four times. Half = the first 8 bars (8.436 s). In seconds: 8.4, 8.4, 16.9, 16.9, 8.4, 8.4, 16.9, 16.9, then 4 x 8.4, 135.0 s in all. All cuts start at the same distance after a bar line, so the beat runs on through every join.

Sam: "take some of the harshness away from the guitar... the last one, it comes through a little bit harsh because I'm actually strumming it... take some of those upper mids down just a little bit, probably do a little bit of a low pass so you don't get the boom and just sort of round everything out." Done on top-right only (the first clip "sounds good"): below 60 Hz out (the boom), 3.2 kHz down 4 dB, 1.8 kHz down 2 dB, and everything above 6.5 kHz rolled off, then loudness matched (+0.2 dB, so it is not quieter). Read "low pass so you don't get the boom" as a high-pass for the boom plus a low-pass for the top, my reading of two words that cross. Not run on bottom-left or center.

File: `~/Movies/mouth-machine/love-bombed-sequence-flat.mp4` (and `-720.mp4`, sent). Not yet kept: the order, the amounts of the softening.

## Phase 13: four videos as the background, in letters

Sam: "I just dropped four videos in there. They should be in order... I would like those to become the background... don't shrink them at all. Just have them be the same size, and then put them behind. Have the other videos be... transparent pixels, if they're whatever threshold... so you will be able to see the other videos playing behind them. The other videos should probably be thresholded too, but maybe let's do the ASCII art for them instead."

The four videos did arrive (AirDrop, 14:03, in Downloads), but keep their original shooting dates (2019 to 2024), so a search by time missed them. Taken in file order, which is also date order: IMG_0242 (12.8 s), IMG_0533 (14.0 s), IMG_1227 (17.6 s), IMG_1543 (10.4 s), 54.9 s together. Copies in `~/Movies/mouth-machine/source/love-bombed-bg-<1-4>-<name>`; originals untouched.

Built first, tested on stand-ins (one of the guitar clips as the background): `../sketch/ascii-video.py` turns a video into letters (12 x 20 pixel cells, darker = denser, brightness stretched per frame, pink paper with rose ink, full frame, no shrinking), and `duotone-clear.sh` already makes the guitar clips' bright part clear over a video background (flat wine silhouette stays). Picture: `pictures/ascii-behind-test.png`, ASCII layer on the left, with the guitar clip over it on the right. Ink contrast is low on purpose, so the letters do not fight the silhouette. Colours are mine.

Rendered: the four as letters (landscape ones scaled to fill the page and cropped in the middle, not squashed), played one after another and looped under the whole 135 s cut from phase 12, same order of guitar clips. The beat in the sound is unchanged (top-right still softened). File: `~/Movies/mouth-machine/love-bombed-ascii-behind.mp4` (and `-720.mp4`, sent). Picture: `pictures/ascii-behind-four-moments.png` (5 s, 30 s, 60 s, 115 s).

Sam, seeing it: "the ASCII should also be the characters but then transparent instead of white... that can be a next step." Not done yet: the paper is still pink. Next: letters only, paper clear.

Not yet kept: the ASCII look, any of the colours, which video sits under which part (all four loop through the whole cut).

## Phase 14: black letters, finer, so she shows

Sam, on the letters: "The ASCII needs to be finer and darker or something so I can see it better. Because I can't really see her popping through at all." Then: "I don't need transparent letters. I need black letters, right? Um, and then transparent background so that whatever we put in the back, we still have another layer." Then, on the finer test: "that's better definition. Can we get more? Like, can we do darker letters?"

- Cells went from 12 x 20 to 8 x 14 pixels, the letters are black, and the middle greys are pushed denser (gamma 0.55), so a face and a body are dark patches instead of a faint grid.
- `sketch/ascii-video.py` can now write the letters alone, black on a clear background (paper "none", ProRes with alpha). The cut below is the same letters flattened onto the pink, because four full-length clear files are very large.
- The guitar cut sits over the letters as before, bright pixels clear. Sent at 720 px wide, 19 MB.

Not yet kept: the letter size, the pink under them, which video sits under which part of the cut.

## Phase 15: shorter, louder, and a fade out

Sam: "the sounds... you can barely hear the music you can barely hear the loop I think we need to bring the volume of that up a little bit also what is so long about it... It should be like through the sequence once and then outro." Then: "the better outro is probably the first half of the second clip just played on a loop... Maybe actually play it 6 times. And then on the start of the third one... start fading it out... There should be silence at the last 2". And: "as the guitar is fading out the video should fade out with the guitar in the same interval."

- Sound was about -26 LUFS. Each piece is now levelled to -18 and the whole is limited, so it comes out near -16 (about 10 dB up), pieces matched to each other.
- Cut: half, half, bottom-left, center (50.6 s), then the first half of center x6 (50.6 s). 101.2 s, down from 135.
- My reading of "next 2 measures ... silence at the last 2": loops 1 and 2 full, 3 and 4 fade (16.9 s), 5 and 6 silent. If it should be a 2-bar fade (2.1 s) and then silence, that is one number to change.
- The picture fades with the sound: the guitar layer goes to clear over the same 16.9 s, the black letters stay.

Not yet kept: the length, the outro choice, the fade length. Which video sits under the outro is still open.

## Phase 16: the labels were wrong, a new order, a reverse outro

Sam: "I think the one we labeled bottom left is actually center." And: "the labels weren't... correct" when sequencing, and "we need to update the loop that's playing right now to be the correct sample."

- My reading: the two names were swapped (top-right stands). The files on disk are renamed to match. IMG_6613 is now the center clip, IMG_6616 the bottom-left. Every cut before this one (phases 9 to 15) played the clips in the wrong places.
- The loop in the room is now the true bottom-left (the sound of IMG_6616).
- New order, as asked: center first half twice, center in full, bottom-left once, top-right once, then the first quarter of bottom-left (4 bars) in reverse, picture and sound, 8 times. The reverse loops 3 to 6 fade (sound and picture together), 7 and 8 are silent. 92.8 s.
- Background: the feet clip is out. Three of the four letter videos are in use until the two new ones arrive in Downloads.

Not yet kept: the swap itself (Sam said "I think"), the order, the fade, the backgrounds.

## Phase 17: nine sung clips, the heads

Sam: nine little clips sung over the loop. "One of them is the longest and sings my love three times. And that one should remain in the top left corner the whole time... another one that says my love twice. If you could break that up into two of them... nine other samples... almost resemble a chorus of even smaller heads behind the main little head... if you cut the width into three, and build a square off of that, that should reside within there... I want the face to be the black now, and I want the dark threshold or whatever to be the transparent bit... they'll fade in and... disappear. The only one that remains the whole time is... the longer one."

- Clips: IMG_6627 to 6631 and 6636 to 6639, 1440 x 1920 portrait, sound included.
- The long one is IMG_6630 (30.8 s). Its three "my love" are at 7.64, 16.03 and 24.45 s, 8.4 s apart, which is 8 bars. Its bar lines sit at 0.305 s + k x 1054.5 ms (the two bands agree within 5 ms). The short clips are too short and quiet to place on the beat this way (bands disagree), so they are not aligned yet.
- The "twice" clip is IMG_6636: phrases at 2.07 to 4.55 s and 10.50 to 13.15 s. Cut at about 7 s into two clips. That, with the other seven, makes the nine chorus clips.
- Look: face (bright) is black, backdrop (dark) is clear, threshold around 85 of 255. The backdrop is dark grey wood, not pure black, so the cut-off is a luma line, not a keyed colour.
- Four seatings were cut as stills (halo, grid, risers, scatter with some heads mid-fade) in the one-third-width square, top left. The picture is not kept in the repo because it is Sam's face. `sketch/heads-options.py` rebuilds it.

Open: which seating, when the lead head comes in (Sam: at the reverse guitar outro), whether chorus clips fade in when they sing (Sam: yes), the cut points inside 6636.

## Phase 18: the heads go in, at the reverse outro

Sam, on the four seatings: "probably top left circle". Then, on the black heads: "back heads should be more transparent or something, kind of nightmare fuel right now", and "maybe make faces the bg color, since there's ascii behind".

- Seating: the ring. Lead head 150 px wide in the middle of the square, nine chorus heads 78 px wide around it.
- When: the lead clip comes in as the reverse outro starts (59.05 s) and stays until its own end (89.6 s). Its bar line is put on the outro's bar line, so its three "my love" start at 66.46, 74.85 and 83.27 s. That is the last bar of reverse loops 2, 4 and 6.
- Chorus: each chorus clip's phrase starts where a lead phrase starts, and its head fades in just before and out just after. My choice, not Sam's: 3 chorus voices join on the first phrase, 6 on the second, all 9 on the third, so one pass shows thin, middle and full. `build` in `love-bombed/heads-spec.json` changes it.
- Sound: only the sung phrases are kept from each clip, with short fades, so the loop that played in the room while singing is not heard between them. Lead set above chorus. Whole cut about -15 LUFS.
- Colour: the heads were black first. Now they are painted in the page's pink, so a head is a clearing in the letters, and the chorus heads are at half strength. On the still, the lead reads as a head-shaped gap, the eyes and mouth are a few letters wide, and the chorus is faint where the letters are thin.
- Found while building: the cut from phase 16 that was never sent had the last frame of the top-right clip frozen over the whole outro in place of the reversed clip (the forward part was not trimmed before the join). Fixed. The sound was right.
- Tried to place the seven short clips on the beat by listening for the room loop in the parts with no singing. Two frequency bands agreed for four clips (their phrases start 80 to 140 ms before a bar line, like the lead's 50 to 110 ms) and disagreed for the rest, so all nine are placed by where the singing starts.
- No picture in the repo: the stills are Sam's face. `sketch/heads-layer.py` with the spec rebuilds the layer and the voices.

Not yet kept: pink or black heads, how strong the chorus is, the 3, 6, 9 build, the last 3 s with letters only.

## Phase 19: black heads, the chorus in the corners

Sam: "maybe put 2 in each corner since everything else is fading away at the end, black is better".

- Heads are black again. The chorus stays at half strength (Sam, phase 18: "back heads should be more transparent").
- The lead stays top left. The chorus leaves the ring: two heads in each corner of the page. Nine voices and eight corner seats, so the ninth sits under the lead. My call.
- The bottom of the page is dark until the guitar picture has faded, so the bottom seats are the last to sing. The build is now 3, 5, 9: first "my love" lead + 3 (top), second + 5 (top), third + all 9.
- The layer is now the size of the page and each head has a seat in page pixels (`love-bombed/heads-spec.json`).
- Found: this ffmpeg loses the last 8 columns of a 1080-wide picture when it goes straight from the video's colour format to the one the blend uses. It put a black strip down the right edge. Going through plain RGB first fixes it. The pink cut sent in phase 18 had the same strip in pink, so it did not show.
- No picture in the repo: the stills are Sam's face.

Not yet kept: the corner seats, where the ninth sits, the build, the chorus strength.

## Phase 20: twelve takes, one per corner, the last three loops

Sam: "let's do main one top left, and then groups of three", "in corners", then "or better, break the main one up into 3, then pick one for each corner, none repeat", "and they sing the last 3 measures", "4 corners x 3 measures = the twelve takes". Then: "why are the heads getting clipped flat in some places?", "I'm pretty sure they should all be round. Like, I literally filmed them correctly." And: "it's like too dark of a contrast, so maybe make them a little more transparent."

- Twelve takes: the long clip's three "my love" as three takes, plus the nine chorus takes. No head stays any more. Each one fades in when it sings and goes.
- "The last 3 measures" is read as the last three of the eight reverse loops (6, 7, 8), which start at 80.14, 84.36 and 88.58 s. Each sung phrase starts on its loop's start. The guitar is almost gone in loop 6 and silent in 7 and 8, so the voices end the piece alone. The last voice ends at 91.6 of 92.8 s.
- Each loop has four takes, one per corner, none used twice. The long clip's phrase is top left each time. The two halves of IMG_6636 are in different loops.
- The flat edges were mine, not the filming. Every head was cut with one fixed box (1000 x 1300 from 240, 420), and the heads are 1,400 to 1,600 tall and sit in different places, so tops and chins were sliced. Now each head is found by its own outline first (box in what is bright, add 6 percent of room, then cut), and the script prints how much bright touches the box edge: 0 percent on all twelve.
- All heads one size (110 px wide with their room) and one strength, 70 percent black, down from full.
- A version with three groups of three in the corners was built between messages and never sent.
- No picture in the repo: the stills are Sam's face.

Not yet kept: loops 6 to 8 as "the last 3 measures", which take sits in which corner, the head size, 70 percent.

## Phase 21: one new background video, and the order on a sheet

Sam: "sent a twenty second one", then "show me order of videos with number so i can reirder", "just first frame should be enough to id".

- One new background clip arrived, IMG_1226 (19.6 s, portrait). It takes the place of the feet clip (IMG_1543), which is out. Sam had said two were coming. One has landed.
- In letters it reads softer than the first three: a figure by a fire at night, most of the frame dark, so most of it is dense letters and the fire is the clearest shape.
- A sheet of first frames was sent: background videos numbered 1 to 4 in playing order (IMG_0242, IMG_0533, IMG_1227, IMG_1226), the feet clip marked out, and the guitar cut lettered A to E.
- The cut is not re-rendered yet. It waits for the order.
- No picture in the repo: the sheet shows people.

## Phase 22: background order, and the letters fade

Sam: "2143", then "actually put 1 last", "it's my favorite", then "can we fade out ascii on last video? always through the reverses", "halfway through".

- Background order is 2, 4, 3, then 1 (IMG_0533, IMG_1226, IMG_1227, IMG_0242). The first three add up to 51.2 s, so video 1 starts about 8 s before the reverses (59.05 s) and repeats to the end.
- The letters fade to bare pink from the halfway point of the reverses (75.92 s, the start of loop 5) to the very end. My reading of "fade out ascii": the letters go, the real footage is not shown. The fade length (four loops) is mine.
- So at the end: guitar picture gone by 84.36 s, letters gone by 92.8 s, the last voices over nearly bare pink.
- The 2, 1, 4, 3 render finished but was not sent. The next messages replaced it.
- `sketch/love-bombed-render.sh` is the render as run (the joins, both fades, the heads, the sound mix).
- No picture in the repo: the stills show people.

Not yet kept: the 8 s of video 1 before the reverses, the letters fading to nothing rather than to the footage, the fade length.

## Phase 23: two more backgrounds, pink heads, letters fade into the footage

- Sam, two more videos: "The one that is from the back with walking and stuff should go after the second clip, and then the one, the other one, should go after that." Read as after the second clip in the order, so: 2, 4 (the 20 s clip), the close walking clip (IMG_7103, 9.6 s), the street clip (IMG_0532, 7.0 s), 3, then 1 through the reverses. The two arrived in Downloads under old dates; Sam sent a picture of the folder to say which.
- Sam: "go with pink heads again ... everything's fading out to the original footage underneath for that last video, which is dark on the edges, so you will see it." Heads are now the page pink, 70% strength, where they were black. A head with a black mouth over a head made of the footage was talked through and dropped: "just do the pink and we'll see how that works."
- That also changes the letter fade. The letters now fade into the real footage of video 1 (they faded to flat pink before). Same timing, 75.92 s to the end.
- Video 1 now starts at 67.9 s (it was 51.2 s), so it is on screen for the last 25 s.
- Sound is as before. `sketch/love-bombed-render.sh` is the render as run.
- No picture in the repo: the stills show people.

Not yet kept: the order, pink heads, the fade into footage, where the two new clips sit.

## Phase 24: background order 3, 1, 4, 2, 5, 6, and the first pass of 6 backwards

- Sam, after a numbered sheet of v15 (1 IMG_0533, 2 IMG_1226, 3 IMG_7103 close yoga, 4 IMG_0532 walking from behind, 5 IMG_1227, 6 IMG_0242): "314256". So the cut plays IMG_7103, IMG_0533, IMG_0532, IMG_1226, IMG_1227, then IMG_0242. In v15 I had read "the one from the back with walking" as the yoga clip, which was my mistake.
- Sam: "for 6 since it repeats ... the first one ... can we reverse it? ... and then play the repeated one the correct way? Because then the fade will work really nicely." Done: the first pass of 6 (67.9 to 80.7 s) plays backwards, the next three forwards, so the fade into the footage ends on the footage playing the right way.
- Pink heads and the fade into the real footage are as in phase 23.
- The reversed clip is cut in 2 s pieces and put back in reverse order (a whole reverse would not fit in memory). `sketch/love-bombed-render.sh` is the render as run; the second half is built in eight pieces because one big file no longer fits on the disk.
- No picture in the repo: the stills show people.

Not yet kept: the order, the reversed first pass of 6.

## Phase 25: the reverse was the wrong quarter, and the heads change

- Sam: "the reverses seem like the wrong clip, i need the first quarter of the video right sized clipped and then i need that clip reversed, sounds like i got the last quarter." He was right. I checked the sound: the reversed clip matched the last quarter of the bottom-left cut (correlation 1.00), the first quarter only 0.25. The cause: `ffmpeg -t 4.218 -i x -af areverse` limits the output, so it reverses the whole file first and keeps the first 4.2 s of that, which is the last quarter backwards. The limit has to come before `-i`. Every cut from phase 16 to 24 had the wrong quarter, picture and sound. Fixed for both; the sound of the forward part is bit for bit unchanged.
- Sam: "the my loves can repeat 6 times total, would be nice if no four were ever the same four." Read as: the three "my love" phrases are used twice each (6 times in all), and each of the three loops has its own four. Per loop: two "my love" (top left and bottom right) and two chorus (top right and bottom left). Pairs of "my love": loop 6 = first and second, loop 7 = second and third, loop 8 = third and first. Chorus: clips 2, 3 / 4, 7 / 6, 9 (1, 5 and 8 are not used now). Three different fours.
- Pink heads and the fade into the footage as in phase 23. Order 3, 1, 4, 2, 5, 6 with the first pass of 6 backwards as in phase 24.
- Sam, later: "Kill the loop that's playing right now. Just pause it." The loop in the room (ffplay of the bottom-left sound) is stopped.
- `sketch/love-bombed-render.sh` is the render as run. `love-bombed/heads-spec.json` is the new heads plan.
- No picture in the repo: the stills show people.

Not yet kept: the right quarter, the heads plan, which chorus clips.

## Phase 26: forward quarter x4, then reversed quarter x4, loop never fades

- Sam, on v17: "the reverse is freeze for some reason. I don't like that." New plan in his words: "I want to play the first half ... the first half to be those four ... And then four reverses that play ... and then they start to fade out towards the end. I don't want the percussive loop to fade out. I just want the reverses to fade out, and I don't want the video to stop at any point. I just want it to fade out." Read as: the first quarter of bottom-left forward 4 times (59.05 to 75.92 s), then the same quarter reversed 4 times (75.92 to 92.80 s). My reading, check it: "the first half" is the first half of the eight outro loops.
- Fade (picture and the reversed sound together) now starts at the third reverse loop, 80.14 s, and ends at the very end, 92.80 s. Before it was over loops 3 to 6.
- The loop: the room recording has the loop under the guitar, so it faded with it. Now the clean soft loop (`states/2-three-four-soft.flac`) plays from 75.92 s to the end at one level, never faded. Where it sits in the recording: found by comparing the four quarters of the clip with the loop; the clip starts 1.138 s into the loop (a bar and 84 ms). Level 0.4 of the loop's own, which is about 1.4 times what the loop measures inside the recording (0.28). The match is soft (0.37), so the phase and level are worth a listen.
- Freeze: I did not find the reverse picture frozen. The frame-by-frame check shows short still stretches near 67.5 s (10 frames) and 70.6 s (5 frames), where the letters change from the fire video to the last video, and the first frames of that video backwards are a person standing still. That may be what Sam saw. If the reverse still looks frozen, the first quarter itself may hold still.
- The loop is playing in the room again (Sam asked): `love-bombed-bottom-left-loop.wav` on repeat.
- `sketch/love-bombed-render.sh` is the render as run.
- No picture in the repo: the stills show people.

Not yet kept: the plan itself (four and four), the fade from 80.14 s, the loop's phase and level.

## Phase 27: reverses only at the end, Sam's spoken part, and the last "my love" on a bar line

Sam: "nah go straight to the reverses but reverse the whole clip first, then do the quarter reverses until it ends". The end is now the whole bottom-left clip backwards (59.052 to 75.924 s), then the first quarter backwards four times (to 92.796 s). The clean loop stays under it and never fades; the guitar picture and the backwards sound fade from 80.142 s.

Sam's phone video IMG_6649 holds 66.6 s of speech. Cleaned (a hum and room noise taken out, a little tone shaping), and put after the first center-half guitar clip. The guitar sits 4 dB lower while it talks.

Sam: "I'm talking over the loop, so there should be faint traces of that throughout", and "the last word I say is my love, and my love should line up with the my loves in the outro ... bump the rest of the whole clip around a little bit". So: the cleaning is gentler (55 % cleaned, 45 % as recorded, so the loop in the room still comes through faintly). The last "my love" begins about 65.25 s into the speech (read from the loudness, not heard). Started at 8.436 s it would land at 73.686 s; the nearest bar line is 73.815 s (bar 70 of the loop), so the whole speech moved 0.129 s later (starts 8.565 s, ends 75.157 s, before the fade at 80.142 s). The outro my-loves sit on bars 76, 80 and 84.

Not heard by me. The speech's own loop phase was not matched to the cut's loop, only the last word to the bar line.

- `sketch/love-bombed-render.sh` is the render as run.
- No picture in the repo: the stills show people.

Not yet kept: the reverses-only end, the speech and its place, the 0.129 s shift, how much loop shows through the speech.

## Phase 28: four sung "my love" moments

Sam asked how many my loves there are. There were three sung moments (80.142, 84.36, 88.578 s, four heads each) plus the spoken one. Sam: "there should be like four or five. Let's do four."

A fourth was added one loop earlier, at 75.924 s, where the quarter reverses begin and 0.77 s after the speech ends. Its four heads are takes not used anywhere else, plus one lead line: top left clip 1 (0.01 to 1.34 s), top right clip 5 (2.07 to 4.55 s), bottom left clip 8 (1.81 to 4.07 s), bottom right the third lead line. So there are four fours and no two are the same four. The spoken "my love" (73.815 s) now sits two bars before the first sung one.

Not heard by me. Loudness by loop from 75.924 s: 0.160, 0.139, 0.114, 0.092 (the first is the loudest because the backwards guitar has not started to fade yet).

- `heads-spec.json` has the 16 takes. `sketch/love-bombed-render.sh` is the render as run.
- No picture in the repo: the stills show people.

Not yet kept: four moments, the new four's takes and seats, starting them at 75.924 s.

## Phase 29: the voice was doubled (my mistake), "my love" meets the heads, mouth sounds turned down

Sam: "the voice is doubled", "and there's an offset, and i can barely hear the guitar, and there's saliva tongue smacking sounds", and "when i say my love, that's when the my love heads need to start, can we push the voice up to meet it?"

What went wrong in v19 and v20: I mixed the moved speech onto a file that already had the speech in it. So the voice played twice, 0.129 s apart (the "offset"), and the guitar was turned down twice (8 dB, not 4). Checked now by sliding the speech along the finished sound: it is found once.

The last word was also in the wrong place. Phase 27 read it from the loudness at 65.25 s. The speech was put through a speech-to-text model on this machine (whisper, two sizes): "my love" is at 62.1 s. What sounds at 65.25 s comes after the last word, so the speech now stops at 64.2 s.

Now:
- The speech starts at 13.804 s, so "my love" (62.12 s in) lands on 75.924 s, where the first four heads start. That is also a bar line.
- The guitar is 2 dB down under the speech, not 8.
- Mouth sounds: clicks taken out (ffmpeg adeclick), and every space between words is turned down 10.5 dB (word times from the model; a word keeps full level from 0.15 s before to 0.2 s after). Not silence, so the loop in the room is still faintly there. A smack or sniff inside a word is not touched.

Not heard by me.

- `sketch/love-bombed-speech-clean.py` is the spaces-down step. `sketch/love-bombed-render.sh` is the render as run.
- No picture in the repo: the stills show people.

Not yet kept: the speech's place, the guitar level under it, how far the spaces are turned down, stopping at 64.2 s.

## Phase 30: new guitar order, sound first

Sam: "adventure line gets turned down for some reason, the guitar clips aren't working. we need to do that first clip 4 times, the half bottom left clip, the full center clip, the full top right clip, then the reverses (however many are left) let me know what words the changes ends on, please cut audio first to listen". And: "also not hearing cross fades".

Sound only this turn (`love-bombed-v22-sound.m4a`, not in git). No video yet: Sam listens first.

- The adventure line: the smaller speech-to-text model never heard "10 years of adventure", so phase 29 took that line for a space and turned it down. Now a word found by either of two models is kept.
- Order: center half x4 (to 33.744 s), bottom-left half (to 42.18), center whole (to 59.052), top-right (to 67.488; that clip is 8.436 s long, there is no longer one), then the first quarter of bottom-left backwards, six times, to the end (92.796 s). The clean loop comes in with the backwards part at 67.488 s.
- Crossfades: there were none before, the clips were butted. Now each forward change is a crossfade one beat long (351.5 ms) that ends on the bar line, so the new clip's first note is whole. The backwards quarters still butt.
- "my love": phase 29 put the sound at 62.12 s on the heads. That is a breath or a smack. The word "my" starts at 62.62 s (where the voice has pitch). So the speech starts at 13.304 s and "my" lands on 75.924 s with the first heads.
- The guitar is 2 dB down under the speech; the loop is no longer turned down with it.

The word at each change (speech-to-text times, not heard by me): 16.872 s during "of" (birthdays, of | Libra season); 25.308 s after "matter,"; 33.744 s during "of" (the light of | the sunrise); 42.18 s during "not" (adventure, not | one resembling); 59.052 s during "is" (which is | good); 67.488 s after "live,"; 75.924 s after "you," and before "my love".

- `sketch/love-bombed-sound.py` builds the whole sound from its pieces. `sketch/love-bombed-speech-clean.py` takes several transcripts.
- No picture: sound only.

Not yet kept: the order, six backwards quarters, the crossfade length, the speech's place.

## Phase 31: the second guitar was in the speech; quick fades; new order again

Sam: "I think the flow works better, but ... I feel like I'm hearing two overlapping guitar tracks at the beginning. Or the first half". "the my loves can be a little bit lower." "It might be the crossfades ... It could even be just like a quick little ... duck. Where you like quickly round the end and beginning of the loops." And: "switch the half bottom left clip with the whole center. And actually the half bottom left should be the full bottom left. And then the top right. And then the reverses."

The second guitar: the loop playing in the room while Sam spoke was the bottom-left guitar loop (I was playing it on the computer). It is in the speech recording, starting 4.16 s in and every 16.8723 s after, 17 dB under the speech. In the cut it sat 74 ms off the beat and more than a beat off the bar, against a different clip. Phase 27 kept 45 % of it on purpose ("faint traces"), reading "the loop" as the mouth loop.

- It is taken out of the speech now: the loop file is laid where it was heard, shaped the way the room shaped it, and subtracted; what is left is pushed down as noise. In the quiet parts it is 11.4 dB lower than recorded (3.7 dB from the subtraction alone; the room's echo is longer than the subtraction sees). Then the spaces between words go down 10.5 dB as before. Traces will remain.
- No crossfades. Every clip's start and end are rounded to silence (8 ms in, 30 ms out), the backwards quarters too.
- Order: center half x4 (to 33.744 s), center whole (to 50.616), bottom-left whole (to 67.488), top-right (to 75.924), then the first quarter of bottom-left backwards x4 to the end. The backwards part, the clean loop, the first heads and "my" all start at 75.924 s.
- The heads' voices are 3 dB down.

The word at each change (speech-to-text times, not heard by me): 16.872 s during "of" (birthdays, of | Libra season); 25.308 s after "matter,"; 33.744 s during "of" (the light of | the sunrise); 50.616 s during "more" (more generous, more | comfortable); 67.488 s after "live,"; 75.924 s after "you," and before "my love".

Sound only again (`love-bombed-v23-sound.m4a`, not in git). The guitar loop is still playing on the computer.

- `sketch/love-bombed-speech-cancel.py` takes a known loop out of a recording. `sketch/loop-phase.py` finds where in the loop a recording starts. `sketch/love-bombed-sound.py` is the sound as built.
- No picture: sound only.

Not yet kept: the order, the quick fades and their lengths, the heads' level, how much of the room's guitar is left.

## Phase 32: the beat stops at the last my love, the voice memo closes it, a crossfade into the backwards part

Sam: "kill the beat on the last my love. You should take that voice note that I sent, line it up to the beat, and have it so that it is the last thing that plays. ... walk it back from the ending. It's like some extra percussive sounds. It'll probably fit in well at the my [loves]. [Then] we need like a little bit more crossfade or something before the reverses start because it's a little harsh there and also the my loves need to come down in volume again."

- The clean loop stops at 88.578 s, where the last four heads start.
- The voice memo (39.2 s; kept in the source folder as `love-bombed-percussion-voice-memo.m4a`, not in git) was recorded over the mouth loop: folded at the loop's length it matches the loop well (r 0.73) and starts 1.21 s into it. Placed at 54.904 s its loop sits on the cut's loop. It is let in at 75.924 s with the first heads (half a second of fade), 3.5 times louder than recorded (it is quiet), and runs to its own end at 91.65 s. That is the last thing heard; the last 1.1 s is the backwards guitar's tail, nearly silent.
- Into the backwards part: the last beat (351.5 ms) of top-right fades out while the backwards quarter's own last beat fades in. The other changes keep their quick dips.
- The heads' voices: 6 dB down now (3 more).

Not heard by me. Sound only again (`love-bombed-v24-sound.m4a`, not in git).

Not decided: the memo's first 21 s are left out because they would fall under the speech. Placing it one bar later would end it at 92.7 s, right at the end, but then its loop is a bar off the cut's.

- `sketch/love-bombed-sound.py` is the sound as built.
- No picture: sound only.

Not yet kept: where the beat stops, the memo's place and level, the crossfade, the heads' level.

## Phase 33: the sound is kept; the whole voice memo, in at half and rising

Sam on the phase 32 sound: "yeah that sounds [...] great". Kept: the order (center half x4, center whole, bottom-left whole, top-right, four backwards quarters), the quick dips, the crossfade into the backwards part, the beat stopping at the last my love, the heads 6 dB down, the speech with "my" on the first heads, the voice memo closing it.

Then, about the voice memo: "that last voice memo that got added should start 69% volume and fade in till end", "and i want it all in", "maybe start at 50% and fade in". So the whole memo plays, from 54.904 s (where its loop sits on the cut's loop) to its end at 91.65 s, starting at half level and rising in a straight line to full at its end. Its first 21 s now sit under the end of the speech.

Sam also: "i think it should snap to black at the end". That is for the video, rendering now: black from 91.65 s, where the last sound stops, to the end.

Not heard by me. Sound: `love-bombed-v25-sound.m4a` (not in git).

- `sketch/love-bombed-sound.py` is the sound as built.
- No picture yet: the video is rendering.

Not yet kept: the memo whole and its rise from half; the snap to black and where it falls.

## Phase 34: the video for the kept sound, and the snap to black

The picture now follows the sound: center half x4, center whole, bottom-left whole, top-right (to 75.924 s), then the first quarter of bottom-left backwards four times. Heads, letters and fades as before; the heads' voices come from the sound build, 6 dB down. Sam: "i think it should snap to black at the end": black from 91.65 s, where the last sound stops, to 92.8 s.

"The reverse is freeze" (Sam, before phase 26) is explained. The duotone step runs on to the end of the letters video with the clip's last frame held, so a piece that was 8.4 s of picture came out 17 s long, half of it still. The joins did not cut the pieces to length. They do now; the joined picture is 92.84 s and 5,575 frames, and seven frames sampled across the backwards part all differ.

Checked by eye on eight frames (20, 40, 60, 72, 78, 86, 91.5, 92 s): picture changes at each, footage shows through by 91.5 s, black at 92 s. Not watched through, not heard.

- `love-bombed-v25.mp4` and `-720.mp4` (not in git). `sketch/love-bombed-render.sh` is the render as run.
- No picture in the repo: the stills show people.

Not yet kept: the video as a whole, the snap to black and where it falls.

## Phase 35: the sung my loves three beats later, in from black

Sam on v25: "It's close, but right before the reverse [the] my loves are starting too soon, i think they need to be either two or three beats later ... I think it's probably actually three beats forward would be the right place for it to go. Let's try that." And: "it should fade in from black" at the beginning, "for the first clip".

- All four sung moments move three beats (one bar, 1.0545 s) later: 76.9785, 81.1965, 85.4145, 89.6325 s. The backwards part still starts at 75.924 s, and the spoken "my" stays there, so the spoken "my love" now comes first and the heads answer it.
- The beat follows the last my love: the clean loop stops at 89.6325 s.
- The last sung phrase now ends at 92.63 s, so the cut is one bar longer (93.85 s) to leave room for the black. Black from 92.70 s.
- In from black: the picture fades in over the first 4.218 s (half of the first clip). The sound does not fade. The length is my pick.

Not heard by me. Sound: `love-bombed-v26-sound.m4a` (not in git). The video is rendering.

- `heads-spec.json` has the new times. `sketch/love-bombed-sound.py` is the sound as built.
- No picture yet: the video is rendering.

Not yet kept: three beats later, the longer cut, the fade from black and its length.

## Phase 36: no voice memo before the backwards part; the video

Sam: "I take it back ... that voice memo that we put in last. I shouldn't hear shit before the reverses, so clip it so it starts at the reverses. Start it at 50% and have it fade in."

The voice memo is silent until the backwards part starts (75.924 s). It comes in there at half level and rises in a straight line to full at its own end (91.65 s). It is still placed so its loop sits on the cut's loop. Against the phase 35 sound, nothing differs outside 54.96 to 91.03 s.

The video (v27) has this sound and the phase 35 changes: sung my loves three beats later, in from black over 4.218 s, black from 92.70 s, 93.85 s long. Checked by eye on nine frames (0.5, 2, 5, 76.5, 77.5, 82, 90, 92.5, 93.2 s): dark, half, full at the start; heads in the corners after the backwards part begins; heads still up at 92.5 s; black at 93.2 s. Not watched through, not heard.

- `love-bombed-v27.mp4`, `-720.mp4` and `love-bombed-v27-sound.m4a` (not in git). `sketch/love-bombed-sound.py` and `sketch/love-bombed-render.sh` are as run.
- No picture in the repo: the stills show people.

Not yet kept: the memo from the backwards part only; three beats later; the fade from black; the black at the end.

## Phase 37: a beat before "with you"

Sam: "And add a beat in front of with you. And let the my love move a beat forward too."

One beat (351.5 ms) of the room's own sound is put into the speech in the space before "with you" (the space from 60.18 s is played twice, 15 ms dips at the joins). So "with you" and "my love" both come one beat later: the spoken "my" now lands at 76.28 s, one beat after the backwards part starts and two beats before the first sung my love (76.98 s). Nothing else moved.

The picture is the same as phase 36; the new sound was swapped in (v28). v27 was not sent and is removed. Not heard by me.

- `love-bombed-v28.mp4`, `-720.mp4`, `-sound.m4a` (not in git). `sketch/add-a-beat.py` puts the beat in.
- No picture in the repo: the stills show people.

Not yet kept: the beat before "with you".

## Phase 38: four beats before "with you", a black first clip, and a title to place

Sam: "did the with you [get] moved?" It had, by one beat (measured in the v28 file: "with you" 73.97 to 74.32 s, "my love" 75.91 to 76.26 s). Then: "i meant four beats moved then". So the space before "with you" is now four beats longer than recorded (1.406 s; the same piece of room sound played four more times). "with you" comes at 75.37 s and the spoken "my" at 77.31 s, one beat after the first sung my love starts (76.98 s). The sung ones were not moved.

Sam: "and i think the first clip should just be black", "no fade, snap". The picture is black for the whole first clip (to 8.436 s), then snaps in on the bar line. The fade from black of phase 35 is gone. Rendered once (not sent), then:

Sam: "10 trips / around / the sun", "in the [Poiret One font] from d-ana.com", "[show] me some placements on that black square we're starting with". The words go on the black opening in Poiret One, the title face of d-ana.com (its font file, read from that site's build; nothing changed there). Pink, lowercase as typed. Six placements to pick from:

![the title in six places on the black opening: middle large, middle small, low left, top left small, low right, low middle small](/assets/love-bombed/title-placements.webp)

The video waits for the pick. Sound with the four beats: `love-bombed-v29-sound.m4a` (not in git). Not heard by me.

- `sketch/love-bombed-title.py` makes the card and the sheet. `sketch/love-bombed-sound.py` is the sound as built.

Not decided: which placement; how long the title stays (planned: the whole black first clip); the colour. Not yet kept: four beats, the black first clip.

## Phase 39: the title bigger, in the middle, evenly spaced

Sam on the six placements: "bigger center, evenly spaced vertically?"

Three more, all in the middle and bigger (240 against 150), each line sitting by the body of its letters so the three gaps are even: 7 close together, 8 a quarter of the height apart, 9 a third of the height apart (top, middle, bottom).

![the title bigger and centred three ways: lines close, a quarter of the height apart, a third apart](/assets/love-bombed/title-placements-big.webp)

"Evenly spaced vertically" could mean even gaps in a block (7) or spread evenly down the frame (8, 9). The video still waits for the pick.

- `sketch/love-bombed-title.py` has places 7 to 9.

Not decided: which of these.

## Phase 40: the spoken my love on the first sung one

Sam on the four-beat sound: "the spoken my love needs to happen a beat or two [sooner] to line up w the chorus".

With four beats before "with you" the spoken "my" came one beat after the first sung my love. Three beats puts it exactly on it: measured in the built sound, the spoken "my love" starts at 76.978 s and the first sung one at 76.9785 s. "with you" starts at 75.02 s. So the speech's last two words moved as far as the sung my loves did in phase 35 (three beats, one bar).

Not heard by me. Sound: `love-bombed-v30-sound.m4a` (not in git). The video still waits for the title pick.

- `sketch/love-bombed-sound.py` is the sound as built (the speech with three beats added by `sketch/add-a-beat.py`, run three times).
- No picture: sound only.

Not yet kept: three beats before "with you".

## Phase 41: heads along the bottom; the spoken my love one beat sooner, to try

Sam: "all the pink heads should go on the bottom (not the corners". The four heads of each moment now sit in one row along the bottom (y 1824), evenly spaced: x 79, 386, 694, 1001. The two lead lines keep the outside seats, the chorus the two in the middle. `heads-spec.json` has the seats. The video is rendering with this, the phase 40 sound, and title placement 8 (Sam had not picked; 8 is my pick to show it moving).

Sam, after the phase 40 sound: "push it forward one beat". Read as the spoken my love, and as sooner: one beat later would be the phase 38 sound, which Sam turned down ("a beat or two sooner"). So a version with two beats before "with you": the spoken "my love" starts at 76.63 s, one beat before the first sung one. Sent as `love-bombed-v31-sound.m4a` (not in git) to try; the kept script still builds the phase 40 sound until Sam says. Earlier Sam used "forward" for later, so this reading may be wrong.

Not heard by me.

- No picture yet: the video is rendering, and its stills show people.

Not decided: two beats or three before "with you". Not yet kept: heads along the bottom.

## Phase 42: the title on one line at the bottom, to see

Sam: "put the sentence in one line on the bottom placement (let's see)".

"10 trips around the sun" on one line, as wide as the frame allows with 90 px clear each side: 10 low (where the small low title sat), 11 lowest (on the row where the heads sit later). 8 is beside them for scale; it is the one in the video rendering now.

![the title on one line, low and lowest, beside the big three-line one](/assets/love-bombed/title-one-line.webp)

- `sketch/love-bombed-title.py` has places 10 and 11.

Not decided: which title.

## Phase 43: "our trips around the sun"

Sam: "maybe our trips around the sun be better." The title's words change from "10 trips around the sun" to "our trips around the sun". Same three placements as phase 42 to look at:

![our trips around the sun: one line low, one line lowest, three big lines](/assets/love-bombed/title-our-trips.webp)

The video rendering now still says "10 trips" (placement 8); the next render takes the words and the placement Sam picks.

- `sketch/love-bombed-title.py` has the new words.

Not decided: the words (10 or our), which placement.

## Phase 44: "around the sun", with a dot between, filling the screen

Sam: "Just do around the sun. If we could do around the sun with the little dot delineator and fill the whole screen thing with it, that'd be cool."

The words are now just "around the sun", repeated with a middle dot between, row after row over the whole black frame, running off both sides. Each row starts a bit further along than the one above so the words do not stack in columns. Three sizes:

![around the sun with dots filling the frame: small, medium, large](/assets/love-bombed/title-fill.webp)

- `sketch/love-bombed-title.py` has places 12 to 14.

Not decided: which size; still or moving (it could drift sideways over the first clip).

## Phase 45: the title small with more dots, the voice memo up from nothing, heads along the bottom checked

Sam on the three fill sizes (12, 13, 14): "size 10". Read as two steps smaller than 12: letters 28 px high settings (12 was 64).

![around the sun filling the frame at the smaller size](/assets/love-bombed/title-fill-size-10.webp)

Sam: "for each line, let's add an extra one of the dot delineators. Like ... one in between for the first line, two right next to each other for the second line, etc." and "Let's also try random amount between 1 and 10." Left: one more dot each row down (about 40 by the bottom). Right: 1 to 10 dots, picked once per row.

![left: one more dot per row; right: 1 to 10 dots per row at random](/assets/love-bombed/title-fill-dots.webp)

Sam: "the voice memo that we had at the end, can we fade it up from zero as a starting point instead? There's like a sound that just is coming out too loud ... start at zero when the reverses are there, and then fade up to 100 by the last, my love". The memo now starts silent at 75.924 s, rises in a straight line to full at 89.6325 s (the last sung my love), and stays full to its end.

The sound script now builds with two beats before "with you" (phase 41's version to try): Sam went on from it without asking for it to move again. Not confirmed in words.

Heads along the bottom: the render started in phase 41 finished; two frames (77.5 and 82 s) show four heads in a row at the bottom, none in the top corners. That render had the old title and sound and was not sent.

The video is now built in two parts so a title change does not mean a whole new render: the body (black for the first clip) is rendering; the title is laid on the first 8.4 s after.

Not heard by me. Sound: `love-bombed-v32-sound.m4a` (not in git).

- `sketch/love-bombed-title.py` (fill28, fill28+, fill28?), `sketch/love-bombed-sound.py`.
- The heads' stills are not in the repo: they show people.

Not decided: which dots (one, growing, random). Not yet kept: the memo's rise, two beats before "with you", heads along the bottom.

## Phase 46: the growing dots, a little bigger, and with noise

Sam on the two dot versions: "first one is wayyyy cooler, can we try to slightly increase size too ? can we also try to apply noise to the amount of delineators".

The growing dots it is (one more per row going down). Size up from 28 to 36. Left: as it was, bigger. Right: the same with noise on the count, each row's number of dots moved up or down by up to 40 % (picked once, the same every time).

![growing dots at the bigger size: left plain, right with noise on how many](/assets/love-bombed/title-fill-bigger-noise.webp)

- `sketch/love-bombed-title.py`: fill36+ and fill36~.

Not decided: plain or noisy; the size.

## Phase 47: one "around the sun" says "happy birthday"

Sam: "and replace one around the sun with happy birthday".

One of them, the whole one nearest the middle and a little above it, now reads "happy birthday". Same colour and size, sat in the same slot so nothing around it moves. Made for both the plain and the noisy dots.

![a strip of the title with one "happy birthday" among the "around the sun"](/assets/love-bombed/title-happy-birthday.webp)

- `sketch/love-bombed-title.py` takes the other words as a last argument.

Not decided: plain or noisy dots; which one is replaced (it could sit anywhere).

## Phase 48: plain dots; the size scaled

Sam: "plain, and can we also try scale size a bit?"

Plain growing dots it is (no noise). "Scale size" read two ways, both made, each with the one "happy birthday":

![left: as picked, 36. middle: letters growing down the frame, 30 at the top to 46 at the bottom. right: all a step bigger, 42](/assets/love-bombed/title-sizes.webp)

- Middle: the letters grow with the dots, from 30 at the top row to 46 at the bottom row.
- Right: everything one step bigger (42).

- `sketch/love-bombed-title.py`: fill30-46+ and fill42+.

Kept: plain dots (no noise). Not decided: which size.

## Phase 49: the title starts smaller

Sam on the letters that grow down the frame: "can we start smaller?"

So the growing one is the one. The top row now starts smaller and ends where it did (46): left from 18, right from 12. More rows fit, so there are more dots by the bottom.

![letters growing down the frame: left from 18 at the top, right from 12](/assets/love-bombed/title-start-smaller.webp)

- `sketch/love-bombed-title.py`: fill18-46+ and fill12-46+.

Kept: letters growing down the frame. Not decided: where it starts.

## Phase 50: one more dot for each phrase along the row

Sam: "can we also add an extra delineator for the number phrase it is in the row?"

Along a row the dots now grow too: after the first phrase the row's own number of dots, after the second one more, after the third two more. Counted from the first phrase drawn, which starts off the left edge. Made on both start sizes from phase 49 (left from 18, right from 12).

![the title with dots growing down the frame and along each row](/assets/love-bombed/title-dots-along-row.webp)

It is a small change to the eye: one dot is narrow, and a row only holds two to nine phrases.

- `sketch/love-bombed-title.py`: fill18-46* and fill12-46*.

Not decided: start size (18 or 12); whether one dot per phrase is enough to see.

## Phase 51: three, then seven more dots per phrase; the video with the title on it

Sam on one more dot per phrase: "[make it] an extra 3", then "extra 7 delineators per phrase". Along a row each gap now has seven more dots than the one before it, so a row opens out to the right. Left from 18 at the top, right from 12.

![the title with seven more dots after each next phrase along a row](/assets/love-bombed/title-seven-per-phrase.webp)

The video (v33) has the left one on the black first clip (Sam has not picked a start size; 18 is my pick to show it moving), then the picture snaps in at 8.43 s. With it: heads in a row along the bottom, the phase 45 sound (voice memo up from nothing, two beats before "with you"), black from 92.70 s.

How it is built now: the body was rendered once with a keyframe where the picture snaps in; the title card is encoded alone (253 frames) and joined in front without touching the body. A new title takes under a minute.

Checked by eye on eight frames (4, 8.38, 8.47, 30, 77.6, 85, 92.5, 93.2 s): title, title, picture, picture, four heads along the bottom, heads, footage with a head, black. Not watched through, not heard.

- `love-bombed-v33.mp4`, `-720.mp4` (not in git). `sketch/love-bombed-title-join.sh`, `sketch/love-bombed-render.sh`, `sketch/love-bombed-title.py` (PER = 7).
- The video's stills are not in the repo: they show people.

Not decided: start size 18 or 12; still or drifting title. Not yet kept: seven per phrase, the video as a whole.

## Phase 52: three more dots per phrase is the one

Sam on seven: "an extra 3 was better". Back to three more dots after each next phrase along a row (the still is the same file as the one made before seven, checked byte for byte; it was sent then but not put in the repo, so it is added now).

The video is v34: the same body and sound as v33 with the three-dot title joined on. v33 is removed. Checked by eye on two frames (4 and 8.47 s): the title, then the picture. Not watched through, not heard.

![the title as kept: growing letters and dots, three more dots after each next phrase, one happy birthday](/assets/love-bombed/title-three-per-phrase.webp)

- `love-bombed-v34.mp4`, `-720.mp4` (not in git). `sketch/love-bombed-title.py` has PER = 3.
- The video's stills are not in the repo: they show people.

Kept: three more dots per phrase. Not decided: start size 18 or 12 (the video has 18).

## Phase 53: the title smaller, with a thick black edge all round

Sam: "the title thing needs to be [scaled down] to start and be smaller like have a thick equal padding of maybe 13% width".

The title no longer runs to the edges of the frame. There is black all round, 13 % of the width (140 px) on every side, top and bottom the same as left and right. The words are smaller by the same share (letters 13 at the top to 34 at the bottom, were 18 to 46) and are cut off at the edge of the space that is left.

![the title inside a black edge of 13 % of the width on every side](/assets/love-bombed/title-padded.webp)

The rows at the very top and bottom are cut through by that edge, as the ones at the sides are.

The video is v35: same body and sound, this title joined on. v34 is removed. Not watched, not heard.

- `love-bombed-v35.mp4`, `-720.mp4` (not in git). `sketch/love-bombed-title.py` takes the padding as a last number.

Not decided: whether rows should be cut at the top and bottom or kept whole. Not yet kept: the padding.

## Phase 54: title rows whole and fading; a switchover that is off the beat

Sam on the padded title: "I would like it if the bottom row ... does not get cut off at the words, or the top row doesn't get cut off the words, the sides is fine ... 100 opacity to zero opacity by the bottom might also just fix it and make it look sick."

- No row is cut through at the top or bottom now: only whole rows are drawn, and the spare room is shared above and below. The sides still cut words.
- The rows fade: full strength at the top, nothing at the bottom. So the letters get bigger as they get fainter.

![the title with whole rows, fading from full at the top to nothing at the bottom](/assets/love-bombed/title-whole-rows-fading.webp)

The video with it is v36 (same body and sound; v35 removed). Not watched, not heard.

Then Sam, quoting the speech ("had 10 years to realize ... how lucky I am to push for the next 100 with you"): "Not the clip that we're ending on ... with the ASCII, where it's like the fading to normal. Let's leave that clip as it is exactly where it is ... it might be cool if we reverse the clip before it and then cut that clip. By the time it gets to the clip that we're ending on." Then: "or leave both clips exactly as they are. The problem is that the switchover happens like off beat. So it would be better if that happens like one measure in or something and you just like crossfade it but you'd like do the reverse of the other one because it's a nice mellow shot that it ends on."

My first reading was wrong: I took "clips" for the guitar clips and began playing top-right backwards (sound and picture). Stopped and undone; nothing of it was sent as video (a sound file was built and removed).

The reading now: the letters backgrounds. Under those words the background changes from the beach clip to the night street clip (the one that fades to normal) at 67.93 s, which is 0.44 s after the guitar changes and on no bar line. So, rendering now:
- The night street clip is not moved at all.
- The beach clip plays backwards, so it ends on its first shot.
- The change is a crossfade one beat long ending on the bar line one measure into the top-right guitar clip (68.5425 s). To reach it the beach clip runs 3.5 % slow.

- `sketch/love-bombed-title.py` (whole rows and the fade come with the padding).
- The backgrounds' stills are not in the repo: they show people.

Not decided: whether that reading is right; the crossfade's length and place. Not yet kept: whole rows, the fade.

## Phase 55: the title fades corner to corner

Sam: "for title sequence, maybe top left is 100% opacity, down to bottom right, zero opacity."

The fade now runs on the diagonal: full strength at the top left corner of the title, nothing at the bottom right. Laid over the finished card, so it is smooth across a row and not row by row.

![the title fading from the top left corner to the bottom right](/assets/love-bombed/title-fade-diagonal.webp)

It goes on the video when the body with the new background switchover (phase 54) has finished rendering.

- `sketch/love-bombed-title.py`: last argument diag (the default) or down.

Not decided: diagonal or straight down.

## Phase 56: the last background clip fades in; the title fades to black

Sam: "I feel like it should be there and then fade to black as soon as it pops. The title sequence." And about the background: "There's technically nothing wrong. I think what I need is that last clip that plays in reverse and then plays normally ... in the background. That fades out of the ASCII ... The clip itself needs to fade in over the course of like a couple measures ... be fully faded in by the time it hits the reverses. We don't need to change the ordering of anything". Then: "the switch between ... the beachy [one] ... as soon as the top right guitar comes in ... it's a bit awkward, it almost seems like a glitch ... We can try and see what the fade thing that I said looks like. If not, we can go right back to the other one. Because that one's good."

So phase 54's plan (beach clip backwards in its own place, crossfade at 68.54 s) was the wrong reading and was stopped before it finished. Nothing is moved or reordered. What is new:

- The last letters clip (the night street) no longer cuts in at 67.93 s. It fades in over two measures, 73.815 to 75.924 s, and is fully there when the backwards part starts. Until then the beach clip carries on: at 67.93 s, where it used to end, it turns and plays back the way it came, so there is no jump.
- The title is on the first frame and fades to black over the whole first clip (8.43 s). The picture still snaps in after.
- The title has the corner-to-corner fade from phase 55.

The video is v37. v36 (hard cut at 67.93 s, title held) is kept beside it to go back to. Checked by eye on twelve frames: the title dimming at 0.1, 2 and 4 s, black at 8.2 s, the picture at 8.5 s, the two backgrounds mixing at 73.9 and 74.9 s, four heads along the bottom at 78 s, black at 93.2 s. Not watched through, not heard.

- `love-bombed-v37.mp4`, `-720.mp4` (not in git). `sketch/love-bombed-render.sh` and `sketch/love-bombed-title-join.sh` as run.
- The video's stills are not in the repo: they show people.

Not decided: this or v36; two measures or longer; how fast the title goes. Not yet kept: any of it.

## Phase 57: I broke the ending in v37; a snap, not a fade; the ending checked against v36

Sam on v37: "I think that works pretty well, but I just need it to be a snap, not a fade. Like the exact point where it snaps back to the next clip is when it should switch", "like the guitar, like do it to the beat." Then: "Wait, no, the ending is fucked up ... Why'd you change the ending? The ending was perfect ... it's doing a thing where it freezes on the [...] frame now ... We were just trying to fix that one transition ... The ending should not change at all."

What I did wrong in v37: to change one background switch I rebuilt the whole letters reel by laying the beach clip over it, and told the step to stop at the shorter of the two. The laid-over clip ended at 85.57 s, so the reel did too, and the render held the reel's last frame from there to the end. I checked twelve frames of v37 and none of them showed it, because a held frame looks fine as a still. v37 is removed.

A second fault found on the way: the top-right piece came out 0.07 s short (the step stopped at the end of that clip's sound), so everything after it sat a frame early. Fixed by taking the sound off that piece first and counting frames at the join: the backwards part starts on frame 4,555, as in v36.

Now (v38):
- The last letters clip snaps in at 75.924 s, the same frame the guitar picture snaps to the backwards part. No fade.
- From 67.93 s, where the beach clip used to end, it carries on to that snap by playing back the way it came.
- Nothing else is touched. The reel is the old reel before 67.93 s and from 75.924 s on.

Checked against v36, which Sam called perfect at the end:
- Full-size files, same moments: 60 to 64 s identical; 80 to 84 s and 88 to 92 s differ only by re-encoding (PSNR 38.8 and 40.1 dB; the changed stretch, 69 to 75 s, is 21 dB).
- Three pairs of frames side by side (80.5, 86, 91 s): same picture, same pose, same heads.
- Around the snap (67.5, 68.3, 72, 75.8, 75.95, 76.3 s): beach letters until 75.8 s, night street with the backwards guitar at 75.95 s.
Not watched through, not heard.

- `love-bombed-v38.mp4`, `-720.mp4` (not in git). `sketch/love-bombed-render.sh` as run.
- The stills are not in the repo: they show people.

Lesson for the next change: a change to one stretch gets checked by comparing the whole of the rest against the last good version, not by looking at stills.

Not decided: this or v36. Not yet kept: the snap; the title fading to black.

## Phase 58: the speech written along the bottom; "my love" between the heads

Sam on v38: "okay i think we're good 👍 can we get a render that adds transcription, make sure to have it accurate, feel free to use openai whisper through som". Then: "should be able to fit perfectly on the bottom in the same font as title page", and "the my love can go in center of heads, just move middle two out to the sides a bit more".

The words. Four listens, compared:
- whisper `small` and `large-v3-turbo` on this computer, on the cleaned speech.
- OpenAI through SOM (`/api/transcribe`, which keeps nothing), once on the cleaned speech and once on the recording as it came off the phone.
They agree everywhere but two places, and the phone recording settles both: "10 years of mornings **that** start with your blue eyes" (the cleaned sound loses the "that" and three of four heard "I start" or "let's start"), and "more comfortable in your skin **and** who you are" (one heard "in"). All four hear "golden hair that catches **up**". That is the one I would ask Sam about: "catches it" would also make sense. Left as heard.

How it is written: `love-bombed/captions.txt`, one line per caption, 31 lines. Lowercase like the title, "Libra" keeps its capital, numbers as figures ("10 years", "the next 100"), no commas or full stops.

When each line shows: from whisper's word times on the final speech sound (`love-bombed/speech-words.json`). Whisper stretches the first word of a sentence back into the silence before it (it had "Ten" starting 0.4 s early), so each line's start is found in the sound itself: back from the end of its first word to where the voice was last quiet. Check: the spoken "my" comes out at 76.639 s; phase 39 had it at 76.63 s by ear and loudness. A line stays until the next one, or half a second past its last word when the pause is long. Lines snap on and off.

Where: the bottom 240 rows of the page are dark for the whole speech (measured: under 1% of pixels bright from row 1680 down), so the lines sit there on the heads' own row (y 1824), in the heads' pink, in Poiret One at 57 px. The widest line is 798 px, inside the same 13% padding as the title. "i still don't know" is said in half a second, so it shares a line with "what that means".

"my love": the two middle heads moved out, from 386 and 694 to 340 and 740, which leaves 250 px between them. The words sit there. They come on with the spoken "my love" and again with each group of heads, fading as the heads do. The sung voices are the same file as before, byte for byte.

How it is drawn: the heads layer is already one grey picture where black means "paint pink here", so the words go into the same layer (`sketch/heads-layer.py` now takes captions from the spec and a font). The render recipe is unchanged but for the layer's name. The font file is d-ana.com's own Poiret One, not in this repo.

Picture: ![three lines in the bottom band](/assets/love-bombed/captions-band.webp)
Only the band is shown; the frames above it show people.

Checked against v38, everything above the bottom band, the whole length:
- 0 to 8.4 s (title): identical.
- 76 s to the end: 39.6 dB on average, worst frame 36.0 dB. That is one more encode and nothing else. The ending is v38's.
- 8.5 to 76 s: the same, except twenty frames from 67.43 to 68.07 s at 14 dB.

That stretch is a fault in v38, found by this check. In v38 the guitar picture goes to the top-right clip at 68.1 s, 0.6 s after its sound does (67.488 s). In v36 and in this render it goes on time. Same inputs, same command, different result: the guitar picture reel is four pieces joined by copying, each cut in the middle of a group of frames, and the decoder has to patch the damaged frames at each join. How it patches them is not the same from run to run. This render still has seven slightly-off frames there (67.57 to 67.77 s, 25 to 30 dB against the reel). Not fixed yet. The fix is to hand the four pieces to the render whole and let it count frames (4,049, 506, 506, the rest), with no copied join at all; it goes into the next render.

- `love-bombed-v39.mp4`, `-720.mp4` (not in git). Not watched through, not heard.
- `sketch/love-bombed-captions.py` (new), `sketch/heads-layer.py`, `sketch/love-bombed-render.sh`, `love-bombed/heads-spec.json` (seats, captions), `love-bombed/captions.txt`, `love-bombed/speech-words.json`.

Next, from Sam: "I just sent another video in place of the other voice recording because I think this one sounds better. There's more roundness to my voice. It's less harsh, less background noise ... Let's get a render with that one instead." No new video has reached this computer yet (nothing newer than the two speech takes from the evening of the 12th). Waiting on it.

Not decided: "catches up" or "catches it". Lowercase "i". Whether the sung "my love" should be written at all four times or only the spoken one.

## Phase 59: the other take of the speech, fitted to the old one's places; captions from Sam's script; the freeze at 67 s found and fixed

Sam: "I just sent another video in place of the other voice recording because I think this one sounds better. There's more roundness to my voice. It's less harsh, less background noise. Take a listen. Um, see if I'm right. I'm pretty sure waveforms should match up pretty close. You might just have to move things around ... Let's get a render with that one instead." The video is IMG_6648, the take recorded two minutes before the one in the cut (IMG_6649). It was already on the computer; I looked for something newer and told Sam it had not arrived. It had.

Then, as I worked: a photo of the script ("that's what i read"), "make sure to break left to live to new line", "catch it (not catch up)", "make sure the with you and my love in new voice line up perfectly, make sure to de ess and scope out as much background noise hum as you can", "the structure of old voice is basically perfect", "a tiny wiggle room is fine as [long] as they basically match the same beats".

**Is Sam right about the take.** Partly, and the bigger part was my doing. The two recordings as they came off the phone:
- Background: in the new take the voice sits 1.3 dB further above the room. A little less background, yes.
- Tone: a little more body (400 to 1,000 Hz, +1 dB), but also 2.5 dB more at 2,500 to 5,000 Hz, which is the harsh band. Raw against raw, the new take is brighter, not softer.
- The voice in the cut was thinner and brighter than either recording: taking the room's guitar out of the first take cost about 4 dB of the low body (60 to 150 Hz), and my tone step then added 2 to 3 dB of presence. That is most of the harshness.

**The new voice, step by step**
- The guitar loop was playing in the room for this take too: it starts 2.07 s before the recording and comes round every 16.8722 s (found by sliding the loop along the recording; the same search gives 4.159 s for the old take, which is what was used for it). Taken out the same way: 11.8 dB quieter in the quiet parts.
- Tone, this time kept round: +3 dB at 140 Hz, -2.5 dB at 3,500 Hz (the old chain did the opposite at the top).
- Between words: down 24 dB (was 10.5). The mask now follows where each word really starts; whisper's own times covered the pauses (95% of the take counted as "words", so nothing was turned down).
- De-ess: the loudest s sounds come down 5.5 dB against the old voice. The setting is touchy: a little less does nothing, a little more takes 11 dB and dulls everything.
- Hum: none found. Nothing stands out at 60 Hz or its multiples (3 dB at 60, nothing above), and everything under 85 Hz is cut anyway. What Sam hears as hum is the guitar loop in the room and the phone's hiss.
- Loudness: the words set equal to the old voice's.

Old voice in the cut against the new one, share of the voice by band (dB): 60 to 150 Hz -9.0 / -6.7; 2,500 to 5,000 Hz -8.7 / -11.8; 5,000 to 12,000 Hz -11.7 / -15.6. Between words: 28 dB under the words / 56 dB under.

**Fitted to the old structure** (`sketch/love-bombed-speech-refit.py`, table in `love-bombed/speech-refit.txt`). The new take is cut into 24 phrases at its pauses, and each is laid so its first word starts where the same word started in the old take. So the sound script did not change, only which file it reads.
- "with you" starts at 74.679 s (old 74.674) and "my love" at 76.644 s (old 76.639). 5 ms each.
- 22 of the 24 phrases start exactly where the old take's did. The other two are moved by hand, below.
- Where the two takes are phrased differently, by hand:
  - Old: "mornings. (pause) that start". New: no pause. Cut at a 40 ms dip before "that" (17.03 s into the take) so "that start with your blue eyes" lands on its old beat. "adjusting to the light" then runs 0.3 to 0.6 s later than before, at its own pace.
  - Old: "ten years to realize. (pause) how lucky". New: "ten years. (pause) to realize how lucky". "i've had ten years" is one beat early, "how lucky i am" is one beat early, "to realize" half a second late, "to push for the next hundred" exact.
- The whole sound against the old one: bit for bit the same before the speech and from 80 s on.

**The words.** From Sam's script, as read in this take. Two places where the take differs from the script, and four listens agree on both: "more comfortable in your **own** skin" (script: "your skin") is written as said. Lowercase throughout, "libra" too, as the script has it; "10" and "ten" as the script has them. 29 spoken lines: `love-bombed/captions.txt`. "left to see" and "left to live" each have their own line. "i've had ten years / to realize how lucky i am" follows how it is said now.

**The freeze at 67 to 68 s: found, and it was in every cut.** Phase 58 said v38's top-right guitar picture arrived late because the guitar reel's joins were patched differently each run. That was wrong. Checking this phase's renders against each other showed the real thing: the video files are missing frames there. Counted in the files:
- v25: no frames from 66.97 to 67.77 s. v28: 67.33 to 67.93. v36: 67.57 to 68.13. v38: 67.37 to 68.10. v39: 67.53 to 67.80. The first render of this phase: 65.73 to 67.93, over two seconds.
- While frames are missing the player holds the last one. So the picture froze just as the top-right guitar came in, for a different length each time. This is what Sam called "a bit awkward, it almost seems like a glitch" in phase 56. I put it down to the letters changing clip off the beat. It was a freeze.
- Cause: the footage reel (o-loop6, the plain video that fades in at the end) was clips joined by copying, with a join at 67.933 s. At that join its frames come out of the decoder out of order. The render lost its place there and skipped frames, how many depending on the run. The footage is not even visible at 67 s; it only had to be read.
- Proof: the whole render at quarter size takes a minute. With o-loop6: frames missing from 67.30 to 67.87 s. With the reel written out again as plain frames in order (o-loop7): all 2,816 frames there.

**The guitar picture reel, joined cleanly too** (`sketch/love-bombed-guitar-reel.sh`). Not the cause of the freeze, but the same kind of join, so it went as well: each piece decoded alone, cut by frame count, all down one pipe into one encoder. The counts (4050, 506, 505, the rest) put each piece on the frame the old render saw it on, found by matching the old reel's frames against the pieces themselves (bit-identical). Two tries failed first: four inputs joined inside the render deadlocked (0% CPU for 14 minutes), and cutting each piece to a file and joining those by copying put the pieces a frame out. The pipe drops the colour tags; until they were put back the reel came out 31 dB off.

Lesson, again: no more joining by copying. And count the frames in a finished file; a missing frame cannot be seen in a still or in a comparison that lines frames up by time.

**v40, checked**
- Frames counted in the file: 2,816, none missing. First cut of this piece with no freeze at 67 s; the top-right guitar picture is on screen at 67.5 s, with its sound.
- Against v38, everything above the caption band: the title identical; 8.5 to 67 s 39.0 dB on average, worst frame 34.9 dB; 76 s to the end 39.0 dB on average. That is re-encoding and nothing else. One frame differs, at 84.33 s (26 dB): the join between the two backwards pieces, where v38 had a patched frame that matches none of its neighbours and v40 has the piece's own last frame.
- The sound against the old sound: the same bit for bit before the speech and from 80 s on.
- The sung voices: the same file, byte for byte.
- Looked at: four frames (14.6, 30.5, 67.6, 77.6 s) and the caption band at four lines.
Not watched through, not heard.

Picture: ![four caption lines in the bottom band](/assets/love-bombed/captions-band.webp)
Only the band; the frames above it show people.

- `love-bombed-v40.mp4`, `-720.mp4` (not in git). v39 (old voice, captions) and v38 kept.
- New: `sketch/love-bombed-speech-refit.py`, `sketch/love-bombed-guitar-reel.sh`, `love-bombed/speech-refit.txt`. Changed: `sketch/love-bombed-speech-clean.py` (the mask follows real word starts; the hand-kept stretch is an argument), `sketch/love-bombed-sound.py` (takes the voice file), `sketch/love-bombed-captions.py`, `sketch/love-bombed-render.sh`, `love-bombed/captions.txt`, `love-bombed/heads-spec.json`, `love-bombed/speech-words.json` (now the new take's words on the old take's clock).
- Gone from the scratch folder to make room (disk under 1 GB free): k-loop6, pall8, o-loop6 is still there beside o-loop7.

Not decided: "own skin" as said, or the script's "your skin". How dark the s sounds and the top end are now (5.5 dB off the s sounds, 4 dB off the top against the old voice). Whether "to realize" half a second late is fine. Whether the sung "my love" should be written all four times.

## Phase 60: I cut "mornings" in two; nothing moves now unless there is a real space; every word checked

Sam on v40: "you broke up mornings weird". Then: "sad, please fix and make sure never to move unless there is actually a space". Then, on the sound I sent to check: "listen [and] make sure no word gets cut, then print the video".

**What I did wrong in v40.** The old take paused after "mornings"; the new one runs "mornings that start" together. To match the old pause I cut at what looked like a dip, 17.03 s into the take. Looked at closely (voiced sound against hiss, every 20 ms), the dip was the gap between "morning" and its own s: the voiced part ends at 17.02 s and the s runs from 17.04 to 17.18 s. So v40 says "morning", waits 1.3 s, then "s-that start". There is no space anywhere between "mornings" and "start"; "that" is 30 ms long.

**Making sure no word gets cut.** I cannot hear, so this is done by measurement, three ways. Each found something.

1. Where a phrase may be cut (`sketch/love-bombed-speech-refit.py`). Only where the recording itself is quiet: 30 dB or more under its loudest for 0.15 s or longer, judged on the take before any cleaning. The cut goes in the middle of the longest quiet stretch in the pause. The hand-cut option is gone. This threw out a cut v40 had made from whisper's word times alone, before "birthdays", where the take is not quiet.

2. How a pause is made shorter. v40 slid the next phrase earlier and let the two overlap. Where a breath or a drawn-out word end sat in the pause, that put it under the next phrase's first words (found under "and less concerned"). Now a pause is only ever shortened by taking silence out of the quiet stretch itself, leaving 60 ms either side of the cut, and the script stops if two pieces would overlap. A pause is lengthened by putting silence in.

3. The step that turns down the spaces between words (`sketch/love-bombed-speech-clean.py`). It trusted whisper's time for where a word ends, plus 0.2 s. Whisper ends "birthdays" 0.26 s before its s does, and "generous" early too, so the ends of those two s sounds were being turned down 24 dB. v40 has that. Now each word is followed in the sound until it has really stopped. After the fix, five loud sounds are still turned down; all five are breaths, 0.8 s or more after the word before.

Then the proof (`sketch/love-bombed-speech-check-words.py`): for each of the 120 words, from 30 ms before its start to 30 ms after its last sound, the fitted voice is compared with the take sample by sample. A word that was cut, faded or had anything laid over it would differ. Result: none differ. And the finished voice went through OpenAI (by SOM) once more: 120 words heard, 120 in the captions, the same words in the same order, but one: it hears "and who you are" where the script and the captions have "in who you are".

**What the rule costs in timing** (table: `love-bombed/speech-refit.txt`). 23 phrases; every cut has 0.23 s or more of real silence.
- "what matters to me is ten years of mornings that start with your blue eyes adjusting" is one piece, 4.2 s. The old take spent 5.3 s on it, with its pause. It cannot sit on the old beats at both ends, so it starts two beats (0.70 s) after the old place: "what matters to me" and "is ten years of mornings" two beats late, "that start with your blue eyes" 0.7 s early, "adjusting" 0.9 s early. The other choice is its start on the old beat and "that start" 1.4 s early. Sam to say.
- "and less concerned with how the world sees you" comes 0.39 s (about a beat) later than in the old take: the pause before it has only 0.32 s of real silence, so only 0.19 s could come out.
- Everything else as in phase 59. "with you" 74.679 s, "my love" 76.644 s, 5 ms from the old take.

The sound outside the speech: the same as the old sound bit for bit, before the speech and from 80 s on.

Sent first, sound only, twice (`love-bombed-v41-sound.m4a`): once after the first fix, once after the checks. Sam's "make sure no word gets cut" came after the first.

**The s sounds, with FabFilter.** Sam on the sound-only file: "pretty good, but now the voice is coming through quite sibilant. Maybe it was before too, I'm just noticing it ... run through fab filter might actually be nice. I have the fab filter, if you could isolate the sibilant frequencies and then match ... the plugin to tame it, that would be awesome."

Where the s sounds are (`sketch/love-bombed-ess-level.py`): 4.8 s of the take is s. They peak near 3.8 kHz and sit within 6 dB of that from 3.3 to 6.75 kHz; half their energy is below 4.6 kHz. That is low for an s. The de-esser I had used works higher up, so it was mostly missing them: measured over 3 to 12 kHz it took the typical s down 1.6 dB and the loudest 5.4 dB. Before any de-essing the loudest s is 3 dB louder than the loudest vowel.

The fix (`sketch/love-bombed-speech-deess.py`): FabFilter Pro-DS, run from a script the way the podcast clean runs it. Settings, to match in the plugin: Single Vocal, Split Band, band 3.0 to 10 kHz, threshold -50 dB, range 16 dB. The old de-esser is out of the chain.

| s sounds against the loudest vowel | typical | loudest |
| --- | --- | --- |
| the take, no de-essing | -8.7 dB | +3.2 dB |
| old de-esser (v40, first v41 sound) | -10.3 dB | -2.2 dB |
| Pro-DS | -16.8 dB | -8.6 dB |
| the old take's voice, for scale | -11.9 dB | +1.0 dB |

Vowels are untouched (0.00 dB change, and the top end of the voiced sounds is the same to 0.4 dB): only the s moments come down, where the old de-esser dulled the whole top by 4 dB. Nothing moved in time. Other settings tried: range 12 dB (typical -15, loudest -6), threshold -40 (typical -15.2, loudest -7.8). If it lisps, those are the way back.

After the change: the word-by-word check again, none differ. Timing: one phrase start moved 10 ms (the first), so the picture was not rendered again; its first caption is 5 ms off the sound.

**v41, checked**
- Frames counted: 2,816, none missing.
- Above the caption band against v40: identical from 76 s to the end and in the title; 53 dB and better through the speech (the captions' own edges).
- The sound against the old sound: the same bit for bit before the speech and from 80 s on. The sung voices: the same file.
- Looked at: the caption band at four lines.
Not watched through, not heard.

Picture: ![four caption lines in the bottom band](/assets/love-bombed/captions-band.webp)

- `love-bombed-v41.mp4`, `-720.mp4`, `-sound.m4a` (not in git). v40, v39, v38 kept.
- New: `sketch/love-bombed-speech-check-words.py`, `sketch/love-bombed-speech-deess.py`, `sketch/love-bombed-ess-level.py`. Changed: `sketch/love-bombed-speech-refit.py`, `sketch/love-bombed-speech-clean.py`, `sketch/love-bombed-render.sh`, `love-bombed/speech-refit.txt`, `love-bombed/speech-words.json`, `love-bombed/heads-spec.json`.

Not decided: how much de-essing (this, or one of the gentler two). Where the "what matters ... adjusting" piece sits. "own skin" as said or the script's "your skin". "in who you are" or "and who you are".

## Published

Tuesday October 13

v41 went onto Instagram as a reel. I loaded it and Sam shared it: "publishing". The caption is Sam's: "happy birthday", and a balloon. This page went up the same day.
