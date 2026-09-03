// La vue de côté — LA vue de l'épisode : la piste, l'herbe, le grand ciel, et
// ton avion rose à poste fixe pendant que le décor défile. DEUX flèches
// accrochées à l'avion : l'air qui pousse en haut (elle grandit avec la
// vitesse) et le poids qui tire en bas (elle ne change jamais). Leur course
// est le « graphe » que l'enfant lit sans savoir lire. Quand l'avion va vite,
// des filets d'air déviés vers le bas s'échappent derrière l'aile : l'aile
// pousse l'air en bas, l'air pousse l'aile en haut.

import { TAU, VITESSE_MAX, ALTITUDE_MAX, POIDS, ALT_ARRONDI, portanceEnVol,
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
// Feuille blanche 2026-09-03 (retour de David : « le nez n'est pas ajusté
// sur la carlingue ») : le fuselage est UNE seule silhouette continue en
// courbes de Bézier — toit, front arrondi, menton du nez, ventre, effilement
// de queue — plus aucune forme rapportée qui laisse un raccord visible.
// `feu` (0..1) allume la flamme.
export function dessineAvionCote(ctx, x, y, s, assiette, rouesSorties, feu) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(assiette);
  // les trains d'atterrissage (sortis près du sol) : roulette de nez + boggie
  // principal à roues JUMELÉES sous l'aile — pneus sombres, moyeux clairs,
  // pour que « les roues » ne se confondent jamais avec l'entrée d'air du
  // réacteur (retour de David 2026-09-03)
  if (rouesSorties) {
    ctx.strokeStyle = COULEUR_AVION_FONCE;
    ctx.lineWidth = 2.4 * s;
    ctx.beginPath();
    ctx.moveTo(27 * s, 7 * s); ctx.lineTo(28 * s, 15 * s);
    ctx.moveTo(-10 * s, 10 * s); ctx.lineTo(-11 * s, 17 * s);
    ctx.stroke();
    ctx.fillStyle = '#2c3a4c';
    ctx.beginPath(); ctx.arc(28 * s, 17.8 * s, 3.2 * s, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-13.5 * s, 18 * s, 4 * s, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-8.5 * s, 18 * s, 4 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = '#cfd8e4';
    ctx.beginPath(); ctx.arc(28 * s, 17.8 * s, 1.2 * s, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-13.5 * s, 18 * s, 1.5 * s, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-8.5 * s, 18 * s, 1.5 * s, 0, TAU); ctx.fill();
  }
  // la dérive (queue), derrière — bout arrondi + trait de gouvernail ; sa
  // racine plonge dans le fuselage, dessiné par-dessus : aucun raccord
  ctx.fillStyle = COULEUR_AVION;
  ctx.beginPath();
  ctx.moveTo(-25 * s, -4 * s);
  ctx.quadraticCurveTo(-30 * s, -24 * s, -37.5 * s, -26.5 * s);
  ctx.quadraticCurveTo(-42 * s, -27.5 * s, -41.5 * s, -23 * s);
  ctx.quadraticCurveTo(-40 * s, -12 * s, -36 * s, -1 * s);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = COULEUR_AVION_FONCE;
  ctx.lineWidth = 1.4 * s;
  ctx.beginPath(); ctx.moveTo(-36.5 * s, -24 * s); ctx.lineTo(-34 * s, -7 * s); ctx.stroke();
  // le stabilisateur, sous la queue
  ctx.fillStyle = COULEUR_AVION_FONCE;
  ctx.beginPath();
  ctx.moveTo(-25 * s, -2 * s); ctx.lineTo(-43 * s, 5 * s); ctx.lineTo(-28 * s, 6.5 * s);
  ctx.closePath(); ctx.fill();
  // LE FUSELAGE : une seule silhouette fermée — le toit file vers le front qui
  // s'arrondit, la pointe du nez redescend en menton doux, le ventre remonte
  // en s'effilant jusqu'au petit cône de queue arrondi
  ctx.fillStyle = COULEUR_AVION;
  ctx.beginPath();
  ctx.moveTo(-32 * s, -7.2 * s);
  ctx.bezierCurveTo(-12 * s, -9.9 * s, 8 * s, -9.9 * s, 24 * s, -8.6 * s);   // le toit
  ctx.bezierCurveTo(33 * s, -7.9 * s, 39.5 * s, -5.4 * s, 41 * s, -1.6 * s); // le front
  ctx.bezierCurveTo(42 * s, 1.2 * s, 40.2 * s, 4.6 * s, 36.5 * s, 6.4 * s);  // le menton
  ctx.bezierCurveTo(28 * s, 8.8 * s, 6 * s, 9.8 * s, -14 * s, 8.6 * s);      // le ventre
  ctx.bezierCurveTo(-26 * s, 7.6 * s, -36 * s, 4.4 * s, -41 * s, 0.6 * s);   // l'effilement
  ctx.bezierCurveTo(-42.6 * s, -0.7 * s, -42.3 * s, -2.5 * s, -40.5 * s, -3.3 * s); // le cône de queue
  ctx.bezierCurveTo(-38 * s, -4.5 * s, -35.5 * s, -6.4 * s, -32 * s, -7.2 * s);
  ctx.closePath(); ctx.fill();
  // l'ombre du ventre : un croissant qui suit la MÊME courbe que la silhouette
  ctx.fillStyle = 'rgba(28, 53, 80, 0.10)';
  ctx.beginPath();
  ctx.moveTo(35 * s, 5.8 * s);
  ctx.bezierCurveTo(27 * s, 8.2 * s, 5 * s, 9.2 * s, -14 * s, 8.0 * s);
  ctx.bezierCurveTo(-26 * s, 7.0 * s, -35.5 * s, 3.9 * s, -40.2 * s, 0.4 * s);
  ctx.bezierCurveTo(-34.5 * s, 3.0 * s, -25 * s, 5.4 * s, -14 * s, 6.2 * s);
  ctx.bezierCurveTo(5 * s, 7.4 * s, 27 * s, 6.2 * s, 35 * s, 5.8 * s);
  ctx.closePath(); ctx.fill();
  // le reflet du nez : un trait de lumière qui épouse le front — on VOIT que
  // le nez et la carlingue ne font qu'un
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.7 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(25 * s, -7.2 * s);
  ctx.quadraticCurveTo(34 * s, -6.2 * s, 38.6 * s, -2.6 * s);
  ctx.stroke();
  // trois hublots ronds, au-dessus de l'aile
  ctx.fillStyle = '#eaf6ff';
  for (const hx of [9, 0, -9]) {
    ctx.beginPath(); ctx.arc(hx * s, -4 * s, 1.8 * s, 0, TAU); ctx.fill();
  }
  // la bulle du cockpit, posée en douceur sur le toit, avec son petit pilote
  ctx.fillStyle = '#eaf6ff';
  ctx.beginPath(); ctx.arc(20 * s, -8.9 * s, 5.8 * s, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#ffd9b0';
  ctx.beginPath(); ctx.arc(19.5 * s, -10 * s, 2.9 * s, 0, TAU); ctx.fill(); // le pilote
  ctx.fillStyle = '#4a3524';
  ctx.beginPath(); ctx.arc(19.5 * s, -11 * s, 2.9 * s, Math.PI, 0); ctx.fill(); // ses cheveux
  // LA GRANDE AILE : un trapèze en flèche aux coins doux, emplanture claire
  // et ligne de volet — par-dessus le fuselage
  ctx.fillStyle = COULEUR_AVION_FONCE;
  ctx.beginPath();
  ctx.moveTo(14 * s, 0);
  ctx.quadraticCurveTo(0, 8 * s, -13 * s, 16 * s);
  ctx.quadraticCurveTo(-22 * s, 17.5 * s, -29.5 * s, 15.5 * s);
  ctx.quadraticCurveTo(-30.5 * s, 14.5 * s, -28 * s, 12.5 * s);
  ctx.quadraticCurveTo(-16 * s, 5 * s, -6 * s, -1 * s);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'; // le bord d'attaque qui brille
  ctx.lineWidth = 1.4 * s;
  ctx.beginPath();
  ctx.moveTo(12 * s, 0.5 * s);
  ctx.quadraticCurveTo(-1 * s, 8 * s, -27 * s, 14.8 * s);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(28, 53, 80, 0.28)'; // la ligne du volet
  ctx.lineWidth = 1.1 * s;
  ctx.beginPath(); ctx.moveTo(-9 * s, 3.5 * s); ctx.lineTo(-25 * s, 13 * s); ctx.stroke();
  // le réacteur suspendu SOUS L'AILE (pylône accroché à l'intrados, comme sur
  // un vrai avion de ligne — retour de David 2026-09-03 : il flottait devant
  // l'aile, à la place des roues) : nacelle allongée, lèvre claire, entrée
  // d'air en fine ellipse de profil (surtout PAS un disque à moyeu, qui se
  // lisait comme une roue), tuyère et flamme à l'arrière
  ctx.fillStyle = COULEUR_AVION_FONCE;
  ctx.fillRect(2 * s, 5 * s, 4.5 * s, 6.5 * s); // le pylône, sous l'aile
  if (feu > 0.03) {
    const fl = (6 + 30 * feu) * s;
    const flamme = ctx.createLinearGradient(-4 * s, 0, -4 * s - fl, 0);
    flamme.addColorStop(0, '#ffd166');
    flamme.addColorStop(0.5, '#ff9f1c');
    flamme.addColorStop(1, 'rgba(255, 122, 28, 0)');
    ctx.fillStyle = flamme;
    ctx.beginPath();
    ctx.moveTo(-3 * s, 13 * s);
    ctx.lineTo(-4 * s - fl, 15 * s);
    ctx.lineTo(-3 * s, 17 * s);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#6e7b90'; // la tuyère, à l'arrière
  ctx.beginPath();
  ctx.moveTo(-1 * s, 12 * s); ctx.lineTo(-4.5 * s, 13.5 * s);
  ctx.lineTo(-4.5 * s, 16.5 * s); ctx.lineTo(-1 * s, 18 * s);
  ctx.closePath(); ctx.fill();
  const nacelle = ctx.createLinearGradient(0, 10.5 * s, 0, 19.5 * s); // la nacelle
  nacelle.addColorStop(0, '#aab6c9');
  nacelle.addColorStop(0.5, '#8b93a5');
  nacelle.addColorStop(1, '#727e93');
  ctx.fillStyle = nacelle;
  ctx.beginPath(); ctx.ellipse(4.5 * s, 15 * s, 8 * s, 4.4 * s, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e6edf5'; // la lèvre de l'entrée d'air, à l'avant
  ctx.beginPath(); ctx.ellipse(11.6 * s, 15 * s, 1.9 * s, 4.2 * s, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#33475c'; // l'ouverture, vue de profil : une fine ellipse
  ctx.beginPath(); ctx.ellipse(12 * s, 15 * s, 1 * s, 3.3 * s, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

// Les invités du jeu « Rejoins-les là-haut ! » — dessinés dans le langage de
// l'avion (jamais d'emoji en illustration, règle de la charte). `oscille` :
// un petit balancement (0 si mouvement réduit) ; `gagne` : des étincelles.
export function dessineInvite(ctx, id, x, y, s, oscille, gagne) {
  ctx.save();
  // gagné : l'invité sautille de joie (plus vite, plus haut)
  const saut = gagne ? Math.sin(oscille * 2.4) * 7 * s : Math.sin(oscille) * 4 * s;
  ctx.translate(x, y + saut);
  if (id === 'ballon') {
    ctx.strokeStyle = 'rgba(28, 53, 80, 0.55)'; // la ficelle
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.moveTo(0, 13 * s);
    ctx.quadraticCurveTo(3 * s, 22 * s, -1 * s, 30 * s);
    ctx.stroke();
    ctx.fillStyle = '#e0447c';
    ctx.beginPath(); ctx.ellipse(0, 0, 10 * s, 12 * s, 0, 0, TAU); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-2.5 * s, 12 * s); ctx.lineTo(2.5 * s, 12 * s); ctx.lineTo(0, 15 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // le reflet
    ctx.beginPath(); ctx.ellipse(-3.5 * s, -4 * s, 2.6 * s, 4 * s, -0.4, 0, TAU); ctx.fill();
  } else if (id === 'montgolfiere') {
    ctx.fillStyle = '#ffb54d'; // l'enveloppe
    ctx.beginPath(); ctx.ellipse(0, 0, 13 * s, 15 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e0447c'; // les fuseaux
    for (const fx of [-6, 0, 6]) {
      ctx.beginPath(); ctx.ellipse(fx * s, 0, 2.6 * s, 14.6 * s, 0, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(28, 53, 80, 0.55)'; // les cordes
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(-7 * s, 12 * s); ctx.lineTo(-4 * s, 22 * s);
    ctx.moveTo(7 * s, 12 * s); ctx.lineTo(4 * s, 22 * s);
    ctx.stroke();
    ctx.fillStyle = '#a06f00'; // la nacelle
    ctx.fillRect(-5 * s, 22 * s, 10 * s, 7 * s);
  } else if (id === 'aigle') {
    ctx.fillStyle = '#7a5230';
    ctx.beginPath(); // le corps
    ctx.ellipse(0, 0, 8 * s, 3.2 * s, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#7a5230'; // les grandes ailes déployées
    ctx.lineWidth = 3.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2 * s, -1 * s);
    ctx.quadraticCurveTo(-12 * s, -10 * s, -20 * s, -7 * s);
    ctx.moveTo(2 * s, -1 * s);
    ctx.quadraticCurveTo(12 * s, -10 * s, 20 * s, -7 * s);
    ctx.stroke();
    ctx.fillStyle = '#ffd166'; // le bec
    ctx.beginPath();
    ctx.moveTo(8 * s, -1 * s); ctx.lineTo(11.5 * s, 0.5 * s); ctx.lineTo(8 * s, 1.5 * s);
    ctx.closePath(); ctx.fill();
  } else if (id === 'papillon') {
    ctx.fillStyle = '#a98bff'; // les ailes hautes
    ctx.beginPath(); ctx.ellipse(-3.5 * s, -3 * s, 4.5 * s, 5.5 * s, -0.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3.5 * s, -3 * s, 4.5 * s, 5.5 * s, 0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff6b9d'; // les ailes basses
    ctx.beginPath(); ctx.ellipse(-2.8 * s, 2.5 * s, 3.2 * s, 4 * s, 0.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(2.8 * s, 2.5 * s, 3.2 * s, 4 * s, -0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#33475c'; // le corps
    ctx.beginPath(); ctx.ellipse(0, 0, 1.3 * s, 5 * s, 0, 0, TAU); ctx.fill();
  }
  if (gagne) {
    // les étoiles du bravo : grandes, qui scintillent — la victoire se VOIT
    // (retour de David : les petites étincelles passaient inaperçues)
    ctx.fillStyle = '#ffcf5c';
    const etoiles = [[-24, -20, 5], [26, -14, 4], [18, 20, 4.5], [-22, 16, 3.8], [2, -27, 4.2], [30, 4, 3.4]];
    for (let i = 0; i < etoiles.length; i++) {
      const e = etoiles[i];
      const r = e[2] * s * (0.75 + 0.35 * Math.sin(oscille * 3 + i * 1.7));
      ctx.beginPath();
      ctx.moveTo(e[0] * s, e[1] * s - r);
      ctx.quadraticCurveTo(e[0] * s, e[1] * s, e[0] * s + r, e[1] * s);
      ctx.quadraticCurveTo(e[0] * s, e[1] * s, e[0] * s, e[1] * s + r);
      ctx.quadraticCurveTo(e[0] * s, e[1] * s, e[0] * s - r, e[1] * s);
      ctx.quadraticCurveTo(e[0] * s, e[1] * s, e[0] * s, e[1] * s - r);
      ctx.fill();
    }
  }
  ctx.restore();
}

export const VueCote = class {
  constructor(canvas) { this.canvas = canvas; }

  // `invite` : l'invité du jeu ({ id, altitude, gagne }) ou null ;
  // `oscille` : phase du petit balancement (0 si mouvement réduit).
  dessine(etat, cible01, invite, oscille) {
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
    const ySol = yRoues - 17.5 * s; // les roues (bas du boggie : 22 unités) posées sur la piste
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

    // ---- l'invité du jeu, qui attend à SON altitude côté droit du ciel
    // (à 0.7·largeur : jamais dans le halo du soleil, où ses étoiles de
    // bravo se noyaient — retour de David)
    if (invite) {
      const xInvite = w * 0.7;
      const yInvite = invite.altitude === 0
        ? horizon + hPiste + (h - horizon - hPiste) * 0.4 - 6 * s // le papillon, près des fleurs
        : ySol - borne01(invite.altitude / ALTITUDE_MAX) * (ySol - yHaut);
      dessineInvite(ctx, invite.id, xInvite, yInvite, s, oscille || 0, invite.gagne);
    }

    // ---- ton avion (et son pilote) — la flamme suit la consigne du curseur
    dessineAvionCote(ctx, px, py, s, assiette,
      etat.auSol || etat.alt < ALT_ARRONDI, cible01 || 0);

    // ---- LES DEUX FLÈCHES : l'air qui pousse en haut, le poids qui tire en
    // bas. La verte dessine la portance RESSENTIE (l'air raréfié là-haut porte
    // moins) : en palier, à toute altitude, les deux flèches sont égales.
    const echelle = PIXELS_PAR_POIDS * s;
    const lAirVoulu = Math.min(portanceEnVol(etat.v, etat.alt), FLECHE_MAX) * echelle;
    // près du haut du ciel, la place manque : les DEUX flèches rétrécissent du
    // même facteur — leur rapport (la seule chose qu'on lit) reste exact.
    // Jamais l'une écrasée sans l'autre : ce serait mentir sur les forces.
    const place = Math.max(28 * s, py - 30 * s);
    const k = Math.min(1, place / Math.max(lAirVoulu, 1));
    const lAir = lAirVoulu * k;
    const lPoids = POIDS * echelle * k;
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
