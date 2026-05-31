// Shared signal between routes and the day30 sketch. Only the
// /thoughts route opts in via `active = true`; the homepage gallery's
// day30 sees `active = false` and renders its original look (full
// speed, neutral grays). When active, day30 reads `slow` (0..1) and
// ramps its internal currentSlow toward it for the drain effect.
export const sketchMode = { slow: 0, active: false };
