// The game's rules and state, with no drawing and no browser in it: the beacon beam,
// the fog wraiths, the ships, the starlight motes, waves, score, hearts and the win.
// step() advances one fixed step and returns what happened as bit flags, so the
// caller can react (sound, announcements) without the world knowing about screens.
// Nothing here allocates after createWorld returns.

import {
  BEACON,
  COMBO,
  FIELD,
  HEARTS,
  MOTE,
  NIGHT,
  POOL,
  SHIP,
  WRAITH,
} from './config.js';
import { edgeSpawn } from './random.js';

export const KIND_WISP = 0;
export const KIND_DART = 1;
export const KIND_BRUTE = 2;

export const EVENT_HIT = 1;
export const EVENT_KILL = 2;
export const EVENT_MOTE = 4;
export const EVENT_RESCUE = 8;
export const EVENT_SHIP_LOST = 16;
export const EVENT_WAVE = 32;
export const EVENT_PULSE = 64;
export const EVENT_OVER = 128;
export const EVENT_WIN = 256;
export const EVENT_DOCK = 512;

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** True when the point is inside the beam cone from the beacon. */
export function inBeam(x, y, aimAngle) {
  const dx = x - BEACON.x;
  const dy = y - BEACON.y;
  const dist = Math.hypot(dx, dy);
  if (dist > BEACON.beamLength || dist < BEACON.islandRadius) return false;
  return Math.abs(angleDiff(Math.atan2(dy, dx), aimAngle)) <= BEACON.beamHalfAngle;
}

function wraithInterval(wave) {
  return Math.max(0.22, 0.9 - 0.08 * (wave - 1));
}

function pickKind(random, wave) {
  const roll = random();
  if (wave >= 7 && roll < 0.25) return KIND_BRUTE;
  if (wave >= 4 && roll < 0.15) return KIND_BRUTE;
  if (wave >= 2 && roll < 0.4) return KIND_DART;
  return KIND_WISP;
}

export function createWorld(random) {
  const wraiths = [];
  for (let i = 0; i < POOL.wraiths; i += 1) {
    wraiths.push({ active: false, kind: KIND_WISP, x: 0, y: 0, hp: 1, maxHp: 1, speed: 0, radius: 10, score: 0, wobble: 0, wobbleSpeed: 0, seed: 0 });
  }
  const ships = [];
  for (let i = 0; i < POOL.ships; i += 1) {
    ships.push({ active: false, x: 0, y: 0, lastLit: -99, bob: 0, wake: 0 });
  }
  const motes = [];
  for (let i = 0; i < POOL.motes; i += 1) {
    motes.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, litTime: 0, age: 0, pulse: 0 });
  }
  const particles = [];
  for (let i = 0; i < POOL.particles; i += 1) {
    particles.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, color: '#ffd76a', size: 3 });
  }

  const state = {
    wraiths,
    ships,
    motes,
    particles,
    score: 0,
    hearts: HEARTS,
    wave: 1,
    elapsed: 0,
    rescued: 0,
    docked: 0,
    shipsLost: 0,
    kills: 0,
    motesCollected: 0,
    combo: 0,
    comboTimer: 0,
    charge: 30,
    aimAngle: -Math.PI / 2,
    pulseFlash: 0,
    pulseRing: 0,
    over: false,
    won: false,
    wraithTimer: 1.2,
    shipTimer: 2.5,
    moteTimer: 1.0,
    spawnCount: 0,
  };

  function reset() {
    for (const w of wraiths) w.active = false;
    for (const s of ships) s.active = false;
    for (const m of motes) m.active = false;
    for (const p of particles) p.active = false;
    state.score = 0;
    state.hearts = HEARTS;
    state.wave = 1;
    state.elapsed = 0;
    state.rescued = 0;
    state.docked = 0;
    state.shipsLost = 0;
    state.kills = 0;
    state.motesCollected = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.charge = 30;
    state.aimAngle = -Math.PI / 2;
    state.pulseFlash = 0;
    state.pulseRing = 0;
    state.over = false;
    state.won = false;
    state.wraithTimer = 1.2;
    state.shipTimer = 2.5;
    state.moteTimer = 1.0;
    state.spawnCount = 0;
  }

  function free(pool) {
    for (let i = 0; i < pool.length; i += 1) if (!pool[i].active) return pool[i];
    return null;
  }

  function burst(x, y, color, count, speed) {
    let made = 0;
    for (let i = 0; i < particles.length && made < count; i += 1) {
      const p = particles[i];
      if (p.active) continue;
      const a = random() * Math.PI * 2;
      const v = speed * (0.4 + random() * 0.8);
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * v;
      p.vy = Math.sin(a) * v;
      p.maxLife = 0.5 + random() * 0.5;
      p.life = p.maxLife;
      p.color = color;
      p.size = 2 + random() * 3;
      made += 1;
    }
  }

  function spawnWraith() {
    const w = free(wraiths);
    if (w === null) return;
    const kind = pickKind(random, state.wave);
    const def = kind === KIND_BRUTE ? WRAITH.brute : kind === KIND_DART ? WRAITH.dart : WRAITH.wisp;
    const at = edgeSpawn(random, FIELD.width, FIELD.height, 40);
    w.active = true;
    w.kind = kind;
    w.x = at.x;
    w.y = at.y;
    w.maxHp = def.hp;
    w.hp = def.hp;
    w.speed = def.speed * (1 + 0.06 * (state.wave - 1)) * (0.9 + random() * 0.2);
    w.radius = def.radius;
    w.score = def.score;
    w.wobble = random() * Math.PI * 2;
    w.wobbleSpeed = 1 + random() * 2;
    w.seed = random() * 10;
  }

  function spawnShip() {
    const s = free(ships);
    if (s === null) return;
    const at = edgeSpawn(random, FIELD.width, FIELD.height, 50);
    s.active = true;
    s.x = at.x;
    s.y = at.y;
    s.lastLit = -99;
    s.bob = random() * Math.PI * 2;
    s.wake = 0;
  }

  function spawnMote() {
    const m = free(motes);
    if (m === null) return;
    const at = edgeSpawn(random, FIELD.width, FIELD.height, 30);
    const a = Math.atan2(BEACON.y - at.y, BEACON.x - at.x) + (random() - 0.5) * 0.9;
    m.active = true;
    m.x = at.x;
    m.y = at.y;
    m.vx = Math.cos(a) * MOTE.driftSpeed;
    m.vy = Math.sin(a) * MOTE.driftSpeed;
    m.litTime = 0;
    m.age = 0;
    m.pulse = random() * Math.PI * 2;
  }

  function multiplier() {
    return Math.min(COMBO.maxMultiplier, 1 + state.combo * COMBO.step);
  }

  function killWraith(w, events) {
    w.active = false;
    state.kills += 1;
    state.combo += 1;
    state.comboTimer = COMBO.windowSeconds;
    state.score += Math.round(w.score * multiplier());
    state.charge = Math.min(BEACON.pulseChargeMax, state.charge + BEACON.chargePerKill);
    burst(w.x, w.y, '#ffd76a', w.kind === KIND_BRUTE ? 18 : 10, 130);
    burst(w.x, w.y, '#b9a8e8', 8, 80);
    return events | EVENT_KILL;
  }

  /**
   * One fixed step. `aimAngle` is where the beam points, `wantPulse` fires the
   * pulse blast when the charge is full. Returns the event flags for this step.
   */
  function step(dt, aimAngle, wantPulse) {
    if (state.over) return 0;
    let events = 0;
    state.elapsed += dt;
    state.aimAngle = aimAngle;
    const wave = Math.min(NIGHT.waves, 1 + Math.floor(state.elapsed / NIGHT.waveSeconds));
    if (wave !== state.wave) {
      state.wave = wave;
      events |= EVENT_WAVE;
    }
    state.charge = Math.min(BEACON.pulseChargeMax, state.charge + BEACON.chargePerSecond * dt);
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }
    if (state.pulseFlash > 0) state.pulseFlash = Math.max(0, state.pulseFlash - dt * 2.5);
    if (state.pulseRing > 0) state.pulseRing = Math.max(0, state.pulseRing - dt * 1.4);

    if (wantPulse && state.charge >= BEACON.pulseChargeMax) {
      state.charge = 0;
      state.pulseFlash = 1;
      state.pulseRing = 1;
      events |= EVENT_PULSE;
      for (const w of wraiths) {
        if (!w.active) continue;
        const d = Math.hypot(w.x - BEACON.x, w.y - BEACON.y);
        if (d > BEACON.pulseRadius) continue;
        w.hp -= BEACON.pulseDamage;
        const push = 160 * (1 - d / BEACON.pulseRadius) + 60;
        w.x += ((w.x - BEACON.x) / (d || 1)) * push * 0.12;
        w.y += ((w.y - BEACON.y) / (d || 1)) * push * 0.12;
        if (w.hp <= 0) events = killWraith(w, events);
      }
    }

    state.wraithTimer -= dt;
    if (state.wraithTimer <= 0) {
      spawnWraith();
      state.spawnCount += 1;
      // From wave 3, every fifth spawn arrives as a burst of three.
      if (state.wave >= 3 && state.spawnCount % 5 === 0) {
        spawnWraith();
        spawnWraith();
      }
      state.wraithTimer = wraithInterval(state.wave) * (0.8 + random() * 0.4);
    }
    state.shipTimer -= dt;
    let activeShips = 0;
    for (const s of ships) if (s.active) activeShips += 1;
    if (state.shipTimer <= 0 && activeShips < SHIP.maxConcurrent) {
      spawnShip();
      state.shipTimer = SHIP.spawnEverySeconds * (0.85 + random() * 0.3);
    }
    state.moteTimer -= dt;
    if (state.moteTimer <= 0) {
      spawnMote();
      state.moteTimer = MOTE.spawnEverySeconds * (0.8 + random() * 0.4);
    }

    for (const m of motes) {
      if (!m.active) continue;
      m.age += dt;
      m.pulse += dt * 3;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.age > 14) {
        m.active = false;
        continue;
      }
      if (inBeam(m.x, m.y, aimAngle)) {
        m.litTime += dt;
        if (m.litTime >= 0.25) {
          m.active = false;
          state.motesCollected += 1;
          state.score += MOTE.score;
          state.charge = Math.min(BEACON.pulseChargeMax, state.charge + BEACON.chargePerMote);
          burst(m.x, m.y, '#ffd76a', 8, 90);
          events |= EVENT_MOTE;
        }
      } else {
        m.litTime = 0;
      }
    }

    for (const s of ships) {
      if (!s.active) continue;
      s.bob += dt * 2;
      s.wake -= dt;
      const dx = BEACON.x - s.x;
      const dy = BEACON.y - s.y;
      const d = Math.hypot(dx, dy);
      const guided = state.elapsed - s.lastLit < 2;
      if (inBeam(s.x, s.y, aimAngle)) s.lastLit = state.elapsed;
      const speed = guided ? SHIP.guidedSpeed : SHIP.speed;
      s.x += (dx / (d || 1)) * speed * dt;
      s.y += (dy / (d || 1)) * speed * dt;
      if (d <= BEACON.islandRadius + 8) {
        s.active = false;
        if (guided || state.elapsed - s.lastLit < 2.5) {
          state.rescued += 1;
          state.score += SHIP.rescueScore;
          burst(s.x, s.y, '#7fe0a8', 14, 110);
          events |= EVENT_RESCUE;
        } else {
          state.docked += 1;
          state.score += SHIP.dockScore;
          events |= EVENT_DOCK;
        }
      }
    }

    for (const w of wraiths) {
      if (!w.active) continue;
      w.wobble += dt * w.wobbleSpeed;
      let tx = BEACON.x;
      let ty = BEACON.y;
      let huntingShip = false;
      let nearest = 60;
      for (const s of ships) {
        if (!s.active) continue;
        const d = Math.hypot(s.x - w.x, s.y - w.y);
        if (d < nearest) {
          nearest = d;
          tx = s.x;
          ty = s.y;
          huntingShip = true;
        }
      }
      const dx = tx - w.x;
      const dy = ty - w.y;
      const d = Math.hypot(dx, dy) || 1;
      const wob = Math.sin(w.wobble) * 14;
      const px = -dy / d;
      const py = dx / d;
      // A wraith stalking a ship closes in slowly, giving the beam time to save it.
      let chase = huntingShip ? w.speed * 0.75 : w.speed;
      // The fog thickens and slows in the light's edge, so a wraith that reaches
      // the island's doorstep still gives the keeper one last chance to burn it.
      const distBeacon = Math.hypot(w.x - BEACON.x, w.y - BEACON.y);
      if (distBeacon < 220) chase *= 0.6;
      w.x += (dx / d) * chase * dt + px * wob * dt;
      w.y += (dy / d) * chase * dt + py * wob * dt;

      if (inBeam(w.x, w.y, aimAngle)) {
        w.hp -= BEACON.beamDamagePerSecond * dt;
        if (w.hp <= 0) {
          events = killWraith(w, events);
          continue;
        }
      }
      const distIsland = Math.hypot(w.x - BEACON.x, w.y - BEACON.y);
      if (distIsland <= BEACON.islandRadius + w.radius * 0.4) {
        w.active = false;
        state.hearts -= 1;
        state.combo = 0;
        state.comboTimer = 0;
        burst(w.x, w.y, '#ff5d7a', 14, 120);
        events |= EVENT_HIT;
        continue;
      }
      for (const s of ships) {
        if (!s.active) continue;
        if (Math.hypot(s.x - w.x, s.y - w.y) < w.radius + SHIP.radius - 12) {
          // A sunk ship costs score and the combo, not a heart: hearts are lost
          // only when the fog reaches the island itself.
          w.active = false;
          s.active = false;
          state.shipsLost += 1;
          state.score = Math.max(0, state.score - 100);
          state.combo = 0;
          state.comboTimer = 0;
          burst(s.x, s.y, '#ff5d7a', 16, 140);
          events |= EVENT_SHIP_LOST;
          break;
        }
      }
    }

    for (const p of particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 2.4 * dt;
      p.vy *= 1 - 2.4 * dt;
    }

    if (state.hearts <= 0) {
      state.hearts = 0;
      state.over = true;
      state.won = false;
      events |= EVENT_OVER;
    } else if (state.elapsed >= NIGHT.waves * NIGHT.waveSeconds) {
      state.over = true;
      state.won = true;
      state.score += 500;
      events |= EVENT_WIN;
    }
    return events;
  }

  /** Night progress toward dawn, 0 to 1. */
  function nightProgress() {
    return Math.min(1, state.elapsed / (NIGHT.waves * NIGHT.waveSeconds));
  }

  /** Current score multiplier from the kill combo. */
  function comboMultiplier() {
    return multiplier();
  }

  return { state, reset, step, nightProgress, comboMultiplier, inBeam };
}
