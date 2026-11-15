// Every tuning number and colour for Tide Beacon, in one place. The playfield is a
// fixed 1280x720 logical area; the renderer scales it to the window, so no rule
// below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

/** The beacon tower stands at the centre of the island. */
export const BEACON = {
  x: 640,
  y: 360,
  islandRadius: 96,
  towerHeight: 86,
  beamLength: 560,
  beamHalfAngle: 0.2,
  beamDamagePerSecond: 95,
  pulseRadius: 280,
  pulseDamage: 130,
  pulseChargeMax: 100,
  chargePerMote: 9,
  chargePerKill: 7,
  chargePerSecond: 2,
};

export const HEARTS = 3;

/** One night lasts ten waves; surviving wave 10 brings the dawn and the win. */
export const NIGHT = { waves: 10, waveSeconds: 25, stormFromWave: 6 };

export const WRAITH = {
  wisp: { hp: 45, speed: 30, radius: 20, score: 30 },
  dart: { hp: 30, speed: 56, radius: 14, score: 40 },
  brute: { hp: 220, speed: 22, radius: 30, score: 90 },
};

export const SHIP = {
  speed: 56,
  guidedSpeed: 88,
  radius: 22,
  rescueScore: 120,
  dockScore: 30,
  spawnEverySeconds: 6,
  maxConcurrent: 4,
};

export const MOTE = {
  radius: 11,
  score: 15,
  spawnEverySeconds: 2.8,
  driftSpeed: 18,
};

/** How many of each thing can exist at once; pools are allocated once, at boot. */
export const POOL = { wraiths: 48, ships: 6, motes: 24, particles: 320 };

/** Combo: kills within this window of each other raise the multiplier. */
export const COMBO = { windowSeconds: 3, step: 0.1, maxMultiplier: 3 };

export const PALETTE = {
  seaTop: '#0b2e3d',
  seaMid: '#0a2436',
  seaDeep: '#061524',
  moon: '#f5e9c8',
  star: '#cfe8ff',
  islandSand: '#c9a86a',
  islandGrass: '#3f7d4e',
  islandRock: '#5d6b73',
  towerStripe: '#e8e3d5',
  towerRoof: '#b8452f',
  lamp: '#ffd76a',
  beam: '#ffcf5e',
  wraithBody: '#8d7fb8',
  wraithEye: '#ff5d7a',
  shipHull: '#7a4a2b',
  shipSail: '#f2e6c8',
  mote: '#ffd76a',
  panel: 'rgba(6, 20, 32, 0.72)',
  text: '#f2ead8',
  muted: '#9db8c4',
  danger: '#ff5d7a',
  gold: '#ffd76a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'tide-beacon.best';
