// La vue « de côté » : la piste, l'herbe, le grand ciel — et ton avion rose à
// poste fixe pendant que le décor défile. Les 4 flèches des forces sont
// accrochées à l'avion et changent de longueur en direct : c'est le « graphe »
// que l'enfant lit sans savoir lire. Tout est piloté par le modèle pur.

import { TAU, V_MAX, ALT_MAX, WEIGHT, FLARE_ALT, clamp, clamp01,
         COLOR_LIFT, COLOR_WEIGHT, COLOR_THRUST, COLOR_DRAG,
         COLOR_PLANE, COLOR_PLANE_DEEP, SKY_TOP, SKY_BOTTOM,
         COLOR_GRASS, COLOR_RUNWAY } from './model.js';
import { fitCanvas, label, drawArrow, drawCloud } from './canvas.js';

const ARROW_PER_FORCE = 46;   // pixels de flèche par « poids d'avion » (à l'échelle 1)
const ARROW_CAP = 2.0;        // au-delà, la flèche n'apprend plus rien : on plafonne
const SCROLL_PX = 2.0;        // pixels de décor par unité de distance (à l'échelle 1)

// Le décor qui défile : positions « monde » déterministes, répétées en boucle.
const CLOUDS = [
  [0.06, 0.16, 1.1], [0.34, 0.30, 0.8], [0.58, 0.12, 1.3], [0.86, 0.26, 0.9],
];
const FLOWERS = [0.08, 0.22, 0.41, 0.55, 0.72, 0.9];
const FLOWER_COLORS = ['#e0447c', '#6a4fd0', '#ffb54d'];

export const SideView = class {
  constructor(canvas) { this.canvas = canvas; }

  draw(state, controls) {
    const f = fitCanvas(this.canvas);
    const ctx = f.ctx, w = f.w, h = f.h;
    const s = Math.max(0.6, w / 600);
    const horizon = Math.round(h * 0.78);
    const dist = state.dist || 0;

    // ---- le grand ciel de jour
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, SKY_TOP);
    g.addColorStop(1, SKY_BOTTOM);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, horizon);

    // ---- le soleil qui sourit, dans son coin
    this.sun(ctx, w - 52 * s, 40 * s, 17 * s);

    // ---- les nuages (parallaxe douce : ils sont loin)
    const cloudOff = dist * SCROLL_PX * s * 0.4;
    for (const c of CLOUDS) {
      const span = w + 140 * s;
      let x = ((c[0] * span - cloudOff) % span + span) % span - 70 * s;
      drawCloud(ctx, x, c[1] * horizon + 8, c[2] * s, 0.92);
    }

    // ---- l'herbe et la piste (le sol défile sous l'avion)
    ctx.fillStyle = COLOR_GRASS;
    ctx.fillRect(0, horizon, w, h - horizon);
    const rwH = Math.max(12, h * 0.085);
    ctx.fillStyle = COLOR_RUNWAY;
    ctx.fillRect(0, horizon, w, rwH);
    // la ligne médiane défile avec la distance parcourue
    const groundOff = dist * SCROLL_PX * s;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(2, 3 * s);
    ctx.setLineDash([18 * s, 20 * s]);
    ctx.lineDashOffset = groundOff % (38 * s);
    ctx.beginPath();
    ctx.moveTo(0, horizon + rwH * 0.55);
    ctx.lineTo(w, horizon + rwH * 0.55);
    ctx.stroke();
    ctx.setLineDash([]);
    // quelques fleurs sur l'herbe, fidèles au poste
    const span = w + 40 * s;
    for (let i = 0; i < FLOWERS.length; i++) {
      let x = ((FLOWERS[i] * span - groundOff) % span + span) % span - 20 * s;
      this.flower(ctx, x, horizon + rwH + (h - horizon - rwH) * (0.35 + 0.4 * ((i * 37) % 10) / 10), s,
        FLOWER_COLORS[i % FLOWER_COLORS.length]);
    }

    // ---- la place de l'avion à l'écran
    const px = w * 0.42;
    const wheelsY = horizon + 2 * s;
    const groundCy = wheelsY - 15 * s;
    const topCy = h * 0.16;
    const py = groundCy - clamp01(state.alt / ALT_MAX) * (groundCy - topCy);
    const pitch = state.onGround
      ? 0
      : clamp(-Math.atan2(state.vs, 26), -0.42, 0.42);

    // ---- l'ombre de l'avion sur le sol, quand il est bas
    const shadowK = clamp01(1 - state.alt / 26);
    if (shadowK > 0) {
      ctx.fillStyle = 'rgba(28, 53, 80, ' + (0.22 * shadowK) + ')';
      ctx.beginPath();
      ctx.ellipse(px, horizon + rwH * 0.5, (34 + 14 * (1 - shadowK)) * s, 5 * s, 0, 0, TAU);
      ctx.fill();
    }

    // ---- les petits traits de vitesse derrière l'avion
    const vk = clamp01(state.v / V_MAX);
    if (vk > 0.12) {
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.5 * vk) + ')';
      ctx.lineWidth = 3 * s;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const yy = py + (i - 1) * 12 * s;
        const ll = (18 + 26 * vk) * s;
        ctx.beginPath();
        ctx.moveTo(px - 52 * s - ll, yy);
        ctx.lineTo(px - 52 * s - ll * 0.35, yy);
        ctx.stroke();
      }
    }

    // ---- ton avion (et son pilote) — la flamme du moteur suit la manette
    const throttleNow = controls ? controls.throttle : 0;
    this.plane(ctx, px, py, s, pitch, state.onGround || state.alt < FLARE_ALT, throttleNow);

    // ---- les 4 flèches des forces, accrochées à l'avion
    const forcesNow = state.forces; // posées par main.js à chaque image
    if (forcesNow) {
      // UNE SEULE échelle pour les 4 flèches : leurs longueurs se comparent
      // honnêtement (poussée = traînée en croisière, à l'œil nu aussi).
      const ar = ARROW_PER_FORCE * s;
      const liftLen = Math.min(forcesNow.lift, ARROW_CAP) * ar;
      const weightLen = Math.min(forcesNow.weight, ARROW_CAP) * ar;
      const thrustLen = Math.min(forcesNow.thrust, ARROW_CAP) * ar;
      const dragLen = Math.min(forcesNow.drag, ARROW_CAP) * ar;
      drawArrow(ctx, px + 2 * s, py - 20 * s, -Math.PI / 2, liftLen, COLOR_LIFT, 7 * s);
      drawArrow(ctx, px + 2 * s, py + 16 * s, Math.PI / 2, weightLen, COLOR_WEIGHT, 7 * s);
      drawArrow(ctx, px + 48 * s, py, 0, thrustLen, COLOR_THRUST, 7 * s);
      drawArrow(ctx, px - 50 * s, py, Math.PI, dragLen, COLOR_DRAG, 7 * s);
      if (liftLen > 16) {
        label(ctx, 'la portance', px + 2 * s, py - 24 * s - liftLen - 9 * s,
          { align: 'center', size: 12 * s, color: COLOR_LIFT, clampW: w, clampH: h });
      }
      label(ctx, 'le poids', px + 2 * s, py + 20 * s + weightLen + 10 * s,
        { align: 'center', size: 12 * s, color: COLOR_WEIGHT, clampW: w, clampH: h });
      if (thrustLen > 16) {
        label(ctx, 'la poussée', px + 52 * s + thrustLen + 12 * s, py,
          { align: 'left', size: 12 * s, color: COLOR_THRUST, clampW: w, clampH: h });
      }
      if (dragLen > 16) {
        label(ctx, 'la traînée', px - 54 * s - dragLen - 12 * s, py,
          { align: 'right', size: 12 * s, color: COLOR_DRAG, clampW: w, clampH: h });
      }
    }

    this.layout = { w: w, h: h, s: s, horizon: horizon, rwH: rwH, px: px, py: py };
  }

  sun(ctx, x, y, r) {
    const glow = ctx.createRadialGradient(x, y, 1, x, y, r * 2.4);
    glow.addColorStop(0, '#ffe9a8');
    glow.addColorStop(0.5, 'rgba(255, 214, 110, 0.5)');
    glow.addColorStop(1, 'rgba(255, 214, 110, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(120, 70, 10, 0.8)';
    ctx.beginPath(); ctx.arc(x - r * 0.32, y - r * 0.14, r * 0.09, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.32, y - r * 0.14, r * 0.09, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(120, 70, 10, 0.8)';
    ctx.lineWidth = r * 0.09; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y + r * 0.12, r * 0.4, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
  }

  flower(ctx, x, y, s, col) {
    ctx.strokeStyle = '#3f7d4d';
    ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 8 * s); ctx.stroke();
    ctx.fillStyle = col;
    for (let i = 0; i < 5; i++) {
      const a = i * TAU / 5;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * 3.2 * s, y - 8 * s + Math.sin(a) * 3.2 * s, 2 * s, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#fff7d6';
    ctx.beginPath(); ctx.arc(x, y - 8 * s, 1.7 * s, 0, TAU); ctx.fill();
  }

  // Ton avion, rond et sympathique, avec son petit pilote — le nez vers la droite.
  // `throttle` allume la flamme du réacteur : la manette des gaz répond à l'œil,
  // même à l'arrêt (retour de David : « à quoi sert ce curseur ? »).
  plane(ctx, x, y, s, pitch, wheelsOut, throttle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(pitch);
    // le réacteur sous l'aile, et sa flamme qui grandit avec les gaz
    ctx.fillStyle = '#8b93a5';
    ctx.beginPath(); ctx.ellipse(4 * s, 11 * s, 9 * s, 5.5 * s, 0, 0, TAU); ctx.fill();
    if (throttle > 0.03) {
      const fl = (6 + 30 * throttle) * s;
      const flame = ctx.createLinearGradient(-5 * s, 0, -5 * s - fl, 0);
      flame.addColorStop(0, '#ffd166');
      flame.addColorStop(0.5, '#ff9f1c');
      flame.addColorStop(1, 'rgba(255, 122, 28, 0)');
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.moveTo(-4 * s, 8 * s);
      ctx.lineTo(-5 * s - fl, 11 * s);
      ctx.lineTo(-4 * s, 14 * s);
      ctx.closePath(); ctx.fill();
    }
    // les roues (sorties près du sol)
    if (wheelsOut) {
      ctx.strokeStyle = COLOR_PLANE_DEEP;
      ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.moveTo(-8 * s, 8 * s); ctx.lineTo(-10 * s, 14 * s);
      ctx.moveTo(14 * s, 8 * s); ctx.lineTo(16 * s, 14 * s);
      ctx.stroke();
      ctx.fillStyle = '#33475c';
      ctx.beginPath(); ctx.arc(-10 * s, 15 * s, 4 * s, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(16 * s, 15 * s, 4 * s, 0, TAU); ctx.fill();
    }
    // la dérive (queue), derrière
    ctx.fillStyle = COLOR_PLANE;
    ctx.beginPath();
    ctx.moveTo(-26 * s, -5 * s);
    ctx.quadraticCurveTo(-36 * s, -24 * s, -44 * s, -24 * s);
    ctx.lineTo(-38 * s, -3 * s);
    ctx.closePath(); ctx.fill();
    // le fuselage
    ctx.beginPath(); ctx.ellipse(0, 0, 40 * s, 12.5 * s, 0, 0, TAU); ctx.fill();
    // le stabilisateur et l'aile, un ton plus soutenu
    ctx.fillStyle = COLOR_PLANE_DEEP;
    ctx.beginPath();
    ctx.moveTo(-28 * s, -2 * s); ctx.lineTo(-44 * s, 6 * s); ctx.lineTo(-30 * s, 7 * s);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8 * s, -2 * s); ctx.lineTo(-14 * s, 15 * s); ctx.lineTo(0, 17 * s); ctx.lineTo(15 * s, 3 * s);
    ctx.closePath(); ctx.fill();
    // le hublot du pilote
    ctx.fillStyle = '#eaf6ff';
    ctx.beginPath(); ctx.arc(22 * s, -6 * s, 6.5 * s, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffd9b0';
    ctx.beginPath(); ctx.arc(22 * s, -7.5 * s, 3.2 * s, 0, TAU); ctx.fill(); // le pilote
    ctx.fillStyle = '#4a3524';
    ctx.beginPath(); ctx.arc(22 * s, -8.6 * s, 3.2 * s, Math.PI, 0); ctx.fill(); // ses cheveux
    ctx.restore();
  }
};
