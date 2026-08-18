// La vue du virage, refonte « idée B » choisie par David : LA CARTE EST LA
// STAR. Ton avion au centre, cap vers le haut, et c'est le monde entier qui
// tourne autour de lui — lacs, forêts, champs, pistes — pendant que la trace
// rose s'incurve derrière. La cause (pencher les ailes) vit dans un médaillon
// « vu de derrière » : horizon incliné + avion penché, sans aucune flèche.

import { ALT_MAX, clamp01, COLOR_PLANE, COLOR_PLANE_DEEP,
         SKY_TOP, SKY_BOTTOM, COLOR_GRASS, COLOR_RUNWAY } from './model.js';
import { TAU, fitCanvas, label, drawCloud } from './canvas.js';

const HORIZON_TILT = 0.5;   // dans le médaillon, l'horizon s'incline en contre
const TRAIL_STEP = 0.12;    // une miette de trajectoire toutes les 0,12 s
const TRAIL_MAX = 260;      // longueur du fil de trajectoire
const MAP_SCALE = 0.22;     // unités du monde → pixels de la carte (échelle 1) —
                            // assez grand pour que le cercle d'un virage serré
                            // ne se cache pas sous l'avion
const CELL = 420;           // taille d'une tuile du monde (en unités du monde)

// Petit hachage déterministe d'une tuile : le monde est infini mais stable.
function cellHash(ix, iy) {
  let h = (ix * 73856093) ^ (iy * 19349663);
  h = (h ^ (h >> 13)) * 1274126177;
  return Math.abs(h ^ (h >> 16));
}

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
    const cx = w / 2, cy = h * 0.55;
    const k = MAP_SCALE * s; // unités du monde → pixels

    // ---- l'herbe à perte de vue
    ctx.fillStyle = COLOR_GRASS;
    ctx.fillRect(0, 0, w, h);

    // ---- le monde en tuiles, tourné autour de l'avion (cap vers le haut)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-state.heading);
    const reach = Math.sqrt(w * w + h * h) / 2 / k; // rayon visible, en unités
    const ix0 = Math.floor((state.x - reach) / CELL), ix1 = Math.floor((state.x + reach) / CELL);
    const iy0 = Math.floor((state.y - reach) / CELL), iy1 = Math.floor((state.y + reach) / CELL);
    for (let ix = ix0; ix <= ix1; ix++) {
      for (let iy = iy0; iy <= iy1; iy++) {
        this.tile(ctx, ix, iy, state, k, s);
      }
    }
    ctx.restore();

    // ---- la piste sous les roues : au sol elle file droit devant (verticale),
    //      et s'estompe dès qu'on prend de la hauteur
    const rwA = clamp01(1 - state.alt / 18);
    if (rwA > 0.02) {
      ctx.globalAlpha = rwA;
      ctx.fillStyle = COLOR_RUNWAY;
      ctx.fillRect(cx - 24 * s, 0, 48 * s, h);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 3 * s;
      ctx.setLineDash([16 * s, 18 * s]);
      // signe négatif : le sol file vers le bas de l'écran quand l'avion avance
      ctx.lineDashOffset = -((state.dist || 0) * k % (34 * s));
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // ---- la trace rose : le fil des dernières positions, qui s'incurve
    const ch = Math.cos(state.heading), sh = Math.sin(state.heading);
    ctx.strokeStyle = COLOR_PLANE;
    ctx.lineWidth = 4 * s;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const dx = p.x - state.x, dy = p.y - state.y;
      // rotation de −cap : l'avion regarde toujours vers le haut de la carte
      const rx = dx * ch + dy * sh;
      const ry = -dx * sh + dy * ch;
      const sx = cx + rx * k, sy = cy + ry * k;
      if (!started) { ctx.moveTo(sx, sy); started = true; }
      else ctx.lineTo(sx, sy);
    }
    if (started) ctx.stroke();
    ctx.globalAlpha = 1;

    // ---- ton avion vu de dessus, au centre — son ombre s'écarte avec l'altitude
    const shOff = (3 + state.alt * 0.22) * s;
    ctx.fillStyle = 'rgba(28, 53, 80, 0.16)';
    ctx.save();
    ctx.translate(cx + shOff, cy + shOff);
    this.planeTopShape(ctx, s, true);
    ctx.restore();
    ctx.save();
    ctx.translate(cx, cy);
    this.planeTop(ctx, s);
    ctx.restore();

    // ---- le médaillon « vu de derrière » : la cause du virage, en vignette
    this.medallion(ctx, w, h, s, state);

    this.layout = { w: w, h: h, s: s, cx: cx, cy: cy, k: k };
  }

  // Une tuile du monde : lac, petite forêt, champ, ou piste décorative — le
  // décor qui permet de VOIR que ça tourne. Coordonnées en unités du monde,
  // dessinées dans le repère tourné (mise à l'échelle à la main via k).
  tile(ctx, ix, iy, state, k, s) {
    const hsh = cellHash(ix, iy);
    const wx = (ix + 0.5 + ((hsh % 7) - 3) * 0.09) * CELL;
    const wy = (iy + 0.5 + (((hsh >> 3) % 7) - 3) * 0.09) * CELL;
    const X = (wx - state.x) * k, Y = (wy - state.y) * k;
    const type = hsh % 11;
    if (type < 3) {
      // une petite forêt ronde
      ctx.fillStyle = '#4f9358';
      const n = 4 + (hsh % 3);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + (hsh % 5);
        ctx.beginPath();
        ctx.arc(X + Math.cos(a) * 26 * k * 3, Y + Math.sin(a) * 22 * k * 3, 24 * k * 2.4, 0, TAU);
        ctx.fill();
      }
    } else if (type < 5) {
      // un lac
      ctx.fillStyle = '#8ecdf2';
      ctx.beginPath();
      ctx.ellipse(X, Y, 100 * k, 72 * k, (hsh % 6) * 0.5, 0, TAU);
      ctx.fill();
    } else if (type < 8) {
      // un champ plus clair, aux coins ronds
      ctx.fillStyle = 'rgba(255, 244, 180, 0.5)';
      ctx.beginPath();
      ctx.ellipse(X, Y, 120 * k, 90 * k, (hsh % 4) * 0.7, 0, TAU);
      ctx.fill();
    } else if (type === 8) {
      // une piste d'aérodrome, plein nord (il y en a toujours une quelque part !)
      ctx.fillStyle = COLOR_RUNWAY;
      ctx.fillRect(X - 24 * k, Y - 160 * k, 48 * k, 320 * k);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let d = -140; d < 150; d += 60) {
        ctx.fillRect(X - 3 * k, (Y + d * k), 6 * k, 26 * k);
      }
    } else if (type === 9) {
      // un nuage qui se promène au-dessus du paysage
      drawCloud(ctx, X, Y, 1.6 * k * 6, 0.55);
    }
    // type 10 : rien — de l'herbe, pour respirer
  }

  planeTopShape(ctx, s, shadowOnly) {
    // silhouette vue de dessus, cap vers le haut (utilisée aussi pour l'ombre)
    ctx.beginPath(); ctx.ellipse(0, 2 * s, 6.5 * s, 17 * s, 0, 0, TAU); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-25 * s, 4 * s); ctx.lineTo(25 * s, 4 * s); ctx.lineTo(0, -5 * s);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10 * s, 17 * s); ctx.lineTo(10 * s, 17 * s); ctx.lineTo(0, 11 * s);
    ctx.closePath(); ctx.fill();
  }

  planeTop(ctx, s) {
    // les ailes et l'empennage
    ctx.fillStyle = COLOR_PLANE_DEEP;
    ctx.beginPath();
    ctx.moveTo(-25 * s, 4 * s); ctx.lineTo(25 * s, 4 * s); ctx.lineTo(0, -5 * s);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10 * s, 17 * s); ctx.lineTo(10 * s, 17 * s); ctx.lineTo(0, 11 * s);
    ctx.closePath(); ctx.fill();
    // le fuselage
    ctx.fillStyle = COLOR_PLANE;
    ctx.beginPath(); ctx.ellipse(0, 2 * s, 6.5 * s, 17 * s, 0, 0, TAU); ctx.fill();
    // la verrière du pilote, vers l'avant
    ctx.fillStyle = '#eaf6ff';
    ctx.beginPath(); ctx.ellipse(0, -7 * s, 3.4 * s, 4.6 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a3524';
    ctx.beginPath(); ctx.arc(0, -6 * s, 2 * s, 0, TAU); ctx.fill();
  }

  // Le médaillon « vu de derrière » : horizon incliné + avion penché — la
  // cause du virage en un coup d'œil, sans aucune flèche.
  medallion(ctx, w, h, s, state) {
    const r = Math.min(w, h) * 0.19;
    const mx = w - r - 10 * s, my = r + 10 * s;
    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, TAU);
    ctx.clip();
    // le petit monde du médaillon, incliné en contre des ailes
    ctx.translate(mx, my);
    ctx.rotate(-state.bank * HORIZON_TILT);
    const hy = 12 * s * 0.6 + clamp01(state.alt / ALT_MAX) * r * 0.5;
    const D = r * 2.2;
    const g = ctx.createLinearGradient(0, -D, 0, hy);
    g.addColorStop(0, SKY_TOP);
    g.addColorStop(1, SKY_BOTTOM);
    ctx.fillStyle = g;
    ctx.fillRect(-D, -D, D * 2, D + hy);
    ctx.fillStyle = COLOR_GRASS;
    ctx.fillRect(-D, hy, D * 2, D);
    ctx.rotate(state.bank * HORIZON_TILT);
    this.planeBack(ctx, 0, r * 0.12, r / 68, state.bank);
    ctx.restore();
    ctx.strokeStyle = 'rgba(28, 53, 80, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, TAU);
    ctx.stroke();
    label(ctx, 'vu de derrière', mx, my + r - 8 * s,
      { align: 'center', size: 9.5 * s, color: 'rgba(28, 53, 80, 0.8)', clampW: w, clampH: h });
    this.medLayout = { mx: mx, my: my, r: r };
  }

  planeBack(ctx, x, y, s, bank) {
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
    ctx.restore();
  }
}
