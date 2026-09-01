// « Découvre ton avion » : ton avion en grand, posé sous le ciel, avec une
// pastille tapotable sur chaque pièce (ailes, réacteur, cockpit, queue,
// roues). Le dessin vient de vue-cote.js (dessineAvionCote) — même avion
// partout. Les pastilles sont de vrais boutons HTML (accessibles),
// positionnés par main.js grâce à `geometrie` et aux ancres ANCRES_PIECES.

import { TAU, CIEL_HAUT, CIEL_BAS, COULEUR_HERBE, COULEUR_PISTE, PIECES }
  from './model.js';
import { fitCanvas } from './canvas.js';
import { dessineAvionCote } from './vue-cote.js';

// L'ancre de chaque pastille, en unités « avion » (le nez vers la droite,
// mêmes coordonnées que dessineAvionCote) — bien écartées les unes des
// autres pour que chaque pièce se distingue (retour de David) : [x, y].
export const ANCRES_PIECES = {
  ailes: [-17, 11],
  reacteurs: [12, 14],
  cockpit: [28, -12],
  queue: [-37, -16],
  roues: [-9, 19],
};

export const VuePieces = class {
  constructor(canvas) {
    this.canvas = canvas;
    this.choisie = null; // l'id de la pièce choisie (anneau de mise en avant)
    this.geometrie = null;
  }

  dessine(maintenantMs) {
    const f = fitCanvas(this.canvas);
    const ctx = f.ctx, w = f.w, h = f.h;
    // l'avion s'étale de −45 à +41 en x, −27 à +21 en y : cadré serré pour
    // que les pièces soient grandes et les pastilles bien séparées
    const s = Math.min(w / 108, h / 66);
    const px = w * 0.52, py = h * 0.46;

    // le même grand ciel de jour que la vue de côté, la piste dessous
    const horizon = py + 20 * s;
    const ciel = ctx.createLinearGradient(0, 0, 0, horizon);
    ciel.addColorStop(0, CIEL_HAUT);
    ciel.addColorStop(1, CIEL_BAS);
    ctx.fillStyle = ciel;
    ctx.fillRect(0, 0, w, horizon);
    ctx.fillStyle = COULEUR_HERBE;
    ctx.fillRect(0, horizon, w, h - horizon);
    ctx.fillStyle = COULEUR_PISTE;
    ctx.fillRect(0, horizon, w, Math.min(10 * s, h - horizon));

    dessineAvionCote(ctx, px, py, s, 0, true, 0);

    // l'anneau qui respire autour de la pastille choisie — la pastille, pas la
    // pièce entière : sinon il englobe les voisines et on ne sait plus qui parle
    if (this.choisie && ANCRES_PIECES[this.choisie]) {
      const ancre = ANCRES_PIECES[this.choisie];
      let couleur = '#1c3550';
      for (const p of PIECES) { if (p.id === this.choisie) couleur = p.couleur; }
      const souffle = 1 + 0.1 * Math.sin((maintenantMs || 0) / 260);
      const rayon = Math.max(30, 3.4 * s) * souffle;
      ctx.strokeStyle = couleur;
      ctx.lineWidth = 3.5;
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      ctx.arc(px + ancre[0] * s, py + ancre[1] * s, rayon, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    this.geometrie = { w: w, h: h, s: s, px: px, py: py };
  }

  // Position CSS (en pixels dans le cadre) de la pastille d'une pièce.
  ancreDe(id) {
    if (!this.geometrie || !ANCRES_PIECES[id]) return null;
    const g = this.geometrie;
    return { x: g.px + ANCRES_PIECES[id][0] * g.s, y: g.py + ANCRES_PIECES[id][1] * g.s };
  }
};
