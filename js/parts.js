// La vue « Découvre ton avion » : ton avion en grand, posé sous le ciel, avec
// une pastille tapotable sur chaque pièce (ailes, réacteur, cockpit, queue,
// roues). Le dessin vient de side.js (drawPlaneSide) — même avion partout.
// Les pastilles sont de vrais boutons HTML (accessibles), positionnés par
// main.js grâce à `layout` et aux ancres PART_SPOTS ci-dessous.

import { TAU, SKY_TOP, SKY_BOTTOM, COLOR_GRASS, COLOR_RUNWAY,
         PARTS } from './model.js';
import { fitCanvas } from './canvas.js';
import { drawPlaneSide } from './side.js';

// L'ancre de chaque pastille, en unités « avion » (le nez vers la droite,
// mêmes coordonnées que drawPlaneSide) : [x, y].
export const PART_SPOTS = {
  ailes: [-12, 12],
  reacteurs: [6, 14],
  cockpit: [22, -8],
  queue: [-38, -17],
  roues: [16, 16],
};

export const PartsView = class {
  constructor(canvas) {
    this.canvas = canvas;
    this.selected = null; // l'id de la pièce choisie (anneau de mise en avant)
    this.layout = null;
  }

  draw(nowMs) {
    const f = fitCanvas(this.canvas);
    const ctx = f.ctx, w = f.w, h = f.h;
    // l'avion s'étale de −44 à +40 en x, −24 à +19 en y : on cadre large pour
    // laisser la place aux pastilles tout autour
    const s = Math.min(w / 125, h / 72);
    const px = w * 0.52, py = h * 0.5;

    // le même grand ciel de jour que la vue de côté, la piste dessous
    const horizon = py + 17 * s;
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, SKY_TOP);
    g.addColorStop(1, SKY_BOTTOM);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, horizon);
    ctx.fillStyle = COLOR_GRASS;
    ctx.fillRect(0, horizon, w, h - horizon);
    ctx.fillStyle = COLOR_RUNWAY;
    ctx.fillRect(0, horizon, w, Math.min(10 * s, h - horizon));

    drawPlaneSide(ctx, px, py, s, 0, true, 0);

    // l'anneau qui respire autour de la pièce choisie
    if (this.selected && PART_SPOTS[this.selected]) {
      const spot = PART_SPOTS[this.selected];
      let color = '#1c3550';
      for (const p of PARTS) { if (p.id === this.selected) color = p.color; }
      const pulse = 1 + 0.1 * Math.sin((nowMs || 0) / 260);
      // un anneau juste autour de la pastille (44 px CSS) — pas de la pièce
      // entière : sinon il englobe les voisines et on ne sait plus qui parle
      const ring = Math.max(30, 3.4 * s) * pulse;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      ctx.arc(px + spot[0] * s, py + spot[1] * s, ring, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    this.layout = { w: w, h: h, s: s, px: px, py: py };
  }

  // Position CSS (en pixels dans le cadre) de la pastille d'une pièce.
  spotAt(id) {
    if (!this.layout || !PART_SPOTS[id]) return null;
    const l = this.layout;
    return {
      x: l.px + PART_SPOTS[id][0] * l.s,
      y: l.py + PART_SPOTS[id][1] * l.s,
    };
  }
};
