// 3D value noise with smooth trilinear interpolation. Deterministic per-seed.
// Fast, good enough for the organic textures these sketches need.

function fade(t: number): number {
  return t * t * (3 - 2 * t);
}

export function makeNoise(seed: number) {
  // Hash three ints → [0,1) pseudo-random, salted by seed.
  function hash(x: number, y: number, z: number): number {
    let n = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 1610612741) | 0;
    n = (n ^ (n >>> 13)) >>> 0;
    n = Math.imul(n, 1274126177) >>> 0;
    n = (n ^ (n >>> 16)) >>> 0;
    return (n & 0x7fffffff) / 0x7fffffff;
  }

  return function noise(x: number, y: number = 0, z: number = 0): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const fx = fade(x - xi);
    const fy = fade(y - yi);
    const fz = fade(z - zi);

    const n000 = hash(xi, yi, zi);
    const n100 = hash(xi + 1, yi, zi);
    const n010 = hash(xi, yi + 1, zi);
    const n110 = hash(xi + 1, yi + 1, zi);
    const n001 = hash(xi, yi, zi + 1);
    const n101 = hash(xi + 1, yi, zi + 1);
    const n011 = hash(xi, yi + 1, zi + 1);
    const n111 = hash(xi + 1, yi + 1, zi + 1);

    const nx00 = n000 + fx * (n100 - n000);
    const nx10 = n010 + fx * (n110 - n010);
    const nx01 = n001 + fx * (n101 - n001);
    const nx11 = n011 + fx * (n111 - n011);

    const nxy0 = nx00 + fy * (nx10 - nx00);
    const nxy1 = nx01 + fy * (nx11 - nx01);

    return nxy0 + fz * (nxy1 - nxy0);
  };
}
