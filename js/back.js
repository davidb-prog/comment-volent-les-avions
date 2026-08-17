// La vue « de derrière » : pencher = tourner. On voit l'avion de dos, l'horizon
// s'incline avec les ailes, la portance penchée pousse de côté — et la
// mini-carte (vue de dessus) montre la trajectoire qui s'incurve. Les deux
// regards racontent le même instant, toujours d'accord.

import { ALT_MAX, WEIGHT, BANK_MAX, clamp, clamp01,
         COLOR_LIFT, COLOR_WEIGHT, COLOR_PLANE, COLOR_PLANE_DEEP,
         SKY_TOP, SKY_BOTTOM, COLOR_GRASS, COLOR_RUNWAY } from './model.js';
import { TAU, fitCanvas, label, drawArrow, drawCloud } from './canvas.js';

const HORIZON_TILT = 0.5;   // l'horizon s'incline (en contre) de la moitié de l'inclinaison
const BACK_ARROW_PER_FORCE = 40; // pixels de flèche par « poids d'avion » (à l'échelle 1)
const TRAIL_STEP = 0.12;    // une miette de trajectoire toutes les 0,12 s
const TRAIL_MAX = 220;      // longueur du fil de la mini-carte
const MAP_SCALE = 0.055;    // unités du monde → pixels de la mini-carte

export class BackView {
  constructor(canvas) {
    this.canvas = canvas;
    this.trail = [];
    this._acc = 0;
  }

  // Une miette de trajectoire à intervalle régulier (appelé à chaque image).
  remember(state, dt) {
    this._acc += dt;
    if (this._acc < TRAIL_STEP) return;
    this._acc = 0;
    this.trail.push({ x: state.x, y: state.y });
    if (this.trail.length > TRAIL_MAX) this.trail.shift();
  }

  draw(state) {
    const f = fitCanvas(this.canvas);
    const ctx = f.ctx, w = f.w, h = f.h;
    const s = Math.max(0.6, w / 380);
    const cx = w / 2, cy = h * 0.56;
    const tilt = -state.bank * HORIZON_TILT;
    const D = Math.max(w, h) * 1.6;

    // ---- le monde (ciel + sol) incliné en contre des ailes
    // L'horizon descend quand on monte : le sol s'éloigne sous l'avion.
    const hy = 16 * s + clamp01(state.alt / ALT_MAX) * h * 0.2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    const g = ctx.createLinearGradient(0, -D, 0, hy);
    g.addColorStop(0, SKY_TOP);
    g.addColorStop(1, SKY_BOTTOM);
    ctx.fillStyle = g;
    ctx.fillRect(-D, -D, D * 2, D + hy);
    ctx.fillStyle = COLOR_GRASS;
    ctx.fillRect(-D, hy, D * 2, D);
    // la piste, droit devant : un trapèze qui file vers l'horizon
    const rwNear = 60 * s * (1 - 0.6 * clamp01(state.alt / 30));
    if (rwNear > 8) {
      ctx.fillStyle = COLOR_RUNWAY;
      ctx.beginPath();
      ctx.moveTo(-rwNear, D);
      ctx.lineTo(rwNear, D);
      ctx.lineTo(rwNear * 0.12, hy + 2);
      ctx.lineTo(-rwNear * 0.12, hy + 2);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2.5 * s;
      ctx.setLineDash([10 * s, 12 * s]);
      ctx.beginPath();
      ctx.moveTo(0, D);
      ctx.lineTo(0, hy + 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // deux nuages posés dans le paysage (ils s'inclinent avec l'horizon)
    drawCloud(ctx, -w * 0.32, hy - 60 * s, 0.9 * s, 0.85);
    drawCloud(ctx, w * 0.26, hy - 96 * s, 0.7 * s, 0.85);
    ctx.restore();

    // ---- les deux forces du virage : le poids tire droit en bas (monde),
    //      la portance pousse perpendiculairement aux ailes (avion)
    if (!state.onGround && state.forces) {
      const ar = BACK_ARROW_PER_FORCE * s;
      const liftLen = Math.min(state.forces.lift, 2) * ar;
      drawArrow(ctx, cx + Math.sin(state.bank) * 26 * s, cy - Math.cos(state.bank) * 26 * s,
        -Math.PI / 2 + state.bank, liftLen, COLOR_LIFT, 6 * s);
      drawArrow(ctx, cx, cy + 24 * s, Math.PI / 2, WEIGHT * ar, COLOR_WEIGHT, 6 * s);
      const tipX = cx + Math.sin(state.bank) * (28 * s + liftLen);
      const tipY = cy - Math.cos(state.bank) * (28 * s + liftLen);
      label(ctx, 'la portance', tipX, tipY - 10 * s,
        { align: 'center', size: 11.5 * s, color: COLOR_LIFT, clampW: w, clampH: h });
      label(ctx, 'le poids', cx, cy + 26 * s + WEIGHT * ar + 10 * s,
        { align: 'center', size: 11.5 * s, color: COLOR_WEIGHT, clampW: w, clampH: h });
    }

    // ---- ton avion vu de dos, penché avec ses ailes
    this.planeBack(ctx, cx, cy, s, state.bank, state.onGround);

    // ---- la mini-carte : la trajectoire vue de dessus, qui s'incurve
    this.miniMap(ctx, w, h, s, state);

    this.layout = { w: w, h: h, s: s, cx: cx, cy: cy, tilt: tilt, hy: hy };
  }

  planeBack(ctx, x, y, s, bank, onGround) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bank);
    // l'aile, d'un bout à l'autre
    ctx.strokeStyle = COLOR_PLANE_DEEP;
    ctx.lineCap = 'round';
    ctx.lineWidth = 9 * s;
    ctx.beginPath();
    ctx.moveTo(-64 * s, 2 * s);
    ctx.lineTo(64 * s, 2 * s);
    ctx.stroke();
    // deux petits moteurs sous l'aile
    ctx.fillStyle = COLOR_PLANE_DEEP;
    ctx.beginPath(); ctx.ellipse(-30 * s, 7 * s, 7 * s, 5 * s, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(30 * s, 7 * s, 7 * s, 5 * s, 0, 0, TAU); ctx.fill();
    // la dérive au-dessus
    ctx.fillStyle = COLOR_PLANE;
    ctx.beginPath();
    ctx.moveTo(-3 * s, -10 * s);
    ctx.lineTo(0, -34 * s);
    ctx.lineTo(5 * s, -10 * s);
    ctx.closePath(); ctx.fill();
    // le fuselage rond
    ctx.beginPath(); ctx.arc(0, 0, 15 * s, 0, TAU); ctx.fill();
    // la verrière du pilote, petit dôme sur le dessus (il nous fait coucou !)
    ctx.fillStyle = '#eaf6ff';
    ctx.beginPath(); ctx.arc(0, -7 * s, 5.5 * s, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffd9b0';
    ctx.beginPath(); ctx.arc(0, -8 * s, 2.6 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a3524';
    ctx.beginPath(); ctx.arc(0, -8.8 * s, 2.6 * s, Math.PI, 0); ctx.fill();
    // les roues au sol
    if (onGround) {
      ctx.fillStyle = '#33475c';
      ctx.beginPath(); ctx.arc(-12 * s, 14 * s, 4 * s, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(12 * s, 14 * s, 4 * s, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // La trajectoire vue de dessus : le fil des dernières positions, tourné pour
  // que « devant » soit en haut — en virage, le fil s'incurve du côté penché.
  miniMap(ctx, w, h, s, state) {
    const r = Math.min(w, h) * 0.19;
    const mx = w - r - 10 * s, my = r + 10 * s;
    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, TAU);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(28, 53, 80, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.clip();
    // le fil de la trajectoire, dans le repère de l'avion (cap vers le haut)
    const ch = Math.cos(state.heading), sh = Math.sin(state.heading);
    const sc = MAP_SCALE * s;
    ctx.strokeStyle = COLOR_PLANE;
    ctx.lineWidth = 2.5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const dx = p.x - state.x, dy = p.y - state.y;
      // rotation de −cap : l'avion regarde toujours vers le haut de la carte
      const rx = dx * ch + dy * sh;
      const ry = -dx * sh + dy * ch;
      const sx2 = mx + rx * sc, sy2 = my + ry * sc;
      if (!started) { ctx.moveTo(sx2, sy2); started = true; }
      else ctx.lineTo(sx2, sy2);
    }
    if (started) {
      ctx.globalAlpha = 0.85;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // ton avion, au centre, plein cap vers le haut
    ctx.fillStyle = COLOR_PLANE_DEEP;
    ctx.beginPath();
    ctx.moveTo(mx, my - 7 * s);
    ctx.lineTo(mx - 5.5 * s, my + 6 * s);
    ctx.lineTo(mx + 5.5 * s, my + 6 * s);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    label(ctx, 'vu de dessus', mx, my + r - 8 * s,
      { align: 'center', size: 9.5 * s, color: 'rgba(28, 53, 80, 0.75)', clampW: w, clampH: h });
    this.mapLayout = { mx: mx, my: my, r: r };
  }
}
