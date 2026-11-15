// All drawing, no rules: the night sea, the island and its beacon, the beam, the
// wraiths, the ships, the motes, the particles, the rain and every screen. The
// canvas is a fixed 1280x720 logical field scaled to the window with letterbox.

import { BEACON, FIELD, NIGHT, PALETTE, FONT } from './config.js';
import { createRandom } from './random.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

const LAMP = { x: BEACON.x, y: BEACON.y - BEACON.towerHeight };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHeart(ctx, x, y, size, filled) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.9);
  ctx.bezierCurveTo(x - size * 1.2, y + size * 0.1, x - size * 0.7, y - size * 0.8, x, y - size * 0.1);
  ctx.bezierCurveTo(x + size * 0.7, y - size * 0.8, x + size * 1.2, y + size * 0.1, x, y + size * 0.9);
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = PALETTE.danger;
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(255, 93, 122, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawStar4(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const stars = [];
  const starRandom = createRandom(20261115);
  for (let i = 0; i < 90; i += 1) {
    stars.push({ x: starRandom() * FIELD.width, y: starRandom() * 300, r: 0.6 + starRandom() * 1.4, tw: starRandom() * Math.PI * 2 });
  }
  const rain = [];
  for (let i = 0; i < 70; i += 1) {
    rain.push({ x: (i * 173) % FIELD.width, y: (i * 97) % FIELD.height, len: 14 + (i % 5) * 3, speed: 520 + (i % 4) * 60 });
  }
  const beamDust = [];
  for (let i = 0; i < 26; i += 1) {
    beamDust.push({ along: 60 + ((i * 53) % 460), across: ((i * 37) % 70) - 35, size: 1 + (i % 3) });
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || FIELD.width;
    const h = canvas.clientHeight || FIELD.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  function fit() {
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    const ox = (canvas.width - FIELD.width * scale) / 2;
    const oy = (canvas.height - FIELD.height * scale) / 2;
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
  }

  function drawSea(now) {
    const g = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    g.addColorStop(0, PALETTE.seaTop);
    g.addColorStop(0.55, PALETTE.seaMid);
    g.addColorStop(1, PALETTE.seaDeep);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    for (const s of stars) {
      const a = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(now * 1.4 + s.tw));
      ctx.globalAlpha = a;
      ctx.fillStyle = PALETTE.star;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const moonX = 1080;
    const moonY = 92;
    const glow = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 90);
    glow.addColorStop(0, 'rgba(245, 233, 200, 0.5)');
    glow.addColorStop(1, 'rgba(245, 233, 200, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(moonX - 90, moonY - 90, 180, 180);
    ctx.fillStyle = PALETTE.moon;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(190, 170, 130, 0.5)';
    ctx.beginPath();
    ctx.arc(moonX - 10, moonY - 6, 7, 0, Math.PI * 2);
    ctx.arc(moonX + 12, moonY + 10, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(160, 210, 230, 0.10)';
    ctx.lineWidth = 3;
    for (let band = 0; band < 4; band += 1) {
      const y = 150 + band * 150;
      ctx.beginPath();
      for (let x = 0; x <= FIELD.width; x += 16) {
        const yy = y + Math.sin(x * 0.012 + now * (0.7 + band * 0.15) + band * 2) * 7;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(141, 127, 184, 0.05)';
    for (let i = 0; i < 3; i += 1) {
      const fx = ((i * 430 + now * 12) % (FIELD.width + 360)) - 180;
      ctx.beginPath();
      ctx.ellipse(fx, 120 + i * 190, 190, 34, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawIsland(now) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(BEACON.x, BEACON.y + 26, 118, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETTE.islandSand;
    ctx.beginPath();
    ctx.ellipse(BEACON.x, BEACON.y, 104, 78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.islandGrass;
    ctx.beginPath();
    ctx.ellipse(BEACON.x, BEACON.y - 6, 88, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.islandRock;
    ctx.beginPath();
    ctx.ellipse(BEACON.x - 62, BEACON.y + 22, 18, 10, 0.4, 0, Math.PI * 2);
    ctx.ellipse(BEACON.x + 58, BEACON.y + 30, 15, 9, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8a6a3f';
    for (let i = 0; i < 4; i += 1) {
      ctx.fillRect(BEACON.x - 34 + i * 18, BEACON.y + 74, 14, 8);
    }

    const towerX = BEACON.x;
    const baseY = BEACON.y - 8;
    ctx.fillStyle = PALETTE.towerStripe;
    ctx.beginPath();
    ctx.moveTo(towerX - 26, baseY);
    ctx.lineTo(towerX - 17, baseY - 64);
    ctx.lineTo(towerX + 17, baseY - 64);
    ctx.lineTo(towerX + 26, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.towerRoof;
    ctx.beginPath();
    ctx.moveTo(towerX - 19, baseY - 64);
    ctx.lineTo(towerX + 19, baseY - 64);
    ctx.lineTo(towerX + 14, baseY - 74);
    ctx.lineTo(towerX - 14, baseY - 74);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(184, 69, 47, 0.55)';
    ctx.beginPath();
    ctx.moveTo(towerX - 23, baseY - 22);
    ctx.lineTo(towerX - 20, baseY - 44);
    ctx.lineTo(towerX + 20, baseY - 44);
    ctx.lineTo(towerX + 23, baseY - 22);
    ctx.closePath();
    ctx.fill();

    const pulse = 0.75 + 0.25 * Math.sin(now * 3);
    const lampGlow = ctx.createRadialGradient(LAMP.x, LAMP.y, 4, LAMP.x, LAMP.y, 46);
    lampGlow.addColorStop(0, `rgba(255, 215, 106, ${0.85 * pulse})`);
    lampGlow.addColorStop(1, 'rgba(255, 215, 106, 0)');
    ctx.fillStyle = lampGlow;
    ctx.fillRect(LAMP.x - 46, LAMP.y - 46, 92, 92);
    ctx.fillStyle = PALETTE.lamp;
    ctx.beginPath();
    ctx.arc(LAMP.x, LAMP.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath();
    ctx.arc(LAMP.x, LAMP.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBeam(state, now) {
    const aim = state.aimAngle;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(LAMP.x, LAMP.y);
    ctx.rotate(aim);
    const grad = ctx.createLinearGradient(0, 0, BEACON.beamLength, 0);
    grad.addColorStop(0, 'rgba(255, 207, 94, 0.55)');
    grad.addColorStop(0.7, 'rgba(255, 207, 94, 0.18)');
    grad.addColorStop(1, 'rgba(255, 207, 94, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(BEACON.beamLength, -Math.tan(BEACON.beamHalfAngle) * BEACON.beamLength);
    ctx.lineTo(BEACON.beamLength, Math.tan(BEACON.beamHalfAngle) * BEACON.beamLength);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 230, 150, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(BEACON.beamLength, -Math.tan(BEACON.beamHalfAngle) * BEACON.beamLength);
    ctx.moveTo(0, 0);
    ctx.lineTo(BEACON.beamLength, Math.tan(BEACON.beamHalfAngle) * BEACON.beamLength);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 240, 190, 0.5)';
    for (const d of beamDust) {
      const drift = Math.sin(now * 2 + d.along * 0.05) * 6;
      ctx.beginPath();
      ctx.arc(d.along, d.across + drift, d.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWraiths(state, now) {
    for (const w of state.wraiths) {
      if (!w.active) continue;
      const breathe = 1 + 0.08 * Math.sin(now * 4 + w.seed);
      const r = w.radius * breathe;
      const glow = ctx.createRadialGradient(w.x, w.y, r * 0.2, w.x, w.y, r * 1.7);
      glow.addColorStop(0, 'rgba(141, 127, 184, 0.5)');
      glow.addColorStop(1, 'rgba(141, 127, 184, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(w.x, w.y, r * 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(94, 80, 140, 0.9)';
      ctx.beginPath();
      ctx.arc(w.x, w.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(60, 48, 100, 0.9)';
      ctx.beginPath();
      ctx.arc(w.x - r * 0.5, w.y + r * 0.55, r * 0.55, 0, Math.PI * 2);
      ctx.arc(w.x + r * 0.55, w.y + r * 0.5, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      const look = Math.atan2(BEACON.y - w.y, BEACON.x - w.x);
      const ex = Math.cos(look) * r * 0.25;
      const ey = Math.sin(look) * r * 0.25;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(w.x - r * 0.32 + ex, w.y - r * 0.18 + ey, r * 0.2, 0, Math.PI * 2);
      ctx.arc(w.x + r * 0.32 + ex, w.y - r * 0.18 + ey, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.wraithEye;
      ctx.beginPath();
      ctx.arc(w.x - r * 0.32 + ex * 1.6, w.y - r * 0.18 + ey * 1.6, r * 0.1, 0, Math.PI * 2);
      ctx.arc(w.x + r * 0.32 + ex * 1.6, w.y - r * 0.18 + ey * 1.6, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
      if (w.kind === 2 && w.hp < w.maxHp) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(w.x - 22, w.y - r - 12, 44, 5);
        ctx.fillStyle = PALETTE.danger;
        ctx.fillRect(w.x - 22, w.y - r - 12, 44 * (w.hp / w.maxHp), 5);
      }
    }
  }

  function drawShips(state, now) {
    for (const s of state.ships) {
      if (!s.active) continue;
      const bobY = Math.sin(s.bob) * 3;
      const angle = Math.atan2(BEACON.y - s.y, BEACON.x - s.x);
      const guided = state.elapsed - s.lastLit < 2;
      ctx.save();
      ctx.translate(s.x, s.y + bobY);
      ctx.rotate(angle + Math.PI / 2);
      ctx.strokeStyle = 'rgba(180, 220, 240, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 16, 12, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PALETTE.shipHull;
      ctx.beginPath();
      ctx.moveTo(-16, -4);
      ctx.lineTo(16, -4);
      ctx.lineTo(11, 12);
      ctx.lineTo(-11, 12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#5d3a20';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(0, -30);
      ctx.stroke();
      ctx.fillStyle = guided ? '#ffe9a8' : PALETTE.shipSail;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(13, -8);
      ctx.lineTo(0, -8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.lamp;
      ctx.beginPath();
      ctx.arc(0, -34, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (guided) {
        const g = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 34);
        g.addColorStop(0, 'rgba(255, 215, 106, 0.28)');
        g.addColorStop(1, 'rgba(255, 215, 106, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 34, 0, Math.PI * 2);
        ctx.fill();
      }
      let threatened = false;
      for (const w of state.wraiths) {
        if (w.active && Math.hypot(w.x - s.x, w.y - s.y) < 150) {
          threatened = true;
          break;
        }
      }
      if (threatened) {
        ctx.strokeStyle = `rgba(255, 93, 122, ${0.45 + 0.35 * Math.sin(now * 6)})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 34, 0, Math.PI * 2);
        ctx.stroke();
      }
      void now;
    }
  }

  function drawMotes(state, now) {
    for (const m of state.motes) {
      if (!m.active) continue;
      const fade = m.age > 12 ? Math.max(0, (14 - m.age) / 2) : 1;
      const r = MOTE_RADIUS(m);
      ctx.save();
      ctx.globalAlpha = fade;
      const glow = ctx.createRadialGradient(m.x, m.y, 1, m.x, m.y, 22);
      glow.addColorStop(0, 'rgba(255, 215, 106, 0.55)');
      glow.addColorStop(1, 'rgba(255, 215, 106, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 22, 0, Math.PI * 2);
      ctx.fill();
      drawStar4(ctx, m.x, m.y, r, PALETTE.mote);
      ctx.restore();
    }
    void now;
  }

  function MOTE_RADIUS(m) {
    return 9 + 3 * Math.sin(m.pulse);
  }

  function drawParticles(state) {
    for (const p of state.particles) {
      if (!p.active) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawRain(now) {
    ctx.strokeStyle = 'rgba(180, 210, 235, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const drop of rain) {
      const y = (drop.y + now * drop.speed) % (FIELD.height + 40);
      const x = drop.x + y * 0.12;
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + drop.len);
    }
    ctx.stroke();
  }

  function drawHud(state, best) {
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, 12, 12, 1256, 56, 12);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 26px ${FONT}`;
    ctx.fillText(`SCORE ${state.score}`, 30, 32);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 15px ${FONT}`;
    ctx.fillText(`BEST ${Math.max(best, state.score)}`, 30, 56);

    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 20px ${FONT}`;
    ctx.fillText(`WAVE ${state.wave} / ${NIGHT.waves}`, 640, 28);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    roundRect(ctx, 540, 42, 200, 8, 4);
    ctx.fill();
    ctx.fillStyle = PALETTE.gold;
    roundRect(ctx, 540, 42, 200 * (state.elapsed / (NIGHT.waves * NIGHT.waveSeconds)), 8, 4);
    ctx.fill();
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 12px ${FONT}`;
    ctx.fillText('NIGHT  ·  DAWN', 640, 62);

    for (let i = 0; i < 3; i += 1) {
      drawHeart(ctx, 1090 + i * 30, 34, 11, i < state.hearts);
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 20px ${FONT}`;
    ctx.fillText(`⚓ ${state.rescued}`, 1250, 30);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 13px ${FONT}`;
    ctx.fillText('ships home', 1250, 52);

    if (state.combo >= 3) {
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.gold;
      ctx.font = `800 22px ${FONT}`;
      ctx.fillText(`COMBO x${(1 + Math.min(state.combo, 20) * 0.1).toFixed(1)}`, 640, 96);
    }

    const chargeW = 260;
    const chargeX = 640 - chargeW / 2;
    const chargeY = 672;
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, chargeX - 10, chargeY - 8, chargeW + 20, 30, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    roundRect(ctx, chargeX, chargeY, chargeW, 14, 7);
    ctx.fill();
    const full = state.charge >= 100;
    ctx.fillStyle = full ? PALETTE.gold : '#7fb8d8';
    roundRect(ctx, chargeX, chargeY, chargeW * (state.charge / 100), 14, 7);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = full ? PALETTE.gold : PALETTE.muted;
    ctx.font = `700 12px ${FONT}`;
    ctx.fillText(full ? 'PULSE READY  ·  SPACE / CLICK' : 'PULSE CHARGING', 640, chargeY + 26);
  }

  function panelBox(x, y, w, h) {
    ctx.fillStyle = 'rgba(4, 14, 24, 0.78)';
    roundRect(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 106, 0.35)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 18);
    ctx.stroke();
  }

  function drawTitle(state, best, now) {
    drawSea(now);
    const sweep = state.aimAngle;
    drawBeam({ aimAngle: sweep }, now);
    drawIsland(now);
    ctx.fillStyle = 'rgba(4, 14, 24, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `800 92px ${FONT}`;
    ctx.fillText('TIDE BEACON', 640, 190);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `500 26px ${FONT}`;
    ctx.fillText('Keep the light sweeping. Guide the ships home. Burn the fog back.', 640, 258);

    panelBox(270, 300, 740, 168);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `600 20px ${FONT}`;
    ctx.fillText('Move the mouse to aim the beam', 640, 336);
    ctx.fillText('The beam burns fog wraiths before they reach the island', 640, 372);
    ctx.fillText('Light the ships so they find the harbour', 640, 408);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 17px ${FONT}`;
    ctx.fillText('SPACE / CLICK: pulse blast when charged  ·  P: pause  ·  M: mute', 640, 444);

    if (best > 0) {
      ctx.fillStyle = PALETTE.gold;
      ctx.font = `700 20px ${FONT}`;
      ctx.fillText(`BEST SCORE  ${best}`, 640, 500);
    }
    ctx.fillStyle = PALETTE.text;
    ctx.font = `800 24px ${FONT}`;
    ctx.fillText('CLICK OR PRESS SPACE TO BEGIN', 640, 556);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 15px ${FONT}`;
    ctx.fillText('Survive 10 waves until dawn  ·  3 hearts  ·  a sunk ship costs 100 points', 640, 606);
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(4, 14, 24, 0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `800 64px ${FONT}`;
    ctx.fillText('PAUSED', 640, 330);
    ctx.font = `500 22px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('Press P or click to keep the light moving', 640, 390);
  }

  function drawOver(state, best) {
    ctx.fillStyle = 'rgba(4, 14, 24, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    if (state.won) {
      ctx.fillStyle = PALETTE.gold;
      ctx.font = `800 72px ${FONT}`;
      ctx.fillText('DAWN BREAKS', 640, 168);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `500 24px ${FONT}`;
      ctx.fillText('The harbour stands. You kept the light burning all night.', 640, 224);
    } else {
      ctx.fillStyle = PALETTE.danger;
      ctx.font = `800 60px ${FONT}`;
      ctx.fillText('THE FOG TAKES THE HARBOUR', 640, 168);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `500 24px ${FONT}`;
      ctx.fillText('The light goes out this time. The tide will give you another night.', 640, 224);
    }
    panelBox(440, 268, 400, 216);
    const rows = [
      ['SCORE', String(state.score)],
      ['BEST', String(Math.max(best, state.score))],
      ['SHIPS GUIDED HOME', String(state.rescued)],
      ['WRAITHS BANISHED', String(state.kills)],
      ['STARLIGHT GATHERED', String(state.motesCollected)],
      ['WAVES SURVIVED', `${Math.min(state.wave, NIGHT.waves)} / ${NIGHT.waves}`],
    ];
    ctx.font = `600 20px ${FONT}`;
    rows.forEach((row, i) => {
      const y = 300 + i * 30;
      ctx.textAlign = 'left';
      ctx.fillStyle = PALETTE.muted;
      ctx.fillText(row[0], 470, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = PALETTE.text;
      ctx.fillText(row[1], 810, y);
    });
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `800 24px ${FONT}`;
    ctx.fillText('PRESS R OR CLICK TO PLAY AGAIN', 640, 540);
  }

  function draw(state, screen, best, now) {
    resize();
    fit();
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best, now);
      return;
    }
    drawSea(now);
    drawBeam(state, now);
    drawIsland(now);
    drawMotes(state, now);
    drawShips(state, now);
    drawWraiths(state, now);
    drawParticles(state);
    if (state.wave >= NIGHT.stormFromWave && screen === SCREEN_PLAY) drawRain(now);
    if (state.pulseFlash > 0) {
      ctx.fillStyle = `rgba(255, 220, 130, ${state.pulseFlash * 0.25})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
    if (state.pulseRing > 0) {
      ctx.strokeStyle = `rgba(255, 215, 106, ${state.pulseRing})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(BEACON.x, BEACON.y, BEACON.pulseRadius * (1.6 - state.pulseRing * 0.6), 0, Math.PI * 2);
      ctx.stroke();
    }
    drawHud(state, best);
    if (screen === SCREEN_PAUSED) drawPaused();
    if (screen === SCREEN_OVER) drawOver(state, best);
  }

  return { draw, resize };
}
