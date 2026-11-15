// The screenshot scenes behind ?shot=start|play|storm|end. Each one plays the real
// rules forward from a fresh world for a fixed number of seconds, steered by a
// simple autopilot (aim the beam at the wraith nearest the island, else the
// nearest ship, else the nearest mote; fire the pulse when wraiths crowd the
// beacon), so the frame is what a real game looks like and the same seed always
// gives the same frame.

import { BEACON, STEP } from './config.js';
import { EVENT_OVER, EVENT_WIN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 42;
const STORM_SECONDS = 152;
const END_LIMIT_SECONDS = 600;

/** Aim at the most urgent thing: the wraith with the least time to its target first,
 * counting a ship a wraith is stalking as its target, as the world does. */
function autopilotAim(state) {
  let bestWraith = null;
  let bestTime = Infinity;
  for (const w of state.wraiths) {
    if (!w.active) continue;
    let tx = BEACON.x;
    let ty = BEACON.y;
    let speed = w.speed;
    let nearest = 60;
    for (const s of state.ships) {
      if (!s.active) continue;
      const d = Math.hypot(s.x - w.x, s.y - w.y);
      if (d < nearest) {
        nearest = d;
        tx = s.x;
        ty = s.y;
        speed = w.speed * 0.75;
      }
    }
    const t = Math.hypot(tx - w.x, ty - w.y) / speed;
    if (t < bestTime) {
      bestTime = t;
      bestWraith = w;
    }
  }
  if (bestWraith !== null) return Math.atan2(bestWraith.y - BEACON.y, bestWraith.x - BEACON.x);
  let bestShip = null;
  let bestShipDist = Infinity;
  for (const s of state.ships) {
    if (!s.active) continue;
    const d = Math.hypot(s.x - BEACON.x, s.y - BEACON.y);
    if (d < bestShipDist) {
      bestShipDist = d;
      bestShip = s;
    }
  }
  if (bestShip !== null) return Math.atan2(bestShip.y - BEACON.y, bestShip.x - BEACON.x);
  let bestMote = null;
  let bestMoteDist = Infinity;
  for (const m of state.motes) {
    if (!m.active) continue;
    const d = Math.hypot(m.x - BEACON.x, m.y - BEACON.y);
    if (d < bestMoteDist) {
      bestMoteDist = d;
      bestMote = m;
    }
  }
  if (bestMote !== null) return Math.atan2(bestMote.y - BEACON.y, bestMote.x - BEACON.x);
  return -Math.PI / 2;
}

/** Fire the pulse only when at least two wraiths are inside its radius. */
function autopilotPulse(state) {
  if (state.charge < 100) return false;
  let inside = 0;
  for (const w of state.wraiths) {
    if (!w.active) continue;
    if (Math.hypot(w.x - BEACON.x, w.y - BEACON.y) < BEACON.pulseRadius) inside += 1;
  }
  return inside >= 2;
}

function runFor(world, seconds, aim) {
  for (let i = 0; i < seconds / STEP; i += 1) {
    const angle = aim === 'auto' ? autopilotAim(world.state) : aim;
    const events = world.step(STEP, angle, autopilotPulse(world.state));
    if (events & (EVENT_OVER | EVENT_WIN)) break;
  }
}

/**
 * Set `world` to the named scene (start, play, storm or end; any other name is
 * start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'storm' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) {
      world.state.aimAngle = -Math.PI / 2 + Math.sin((i * STEP) * 0.5) * 1.1;
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'storm') {
    runFor(world, STORM_SECONDS, 'auto');
    return { screen: world.state.over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'end') {
    for (let i = 0; i < END_LIMIT_SECONDS / STEP; i += 1) {
      const events = world.step(STEP, -Math.PI / 2, false);
      if (events & EVENT_OVER) break;
    }
    return { screen: SCREEN_OVER, best: world.state.score };
  }
  runFor(world, PLAY_SECONDS, 'auto');
  return { screen: world.state.over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
