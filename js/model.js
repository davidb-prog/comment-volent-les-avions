// Modèle pur de « Comment volent les avions ? » — aucun accès DOM, testable sous Node.
//
// L'épisode tient dans UNE idée : l'air est costaud — quand l'avion va vite,
// l'air le porte. Pas de vitesse, pas d'envol. Et dans UN geste : le grand
// curseur de vitesse. Tout le reste découle de la vitesse :
// - la portance grandit avec la vitesse (∝ v²) : nulle à l'arrêt, égale au
//   poids pile à VITESSE_DECOLLAGE, plus forte au-delà — l'avion décolle ;
// - vitesse réduite : la portance faiblit, l'avion descend doucement (il
//   PLANE, il ne tombe pas), et près du sol l'arrondi automatique garantit un
//   toucher toujours doux — JAMAIS PUNITIF ;
// - tout en haut, un plafond doux : l'air trop léger ne porte plus assez.
//
// Le site ne dessine que DEUX flèches (l'air qui pousse en haut, le poids qui
// tire en bas) : la course de ces deux flèches EST l'histoire. La poussée et
// la traînée existent bien sûr — elles vivent dans la note aux parents, et
// auront leur épisode. Ces licences sont documentées (note aux parents + README).
//
// Unités du site : le poids vaut 1 (étalon des flèches) ; vitesse dans
// [0, VITESSE_MAX] ; altitude dans [0, ALTITUDE_MAX] ; le temps en secondes.

export const TAU = Math.PI * 2;

export function borne(v, mini, maxi) { return Math.max(mini, Math.min(maxi, v)); }
export function borne01(v) { return borne(v, 0, 1); }

// ------------------------------------------------------------------ les constantes
export const VITESSE_MAX = 100;      // le curseur à fond (unités du site)
export const VITESSE_DECOLLAGE = 55; // portance = poids pile à cette vitesse
export const POIDS = 1;              // le poids, étalon des deux flèches

export const ACCELERATION = 11;      // (unités de vitesse / s) quand on pousse
export const DECELERATION = 9;       // quand on réduit (l'air freine, les freins au sol)

export const ALTITUDE_MAX = 100;     // le haut du ciel dessiné
export const VZ_MONTEE_MAX = 12;     // montée maxi (unités d'altitude / s)
export const VZ_DESCENTE_MAX = 7;    // descente maxi loin du sol : on plane, on ne tombe pas
export const VZ_SOL = 2.5;           // descente maxi au ras du sol : le toucher est doux
export const ALT_ARRONDI = 8;        // sous cette altitude, l'arrondi automatique s'installe
export const GAIN_VZ = 2.2;          // excès de portance → vitesse verticale visée
export const REPONSE_VZ = 1.8;       // souplesse de la réponse verticale (1/s)

// Un avion ne s'arrête pas en l'air : en vol, la vitesse ne descend pas sous
// ce plancher (il garde de l'élan et plane) — on ne freine qu'une fois posé.
export const VITESSE_PLANE = 40;

// L'air se raréfie avec l'altitude : au-dessus d'ALT_AIR_LEGER, il porte de
// moins en moins (jusqu'à DENSITE_PLAFOND tout en haut). C'est ce qui donne à
// chaque vitesse SON altitude de croisière — là où l'air aminci porte pile le
// poids — et ce qui empêche de monter sans fin (le vrai plafond des avions).
export const ALT_AIR_LEGER = 50;
export const DENSITE_PLAFOND = 0.29;

export const KMH_PAR_UNITE = 4;      // affichage parent : v = 55 → « 220 km/h »
export const METRES_PAR_UNITE = 40;  // affichage parent : alt = 100 → « 4 000 m »

// Le grand curseur : la fraction où l'avion s'envole (le repère « ✨ »)
export const REPERE_DECOLLAGE = VITESSE_DECOLLAGE / VITESSE_MAX;

// La lecture automatique : un tour complet (décollage → vol → atterrissage)
export const TOUR_DUREE = 85; // secondes — la respiration de la famille (~80-90 s)

// Couleurs sémantiques — constantes partout (flèches, textes, boutons, histoires).
// Palette « Grand ciel de jour » choisie par David : la page EST le ciel.
export const COULEUR_AIR = '#0b8a72';        // l'air costaud qui pousse en haut (la portance)
export const COULEUR_POIDS = '#6a4fd0';      // le poids : la Terre qui tire en bas
export const COULEUR_AVION = '#ff6b9d';      // ton avion (le rose « chez toi » de la série)
export const COULEUR_AVION_FONCE = '#d94f80';// l'aile et les ombres de l'avion
export const COULEUR_FEU = '#d86f00';        // la flamme du réacteur, les accents chauds
export const CIEL_HAUT = '#7dc2f0';          // le ciel de la scène, en haut
export const CIEL_BAS = '#d9eefc';           // le ciel à l'horizon
export const COULEUR_HERBE = '#69b06e';
export const COULEUR_PISTE = '#5c6a78';

// ------------------------------------------------------------------ la physique
// La portance : la poussée de l'air vers le haut, en « poids d'avion ».
// ∝ v² — nulle à l'arrêt, égale au poids pile à VITESSE_DECOLLAGE.
export function portance(v) {
  const k = v / VITESSE_DECOLLAGE;
  return POIDS * k * k;
}

// Plafond de descente selon l'altitude : VZ_DESCENTE_MAX en l'air, VZ_SOL au
// ras du sol — l'arrondi automatique qui garantit un toucher toujours doux.
export function plafondDescente(alt) {
  return VZ_SOL + (VZ_DESCENTE_MAX - VZ_SOL) * borne01(alt / ALT_ARRONDI);
}

// La densité de l'air : pleine en bas, raréfiée en haut du ciel dessiné.
export function densiteAir(alt) {
  return 1 - (1 - DENSITE_PLAFOND) *
    borne01((alt - ALT_AIR_LEGER) / (ALTITUDE_MAX - ALT_AIR_LEGER));
}

// La portance que l'avion SENT (et que la flèche verte dessine) : la poussée
// de l'air, affaiblie là-haut par l'air raréfié. En palier, elle vaut le
// poids — les deux flèches égales, à toute altitude d'équilibre.
export function portanceEnVol(v, alt) {
  return portance(v) * densiteAir(alt);
}

// ------------------------------------------------------------------ l'état
export function etatInitial() {
  return { v: 0, alt: 0, vz: 0, auSol: true, distance: 0 };
}

// Un pas de simulation — pur : rend un NOUVEL état, ne touche à rien.
// `cible01` est la position du grand curseur (0 = arrêt, 1 = plein vol).
export function pas(etat, cible01, dt) {
  const e = etat;
  // en vol, la vitesse ne descend jamais sous le plancher du plané : un avion
  // ne s'arrête pas en l'air — il garde de l'élan jusqu'à la piste
  const plancher = e.auSol ? 0 : VITESSE_PLANE;
  const vCible = Math.max(borne01(cible01) * VITESSE_MAX, plancher);
  const n = { v: e.v, alt: e.alt, vz: e.vz, auSol: e.auSol, distance: e.distance };

  // --- la vitesse glisse vers la consigne du curseur, en douceur
  const ecart = vCible - e.v;
  const pasV = ecart >= 0 ? Math.min(ecart, ACCELERATION * dt)
                          : Math.max(ecart, -DECELERATION * dt);
  n.v = borne(e.v + pasV, 0, VITESSE_MAX);
  n.distance = e.distance + n.v * dt; // fait défiler le décor

  if (e.auSol) {
    n.alt = 0;
    n.vz = 0;
    // décollage : la portance atteint le poids — l'air soulève l'avion
    // (epsilon : à la vitesse pile, (v/V)² vaut 1.0 exactement, on décolle)
    if (portance(n.v) >= POIDS - 1e-9 && n.v >= VITESSE_DECOLLAGE - 1e-9) {
      n.auSol = false;
      n.vz = 0.5;
    }
  } else {
    // --- la verticale : l'excès de portance fait monter, le manque fait
    // descendre. Là-haut, l'air raréfié porte moins : l'avion s'arrête de
    // monter tout seul à l'altitude où l'air porte pile son poids.
    const p = portanceEnVol(n.v, e.alt);
    let vzCible = VZ_MONTEE_MAX * borne((p - POIDS) * GAIN_VZ, -1, 1);
    vzCible = Math.max(vzCible, -plafondDescente(e.alt)); // l'arrondi automatique
    n.vz = e.vz + (vzCible - e.vz) * Math.min(1, REPONSE_VZ * dt);
    n.vz = Math.max(n.vz, -plafondDescente(e.alt)); // même lissé, jamais plus vite que doux
    n.alt = e.alt + n.vz * dt;
    if (n.alt >= ALTITUDE_MAX) { n.alt = ALTITUDE_MAX; n.vz = Math.min(n.vz, 0); }
    if (n.alt <= 0) { n.alt = 0; n.auSol = true; n.vz = 0; }
  }
  return n;
}

// --------------------------------------------------- la lecture automatique
// Le phénomène vit tout seul : où doit être le curseur à l'instant t du tour ?
// Un tour = respirer posé, pousser (décollage, montée), voler, réduire
// (descente, atterrissage), freiner, re-respirer — puis ça recommence.
const AUTO_ETAPES = [
  // [t de fin, cible au début, cible à la fin] — interpolation linéaire
  [3, 0, 0],        // posé, on respire
  [12, 0, 1],       // on pousse : il roule, il s'envole, il grimpe
  [38, 1, 1],       // plein vol, tout là-haut
  [50, 1, 0.38],    // on réduit : l'air porte moins, il descend en planant
  [72, 0.38, 0.38], // la longue descente douce, l'arrondi, le toucher
  [80, 0.38, 0],    // il freine et s'arrête
  [TOUR_DUREE, 0, 0], // posé — le tour est fini, on recommence
];

export function cibleAuto(t) {
  const tt = ((t % TOUR_DUREE) + TOUR_DUREE) % TOUR_DUREE;
  let debut = 0;
  for (const etape of AUTO_ETAPES) {
    if (tt <= etape[0]) {
      const duree = etape[0] - debut;
      const k = duree > 0 ? (tt - debut) / duree : 1;
      return etape[1] + (etape[2] - etape[1]) * k;
    }
    debut = etape[0];
  }
  return 0;
}

// ------------------------------------------------------------------ les moments
// Trois boutons-moments : chacun amène le curseur en douceur, puis UNE phrase
// raconte l'instant. `dispo(etat)` dit si le moment a un sens MAINTENANT
// (retour de David : décoller en vol ou atterrir déjà posé n'a pas de sens —
// le bouton se grise). `etapes` : [{ cible, jusquA }] — `jusquA` est un petit
// test d'étape franchie ; la dernière étape se prolonge.
export const MOMENTS = [
  {
    id: 'decollage', emoji: '🛫', label: 'Le décollage', sub: 'pousse à fond !',
    dispo: function (e) { return e.auSol; },
    etapes: [{ cible: 1 }],
    phrase: 'Regarde la flèche de l’air grandir avec la vitesse… dès qu’elle dépasse le poids : hop, ton avion s’envole !',
  },
  {
    id: 'vol', emoji: '✈️', label: 'En plein vol', sub: 'tout en équilibre',
    dispo: function () { return true; },
    etapes: [
      { cible: 1, jusquA: function (e) { return !e.auSol && e.alt >= 30; } },
      { cible: REPERE_DECOLLAGE },
    ],
    phrase: 'À cette vitesse, l’air porte ton avion pile autant que la Terre le tire : les deux flèches sont égales, il vole droit.',
  },
  {
    id: 'atterrissage', emoji: '🛬', label: 'L’atterrissage', sub: 'tout doux…',
    dispo: function (e) { return !e.auSol; },
    etapes: [{ cible: 0 }],
    phrase: 'On ralentit : l’air porte un peu moins, ton avion descend tout doucement… et pose ses roues tout doux.',
  },
];

// Avance un moment : rend { indice, cible } — l'étape suivante quand la
// condition est franchie, la dernière étape pour toujours.
export function etapeMoment(moment, indice, etat) {
  let i = indice;
  const etape = moment.etapes[i];
  if (etape.jusquA && etape.jusquA(etat) && i < moment.etapes.length - 1) i++;
  return { indice: i, cible: moment.etapes[i].cible };
}

// ------------------------------------------------------------- la phrase d'état
// UNE petite phrase sous la vue : ce que l'air fait à cet instant.
export function phraseEtat(etat) {
  const p = portance(etat.v);
  if (etat.auSol) {
    if (etat.v < 2) {
      return '😴 Ton avion est posé. Pas de vitesse : l’air ne le porte pas.';
    }
    if (p < 0.55) {
      return '🏁 Il roule… regarde la flèche de l’air grandir avec la vitesse !';
    }
    return '💨 Encore un peu ! La flèche de l’air va dépasser le poids…';
  }
  if (etat.alt > ALTITUDE_MAX - 3 && etat.vz > -0.4) {
    return '🎈 Tout en haut ! Plus haut, l’air est trop léger pour bien porter.';
  }
  if (etat.alt < ALT_ARRONDI && etat.vz < -0.4) {
    return '🪶 Tout près du sol, l’avion se redresse… toucher tout doux !';
  }
  if (etat.vz > 1.2) {
    return '💨 L’air pousse plus fort que le poids : ton avion monte !';
  }
  if (etat.vz < -0.4 && etat.v <= VITESSE_PLANE + 3) {
    return '🍃 Un avion ne s’arrête pas en l’air : il garde de l’élan et plane tout doucement vers la piste.';
  }
  if (etat.vz < -1.2) {
    return '🍃 L’air porte un peu moins que le poids : il descend doucement — il plane !';
  }
  return '⚖️ Les deux flèches sont égales : l’air porte pile autant que la Terre tire.';
}

// ------------------------------------------------------------------ les pièces
// « Découvre ton avion » : cinq pièces à taper, une petite histoire chacune
// (affichée, et relue par le bouton 🔊 — jamais de voix au tap, règle de la
// famille : sélectionner ne déclenche pas de commentaire audio).
export const PIECES = [
  { id: 'ailes', emoji: '🪶', label: 'les ailes', couleur: COULEUR_AIR,
    texte: 'Les ailes, c’est le grand secret : en avançant vite, elles poussent l’air vers le bas — alors l’air les pousse vers le haut, et ton avion est porté !' },
  { id: 'reacteurs', emoji: '🔥', label: 'le réacteur', couleur: COULEUR_FEU,
    texte: 'Le réacteur, c’est le moteur de l’avion : il avale l’air devant et le souffle très fort derrière — et l’avion file en avant. Encore l’air qui pousse !' },
  { id: 'cockpit', emoji: '🧑‍✈️', label: 'le cockpit', couleur: COULEUR_AVION_FONCE,
    texte: 'Le cockpit, c’est la petite maison du pilote, tout à l’avant. C’est là qu’il pousse la manette de vitesse — comme toi avec le grand curseur !' },
  { id: 'queue', emoji: '🪁', label: 'la queue', couleur: COULEUR_POIDS,
    texte: 'La queue et sa grande dérive gardent l’avion bien droit dans le vent — comme les plumes au bout d’une flèche.' },
  { id: 'roues', emoji: '🛞', label: 'les roues', couleur: COULEUR_PISTE,
    texte: 'Les roues servent à rouler sur la piste. En vol, hop, elles se replient sous le ventre — comme les pattes d’un oiseau !' },
];

// ------------------------------------------------------------------ l'affichage
export function formatVitesse(v) {
  return Math.round(v * KMH_PAR_UNITE) + ' km/h';
}

export function formatAltitude(alt) {
  const m = Math.round(alt * METRES_PAR_UNITE / 10) * 10;
  if (m < 1000) return m + ' m';
  const reste = m % 1000;
  return Math.floor(m / 1000) + ' ' + (reste < 100 ? '0' : '') + (reste < 10 ? '0' : '') + reste + ' m';
}
