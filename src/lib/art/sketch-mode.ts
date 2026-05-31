// Shared signal for the /thoughts hover → bg-sketch coordination.
// Pages set `slow` to 1 when a hover should slow/gold the sketch, 0 to
// release. Sketches read it each tick and lerp toward it internally so
// the page side stays a single assignment per event.
export const sketchMode = { slow: 0 };
