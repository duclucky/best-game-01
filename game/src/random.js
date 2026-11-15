// A small seeded random generator (mulberry32), so a ?seed=N run of the game plays
// the same way every time. The live game seeds it from Math.random.

export function createRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a point on the edge of the field, just outside the visible sea. */
export function edgeSpawn(random, width, height, margin) {
  const side = Math.floor(random() * 4);
  if (side === 0) return { x: random() * width, y: -margin };
  if (side === 1) return { x: width + margin, y: random() * height };
  if (side === 2) return { x: random() * width, y: height + margin };
  return { x: -margin, y: random() * height };
}
