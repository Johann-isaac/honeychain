// Deterministic pseudo-random generator so demo data (sensor history,
// batch variance, etc.) looks the same across server restarts instead of
// re-randomizing on every reload.
export function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRandom(seedString: string) {
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    seed = (seed * 31 + seedString.charCodeAt(i)) | 0;
  }
  return mulberry32(seed);
}

export function randRange(rand: () => number, min: number, max: number) {
  return min + rand() * (max - min);
}
