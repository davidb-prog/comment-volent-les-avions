// La vue de côté — LA vue de l'épisode : la piste, l'herbe, le grand ciel, et
// ton avion rose à poste fixe pendant que le décor défile. DEUX flèches
// accrochées à l'avion : l'air qui pousse en haut (elle grandit avec la
// vitesse) et le poids qui tire en bas (elle ne change jamais). Leur course
// est le « graphe » que l'enfant lit sans savoir lire. Quand l'avion va vite,
// des filets d'air déviés vers le bas s'échappent derrière l'aile : l'aile
// pousse l'air en bas, l'air pousse l'aile en haut.

import { TAU, VITESSE_MAX, ALTITUDE_MAX, POIDS, ALT_ARRONDI, portance,
         borne, borne01,
         COULEUR_AIR, COULEUR_POIDS, COULEUR_AVION, COULEUR_AVION_FONCE,
         COULEUR_FEU, CIEL_HAUT, CIEL_BAS, COULEUR_HERBE, COULEUR_PISTE }
  from './model.js';
import { fitCanvas, label, drawArrow, drawCloud } from './canvas.js';

const PIXELS_PAR_POIDS = 52;  // pixels de flèche pour « un poids d'avion » (échelle 1)
                              // — assez court pour que la flèche du poids et son
                              // étiquette restent lisibles quand l'avion est posé
const FLECHE_MAX = 2.1;       // au-delà, la flèche n'apprend plus rien : on plafonne
const DEFILEMENT = 2.0;       // pixels de décor par unité de distance (échelle 1)

// Le décor qui défile : positions « monde » déterministes, répétées en boucle.
const NUAGES = [
  [0.06, 0.16, 1.1], [0.34, 0.30, 0.8], [0.58, 0.12, 1.3], [0.86, 0.26, 0.9],
];
const FLEURS = [0.08, 0.22, 0.41, 0.55, 0.72, 0.9];
const COULEURS_FLEURS = ['#e0447c', '#6a4fd0', '#ffb54d'];

// Ton avion vu de côté, rond et sympathique, avec son petit pilote — le nez
// vers la droite. Partagé avec « Découvre ton avion » (vue-pieces.js).
// `feu` (0..1) allume la flamme du réacteur, elle suit la vitesse demandée.
export function dessineAvionCote(ctx, x, y, s, assiette, rouesSorties, feu) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(assiette);
  // le réacteur sous l'aile, et sa flamme
  ctx.fillStyle = '#8b93a5';
  ctx.beginPath(); ctx.ellipse(4 * s, 11 * s, 9 * s, 5.5 * s, 0, 0, TAU); ctx.fill();
  if (feu > 0.03) {
    const fl = (6 + 30 * feu) * s;
    const flamme = ctx.createLinearGradient(-5 * s, 0, -5 * s - fl, 0);
    flamme.addColorStop(0, '#ffd166');
    flamme.addColorStop(0.5, '#ff9f1c');
    flamme.addColorStop(1, 'rgba(255, 122, 28, 0)');
    ctx.fillStyle = flamme;
    ctx.beginPath();
    ctx.moveTo(-4 * s, 8 * s);
    ctx.lineTo(-5 * s - fl, 11 * s);
    ctx.lineTo(-4 * s, 14 * s);
    ctx.closePath(); ctx.fill();
  }
  // les roues (sorties près du sol)
  if (rouesSorties) {
    ctx.strokeStyle = COULEUR_AVION_FONCE;
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
  ctx.fillStyle = COULEUR_AVION;
  ctx.beginPath();
  ctx.moveTo(-26 * s, -5 * s);
  ctx.quadraticCurveTo(-36 * s, -24 * s, -44 * s, -24 * s);
  ctx.lineTo(-38 * s, -3 * s);
  ctx.closePath(); ctx.fill();
  // le fuselage
  ctx.beginPath(); ctx.ellipse(0, 0, 40 * s, 12.5 * s, 0, 0, TAU); ctx.fill();
  // le stabilisateur et l'aile, un ton plus soutenu
  ctx.fillStyle = COULEUR_AVION_FONCE;
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

export const VueCote = class {
  constructor(canvas) { this.canvas = canvas; }

  dessine(etat, cible01) {
    const f = fitCanvas(this.canvas);
    const ctx = f.ctx, w = f.w, h = f.h;
    const s = Math.max(0.6, Math.min(w / 640, h / 340));
    const horizon = Math.round(h * 0.76);
    const distance = etat.distance || 0;

    // ---- le grand ciel de jour
    const ciel = ctx.createLinearGradient(0, 0, 0, horizon);
    ciel.addColorStop(0, CIEL_HAUT);
    ciel.addColorStop(1, CIEL_BAS);
    ctx.fillStyle = ciel;
    ctx.fillRect(0, 0, w, horizon);

    // ---- le soleil qui sourit, dans son coin
    this.soleil(ctx, w - 52 * s, 40 * s, 17 * s);

    // ---- les nuages (parallaxe douce : ils sont loin)
    const defileNuages = distance * DEFILEMENT * s * 0.4;
    for (const n of NUAGES) {
      const largeur = w + 140 * s;
      const x = ((n[0] * largeur - defileNuages) % largeur + largeur) % largeur - 70 * s;
      drawCloud(ctx, x, n[1] * horizon + 8, n[2] * s, 0.92);
    }

    // ---- l'herbe et la piste (le sol défile sous l'avion)
    ctx.fillStyle = COULEUR_HERBE;
    ctx.fillRect(0, horizon, w, h - horizon);
    const hPiste = Math.max(12, h * 0.085);
    ctx.fillStyle = COULEUR_PISTE;
    ctx.fillRect(0, horizon, w, hPiste);
    const defileSol = distance * DEFILEMENT * s;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(2, 3 * s);
    ctx.setLineDash([18 * s, 20 * s]);
    ctx.lineDashOffset = defileSol % (38 * s);
    ctx.beginPath();
    ctx.moveTo(0, horizon + hPiste * 0.55);
    ctx.lineTo(w, horizon + hPiste * 0.55);
    ctx.stroke();
    ctx.setLineDash([]);
    // quelques fleurs sur l'herbe
    const largeurSol = w + 40 * s;
    for (let i = 0; i < FLEURS.length; i++) {
      const x = ((FLEURS[i] * largeurSol - defileSol) % largeurSol + largeurSol) % largeurSol - 20 * s;
      this.fleur(ctx, x,
        horizon + hPiste + (h - horizon - hPiste) * (0.35 + 0.4 * ((i * 37) % 10) / 10),
        s, COULEURS_FLEURS[i % COULEURS_FLEURS.length]);
    }

    // ---- la place de l'avion à l'écran (à poste fixe : le décor bouge, pas lui)
    const px = w * 0.44;
    const yRoues = horizon + 2 * s;
    const ySol = yRoues - 15 * s;
    const yHaut = h * 0.17;
    const py = ySol - borne01(etat.alt / ALTITUDE_MAX) * (ySol - yHaut);
    const assiette = etat.auSol ? 0 : borne(-Math.atan2(etat.vz, 26), -0.42, 0.42);

    // ---- l'ombre de l'avion sur le sol, quand il est bas
    const kOmbre = borne01(1 - etat.alt / 26);
    if (kOmbre > 0) {
      ctx.fillStyle = 'rgba(28, 53, 80, ' + (0.22 * kOmbre) + ')';
      ctx.beginPath();
      ctx.ellipse(px, horizon + hPiste * 0.5, (34 + 14 * (1 - kOmbre)) * s, 5 * s, 0, 0, TAU);
      ctx.fill();
    }

    // ---- les petits traits de vitesse derrière l'avion
    const kV = borne01(etat.v / VITESSE_MAX);
    if (kV > 0.12) {
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.5 * kV) + ')';
      ctx.lineWidth = 3 * s;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const yy = py + (i - 1) * 12 * s;
        const ll = (18 + 26 * kV) * s;
        ctx.beginPath();
        ctx.moveTo(px - 52 * s - ll, yy);
        ctx.lineTo(px - 52 * s - ll * 0.35, yy);
        ctx.stroke();
      }
    }

    // ---- l'air dévié vers le bas derrière l'aile : la CAUSE de la portance.
    //      L'aile pousse l'air en bas… alors l'air pousse l'aile en haut.
    if (kV > 0.2) {
      ctx.strokeStyle = 'rgba(11, 138, 114, ' + (0.55 * kV) + ')';
      ctx.lineWidth = 2.6 * s;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const x0 = px - (18 + i * 13) * s;
        const y0 = py + (17 + i * 3) * s;
        const ll = (10 + 16 * kV) * s;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 - ll * 0.8, y0 + ll * 0.55);
        ctx.stroke();
      }
    }

    // ---- ton avion (et son pilote) — la flamme suit la consigne du curseur
    dessineAvionCote(ctx, px, py, s, assiette,
      etat.auSol || etat.alt < ALT_ARRONDI, cible01 || 0);

    // ---- LES DEUX FLÈCHES : l'air qui pousse en haut, le poids qui tire en bas
    const echelle = PIXELS_PAR_POIDS * s;
    const lAir = Math.min(portance(etat.v), FLECHE_MAX) * echelle;
    const lPoids = POIDS * echelle;
    const largeur = 10 * s;
    drawArrow(ctx, px + 2 * s, py - 20 * s, -Math.PI / 2, lAir, COULEUR_AIR, largeur);
    drawArrow(ctx, px + 2 * s, py + 16 * s, Math.PI / 2, lPoids, COULEUR_POIDS, largeur);
    if (lAir > 14) {
      label(ctx, 'l’air pousse', px + 2 * s, py - 24 * s - lAir - 10 * s,
        { align: 'center', size: 14 * s, color: COULEUR_AIR, clampW: w, clampH: h });
    }
    label(ctx, 'le poids tire', px + 2 * s, py + 20 * s + lPoids + 11 * s,
      { align: 'center', size: 14 * s, color: COULEUR_POIDS, clampW: w, clampH: h });

    this.geometrie = { w: w, h: h, s: s, horizon: horizon, px: px, py: py };
  }

  soleil(ctx, x, y, r) {
    const halo = ctx.createRadialGradient(x, y, 1, x, y, r * 2.4);
    halo.addColorStop(0, '#ffe9a8');
    halo.addColorStop(0.5, 'rgba(255, 214, 110, 0.5)');
    halo.addColorStop(1, 'rgba(255, 214, 110, 0)');
    ctx.fillStyle = halo;
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

  fleur(ctx, x, y, s, couleur) {
    ctx.strokeStyle = '#3f7d4d';
    ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 8 * s); ctx.stroke();
    ctx.fillStyle = couleur;
    for (let i = 0; i < 5; i++) {
      const a = i * TAU / 5;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * 3.2 * s, y - 8 * s + Math.sin(a) * 3.2 * s, 2 * s, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#fff7d6';
    ctx.beginPath(); ctx.arc(x, y - 8 * s, 1.7 * s, 0, TAU); ctx.fill();
  }
};
