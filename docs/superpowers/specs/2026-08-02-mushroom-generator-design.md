# Mushroom generator — design

**Date:** 2026-08-02
**Status:** approved, not started
**Scope:** sub-project 1 of 4

## The larger project

A mushroom-growing experience inside `/anything-but-analog`: pick a species, watch it grow
rapidly as a timelapse, with morphology a mycologist would recognise. Species get added over
time as data.

That is four independent pieces, and this spec covers only the first:

| # | piece | depends on |
| - | ----- | ---------- |
| **1** | **generator** — fruiting-body geometry from a parameter set | — |
| 2 | growth — that geometry animated through developmental stages | 1 |
| 3 | blueprints — species as data; a library of them | 1, 2 |
| 4 | scene — substrate, multiple specimens, camera, ABA integration | all |

Each gets its own spec → plan → implementation cycle. The generator is independently useful
and everything else is meaningless without it.

## What "biologically correct" means here

**Morphologically faithful.** A generated specimen held next to a field-guide plate should
read as that species: correct cap profile, gill attachment, stipe proportion, presence or
absence of ring and volva.

It explicitly does *not* mean simulating the mechanism — hyphal networks, turgor pressure,
cell-wall expansion. That is a research project measured in months, and its visible output
can look *worse* while being more "correct".

This choice is what makes correctness testable rather than a matter of taste. See
[Verification](#verification).

## Non-goals

Out of scope for sub-project 1, listed so they do not creep in:

- growth animation over time (sub-project 2)
- **wasm** — see [Why no wasm yet](#why-no-wasm-yet)
- the scene: substrate, lighting, camera, multiple specimens (sub-project 4)
- a species library beyond the three needed to prove the schema (sub-project 3)
- spore dispersal, decay, deliquescence

## Architecture

Two units with one interface between them.

```
Blueprint (data)  ──►  buildFruitingBody(bp, t, seed)  ──►  { positions, normals, indices }
   species as a                pure function                    plain arrays, ready for
   plain object                                                 three.js BufferGeometry
```

The generator knows nothing about three.js, the DOM, or time-stepping. It takes a plain
object and returns plain typed arrays. That is what lets it be unit-tested without a browser,
which is the whole basis of the correctness claim.

### Unit 1 — the blueprint

**What it does:** describes one species as data.
**How you use it:** import a const, or author a new one.
**What it depends on:** nothing.

A species is a row, not a subclass. Every field is something a field guide already publishes,
so adding a species is transcription rather than invention — that is what keeps "we'll add
blueprints over time" from meaning a code change each time.

```ts
export interface Blueprint {
  species: string;              // 'Amanita muscaria'
  common: string;               // 'fly agaric'
  cap: {
    profile: CapProfile;        // convex | campanulate | plane | infundibuliform | umbonate
    diameterMm: [number, number];
    heightRatio: number;        // cap height ÷ cap diameter
    margin: 'entire' | 'striate' | 'inrolled';
    colour: string;
  };
  gills: {
    attachment: GillAttachment; // free | adnexed | adnate | decurrent
    count: number;              // primary lamellae
    lamellulae: number;         // tiers of short gills that stop short of the stipe
    spacing: 'crowded' | 'close' | 'distant';
    colour: string;
  };
  stipe: {
    lengthMm: [number, number];
    diameterMm: [number, number];
    taper: number;              // apex Ø ÷ base Ø
    base: 'equal' | 'bulbous' | 'rooting';
    position: 'central' | 'eccentric' | 'lateral';
    ring: boolean;
    volva: boolean;
    colour: string;
  };
  ornament?: { warts?: { count: number; radiusMm: number } };
  sporePrint: string;
}
```

Ranges (`diameterMm: [80, 200]`) are deliberate: real species vary, and sub-project 4 will
want a stand of specimens that differ from each other. The generator samples a range with a
seeded RNG so a given seed always yields the same specimen.

### Unit 2 — the generator

**What it does:** turns a blueprint into geometry.
**How you use it:** `buildFruitingBody(blueprint, t, seed)`.
**What it depends on:** the blueprint type, and the existing seeded RNG in `src/lib/art/rng.ts`.

Mushroom morphology is largely **a surface of revolution plus a radial array**:

- **cap** — a profile curve revolved around Y. `profile` selects the curve; `heightRatio`
  scales it.
- **stipe** — a tapered tube; `base` deforms the bottom (bulbous, rooting).
- **gills** — `count` blades arrayed radially under the cap, each following the cap's
  underside. `attachment` decides where a blade *starts*: `free` never reaches the stipe at
  all, `decurrent` runs down onto it. `lamellulae` inserts shorter blades between the primary
  ones.
- **ring / volva** — present or absent, from the blueprint.

#### The `t` parameter

`t` is growth, `0..1`. Sub-project 2 owns growth, but `t` is in the signature from day one
because retrofitting time into a geometry API is a rewrite, and growth is a stated
requirement rather than a speculative one. For sub-project 1, `t` is always `1` (mature) and
only needs to not be wrong.

This is one parameter, not an abstraction layer. No `GrowthStrategy` interface, no stage
enum — those get designed in sub-project 2 when there is something real to model.

### Why no wasm yet

The larger project exists partly as an excuse to use WebAssembly, so this needs saying
plainly: **sub-project 1 does not need it, and adding it here would be cargo-cult.**

Static geometry is built once. Rust buys nothing over TypeScript for a single call. Wasm earns
its place in sub-project 2, when a continuous timelapse rebuilds thousands of vertices every
frame — at which point there is a real hot loop and a real benchmark to point at.

Writing it in TypeScript first is also what makes the port measurable later: the TS version
becomes the baseline the wasm version is compared against.

The same applies to `three` (already in `package.json`, unimported). Sub-project 1 needs a
minimal viewer to look at the output — that is where `three` gets its first import — but the
generator itself must not depend on it.

## Data flow

```
blueprint + seed
      │
      ▼
sample ranges (seeded RNG)  ──►  concrete dimensions for this specimen
      │
      ▼
build profile curve (cap)
build tube (stipe)
build blades (gills, positioned by `attachment`)
build ring / volva if present
      │
      ▼
concat into { positions, normals, indices }
      │
      ▼
three.js BufferGeometry  (viewer only, not the generator's concern)
```

## Error handling

The generator is a pure function over author-controlled data, so there is no untrusted input
and no I/O to fail. The failure mode that matters is a **malformed blueprint** — and it should
fail loudly at authoring time, not silently produce a deformed mushroom.

- ranges must be `[min, max]` with `min <= max` — throw otherwise
- `count`, `heightRatio`, `taper` must be positive and finite — throw otherwise
- unknown `profile` / `attachment` values are prevented by the union types at compile time

Throwing is correct here rather than clamping: a bad blueprint is an author error to fix, and
a silently clamped one produces a specimen that is wrong in a way nobody notices.

## Verification

The correctness bar is a test suite. This is the reason for choosing "morphologically
faithful" over "plausible" — the claim is checkable.

Colocated vitest at `src/lib/mushroom/blueprint.test.ts` and `generator.test.ts`, following
the repo's red–green rule for pure logic in `src/lib/*.ts`.

**Morphology assertions, per species:**

| species | asserts |
| ------- | ------- |
| *Amanita muscaria* | gills never intersect the stipe (**free**); ring and volva present; cap h∶Ø within `heightRatio` tolerance; wart count matches |
| *Pleurotus ostreatus* | gills **do** run onto the stipe (**decurrent**); no ring, no volva; eccentric stipe attachment |
| *Coprinopsis* sp. | **campanulate** profile — the cap's widest point sits below its apex, unlike convex where they coincide; cap h∶Ø matches `heightRatio`; gill count matches |

Three species chosen to stress the schema in different directions. If one schema drives all
three, it will take the rest. Two species would not have proven it; ten would be sub-project 3.

**Structural assertions, all species:**

- every index is within `positions.length / 3` — no out-of-range references
- `normals.length === positions.length`
- geometry is non-degenerate: bounding box has extent on all three axes
- same seed → identical output (determinism)

**Manual check, once:** render each species and hold it next to a field-guide plate. Automated
tests prove the invariants; only a human can say "yes, that reads as *Amanita muscaria*".

## Files

```
src/lib/mushroom/
  types.ts            Blueprint, CapProfile, GillAttachment
  blueprint.ts        validation + range sampling
  blueprint.test.ts
  generator.ts        buildFruitingBody()
  generator.test.ts
  species/
    amanita-muscaria.ts
    pleurotus-ostreatus.ts
    coprinopsis.ts
```

A `mushroom/` directory rather than loose files under `src/lib/`: this grows to a species
library, and the audit already flagged single-export modules accumulating at that level.

The viewer is deliberately unlisted. It is throwaway scaffolding for sub-project 1 — a route
or a story that renders one specimen so it can be looked at. Sub-project 4 builds the real
scene; this must not pre-empt it.

## Open questions deferred to later sub-projects

- how growth stages map to `t` — is it linear, or does pinning→expansion have distinct phases? (#2)
- whether gills are geometry or a normal/parallax map at typical camera distance (#2, perf)
- how a stand of specimens varies: seed per specimen, or a population model? (#4)
