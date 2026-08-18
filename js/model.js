// Modèle pur de « Comment volent les avions ? » — aucun accès DOM, testable sous Node.
//
// La physique du site (honnête, à hauteur d'enfant) :
// - l'aile qui avance vite POUSSE L'AIR VERS LE BAS, alors l'air pousse l'aile vers le
//   haut (action-réaction) : c'est la PORTANCE, et elle grandit avec la vitesse (∝ v²).
//   Pas de vitesse, pas de portance : un avion posé ne s'envole jamais tout seul ;
// - l'avion décolle quand la portance dépasse le poids — il existe donc une vitesse de
//   décollage précise (V_TAKEOFF, manche au neutre) ;
// - en croisière stable : portance = poids et poussée = traînée (l'équilibre des
//   4 flèches) ;
// - la traînée freine toujours et grandit avec la vitesse ; moteurs coupés, l'avion
//   ralentit et descend doucement — il PLANE, il ne tombe pas comme une pierre ;
// - pencher les ailes = tourner : le virage vient de la portance penchée (pas d'un
//   « volant ») ; plus on penche, plus le virage est serré — plafond doux (BANK_MAX) ;
// - JAMAIS PUNITIF : pas de décrochage dans le modèle (l'angle d'attaque est plafonné en
//   douceur), et près du sol la descente est plafonnée : l'arrondi est automatique, le
//   toucher toujours doux. Ces licences sont documentées (note aux parents + README).
//
// Unités du site (abstraites, choisies pour la lisibilité des flèches) :
// - forces en « poids d'avion » : WEIGHT = 1, la flèche du poids sert d'étalon ;
// - vitesse v dans [0, V_MAX] ; altitude dans [0, ALT_MAX] ; le temps en secondes.

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
export function clamp01(v) { return clamp(v, 0, 1); }

// ------------------------------------------------------------------ les constantes
export const V_MAX = 100;        // vitesse plein gaz en palier (unités du site)
export const V_TAKEOFF = 55;     // portance = poids à cette vitesse (manche au neutre)
export const V_CRUISE = 65;      // la croisière du site (équilibre confortable)
export const ALT_MAX = 100;      // plafond doux de l'altitude affichée
export const ALT_CRUISE = 60;    // altitude de croisière des scénarios

export const WEIGHT = 1;         // le poids, étalon des 4 flèches
// Les 4 flèches partagent UNE SEULE échelle (retour de David : proportions
// honnêtes) : la poussée plein gaz dépasse un peu le poids pour rester lisible.
export const THRUST_MAX = 1.2;   // poussée plein gaz (en poids d'avion)
export const ACCEL = 7;          // (unités de vitesse / s) par unité de force

// L'angle d'attaque, résumé en un facteur multiplicatif de la portance.
// En vol, l'avion se « règle » tout seul pour porter exactement son poids
// (stabilité longitudinale) ; le manche ajoute ou retire un peu d'angle.
// Le facteur est plafonné EN DOUCEUR : pas de décrochage dans le modèle.
export const AOA_MIN = 0.25;
export const AOA_MAX = 1.4;
export const LIFT_STICK_GAIN = 0.35; // effet du manche (−1 piqué … +1 cabré)

export const VS_MAX = 12;        // montée maxi (unités d'altitude / s)
export const VS_DOWN_MAX = 7;    // descente maxi, loin du sol : on plane, on ne tombe pas
export const VS_LAND = 2.5;      // descente maxi au ras du sol : le toucher est doux
export const FLARE_ALT = 8;      // sous cette altitude, l'arrondi automatique s'installe
export const VS_GAIN = 2.2;      // excès de portance → vitesse verticale visée
export const VS_RESPONSE = 1.8;  // souplesse de la réponse verticale (1/s)

export const BANK_MAX = 40 * DEG;    // inclinaison maxi (le plafond doux du virage)
export const BANK_RESPONSE = 1.6;    // souplesse de la mise en virage (1/s)
export const TURN_RATE_MAX = 0.42;   // vitesse de virage à pleine inclinaison (rad/s)

export const ROLL_FRICTION = 0.05;   // roulement sur la piste (en poids d'avion)
export const BRAKE_FRICTION = 0.25;  // freinage gaz coupés au sol

export const CEIL_BAND = 15;     // épaisseur du plafond doux sous ALT_MAX

export const SPEED_KMH = 4;      // affichage parent : v = 65 → « 260 km/h »
export const ALT_METERS = 40;    // affichage parent : alt = 60 → « 2 400 m »

// Couleurs sémantiques — constantes partout (flèches, textes, boutons, histoires).
// Palette « Grand ciel de jour » choisie par David : fond clair, forces assombries
// pour rester contrastées sur le ciel comme sur les panneaux blancs.
export const COLOR_LIFT = '#0b8a72';    // la portance : l'air costaud qui pousse en haut
export const COLOR_WEIGHT = '#6a4fd0';  // le poids : la Terre qui tire en bas
export const COLOR_THRUST = '#d86f00';  // la poussée : les moteurs
export const COLOR_DRAG = '#55617a';    // la traînée : l'air qui freine
export const COLOR_PLANE = '#ff6b9d';   // ton avion (le rose « chez toi » de la série)
export const COLOR_PLANE_DEEP = '#d94f80'; // l'aile et les ombres de l'avion
export const SKY_TOP = '#7dc2f0';       // le ciel de la scène, en haut
export const SKY_BOTTOM = '#d9eefc';    // le ciel à l'horizon
export const COLOR_GRASS = '#69b06e';
export const COLOR_RUNWAY = '#5c6a78';

// Les 4 forces, prêtes pour les légendes et les boutons.
export const FORCES = [
  { id: 'portance', emoji: '💨', label: 'la portance', color: COLOR_LIFT,
    sub: 'l’air pousse en haut' },
  { id: 'poids', emoji: '🌍', label: 'le poids', color: COLOR_WEIGHT,
    sub: 'la Terre tire en bas' },
  { id: 'poussee', emoji: '🔥', label: 'la poussée', color: COLOR_THRUST,
    sub: 'les moteurs poussent' },
  { id: 'trainee', emoji: '🌬️', label: 'la traînée', color: COLOR_DRAG,
    sub: 'l’air freine' },
];

// ------------------------------------------------------------------ les forces
export function thrustForce(throttle) { return THRUST_MAX * clamp01(throttle); }

// La traînée : toujours opposée au mouvement, et en v² comme la portance —
// plein gaz, poussée = traînée pile à V_MAX (c'est sa définition).
export function dragForce(v) {
  const k = clamp(v, 0, V_MAX * 1.2) / V_MAX;
  return THRUST_MAX * k * k;
}

// Le facteur d'angle d'attaque « tout seul » (vol) : l'avion se règle pour
// porter son poids — (V_TAKEOFF/v)², plafonné en douceur des deux côtés.
export function aoaTrim(v) {
  const vv = Math.max(v, 4);
  return clamp((V_TAKEOFF / vv) * (V_TAKEOFF / vv), AOA_MIN, AOA_MAX);
}

// Portance sur la piste (assiette à plat) : elle ne dépend QUE de la vitesse —
// c'est la course des deux flèches que l'enfant regarde. Tirer le manche cabre
// un peu (rotation) ; le pousser ne plaque pas l'avion (jamais punitif).
export function liftGround(v, stick) {
  const k = v / V_TAKEOFF;
  return WEIGHT * k * k * (1 + LIFT_STICK_GAIN * Math.max(0, stick));
}

// Portance en vol : réglage automatique + manche, le tout plafonné en douceur
// (AOA_MAX : tirer plus fort ne donne plus rien — pas de décrochage ici).
export function liftAir(v, stick) {
  const k = v / V_TAKEOFF;
  const aoa = clamp(aoaTrim(v) * (1 + LIFT_STICK_GAIN * stick), AOA_MIN, AOA_MAX);
  return WEIGHT * k * k * aoa;
}

// Les 4 forces de l'instant — la matière première des 4 flèches.
export function forces(state, controls) {
  const lift = state.onGround
    ? liftGround(state.v, controls.stick)
    : liftAir(state.v, controls.stick);
  return {
    lift: lift,
    weight: WEIGHT,
    thrust: thrustForce(controls.throttle),
    drag: dragForce(state.v),
  };
}

// La vitesse de virage : la portance penchée tire l'avion de côté. Nulle à
// plat, maximale au plafond d'inclinaison — jamais au-delà (plafond doux).
export function turnRate(bank, onGround) {
  if (onGround) return 0;
  const b = clamp(bank, -BANK_MAX, BANK_MAX);
  return TURN_RATE_MAX * Math.tan(b) / Math.tan(BANK_MAX);
}

// Plafond de descente selon l'altitude : VS_DOWN_MAX en l'air, VS_LAND au ras
// du sol — l'arrondi automatique qui garantit un toucher toujours doux.
export function descentCap(alt) {
  return VS_LAND + (VS_DOWN_MAX - VS_LAND) * clamp01(alt / FLARE_ALT);
}

// Plafond de montée : en approchant du haut du ciel, la montée s'éteint en
// douceur (l'air se fait trop léger) — jamais de butée brutale en haut du cadre.
export function climbCap(alt) {
  return VS_MAX * clamp01((ALT_MAX - alt) / CEIL_BAND);
}

// ------------------------------------------------------------------ l'état
export function newState() {
  return { v: 0, alt: 0, vs: 0, bank: 0, heading: 0, x: 0, y: 0, dist: 0, onGround: true };
}

// Un pas de simulation — pur : rend un NOUVEL état, ne touche à rien.
// controls = { throttle: 0..1, stick: −1..1 (piqué/cabré), bank: −1..1 (pencher) }.
export function step(state, controls, dt) {
  const s = state;
  const throttle = clamp01(controls.throttle);
  const stick = clamp(controls.stick, -1, 1);
  const bankCmd = clamp(controls.bank, -1, 1);
  const n = {
    v: s.v, alt: s.alt, vs: s.vs, bank: s.bank, heading: s.heading,
    x: s.x, y: s.y, dist: s.dist || 0, onGround: s.onGround,
  };

  // --- la vitesse : poussée contre traînée (et frottements au sol)
  let force = thrustForce(throttle) - dragForce(s.v);
  if (s.onGround) {
    force -= s.v > 0 ? (throttle < 0.05 ? BRAKE_FRICTION : ROLL_FRICTION) : 0;
  }
  n.v = clamp(s.v + force * ACCEL * dt, 0, V_MAX * 1.2);

  // --- l'inclinaison : elle répond au geste, revient à plat au sol
  const bankTarget = s.onGround ? 0 : bankCmd * BANK_MAX;
  n.bank = s.bank + (bankTarget - s.bank) * Math.min(1, BANK_RESPONSE * dt);

  // --- le cap et la trajectoire (pour la mini-carte) : portance penchée = virage
  n.heading = s.heading + turnRate(n.bank, s.onGround) * dt;
  n.x = s.x + Math.sin(n.heading) * n.v * dt;
  n.y = s.y - Math.cos(n.heading) * n.v * dt;
  n.dist = n.dist + n.v * dt; // le chemin parcouru — fait défiler le décor de côté

  // --- la verticale : l'excès de portance fait monter, le manque fait descendre
  const lift = s.onGround ? liftGround(n.v, stick) : liftAir(n.v, stick);
  if (s.onGround) {
    n.vs = 0;
    n.alt = 0;
    // décollage : la portance dépasse le poids — l'avion quitte la piste.
    // Manche poussé vers le bas, les roues restent collées à la piste : pas de
    // rebond quand on se pose vite (retour de David — bas du cadre).
    if (lift > WEIGHT && stick >= -0.05) { n.onGround = false; n.vs = 0.5; }
  } else {
    const liftUp = lift * Math.cos(n.bank); // la part de portance qui tient en l'air
    let vsTarget = VS_MAX * clamp((liftUp - WEIGHT) * VS_GAIN, -1, 1);
    vsTarget = Math.max(vsTarget, -descentCap(s.alt)); // l'arrondi automatique
    vsTarget = Math.min(vsTarget, climbCap(s.alt));    // le plafond doux, en haut
    n.vs = s.vs + (vsTarget - s.vs) * Math.min(1, VS_RESPONSE * dt);
    n.vs = Math.max(n.vs, -descentCap(s.alt)); // même lissé, jamais plus vite que doux
    n.vs = Math.min(n.vs, climbCap(s.alt));
    n.alt = s.alt + n.vs * dt;
    if (n.alt >= ALT_MAX) { n.alt = ALT_MAX; n.vs = Math.min(n.vs, 0); }
    if (n.alt <= 0) { n.alt = 0; n.onGround = true; n.vs = 0; n.bank = 0; }
  }
  return n;
}

// ------------------------------------------------------- le tour d'avion automatique
// Le phénomène vit tout seul : un tour complet — décollage, montée, croisière,
// virage, descente, atterrissage, freinage — qui recommence. Chaque phase donne
// des commandes cibles et sa condition de fin (`dur` en secondes, ou `done`).
export const T_CRUISE = (V_CRUISE / V_MAX) * (V_CRUISE / V_MAX); // poussée = traînée à V_CRUISE

export const AUTO_PHASES = [
  { id: 'attente', throttle: 0, stick: 0, bank: 0, dur: 1.8 },
  { id: 'roule', throttle: 1, stick: 0.15, bank: 0,
    done: function (s) { return !s.onGround; }, maxDur: 30 },
  { id: 'montee', throttle: 0.8, stick: 0.6, bank: 0,
    done: function (s) { return s.alt >= ALT_CRUISE; }, maxDur: 40 },
  { id: 'croisiere', throttle: T_CRUISE, stick: 0, bank: 0, dur: 7 },
  { id: 'virage', throttle: T_CRUISE + 0.06, stick: 0.3, bank: 0.6, dur: 9 },
  { id: 'redresse', throttle: T_CRUISE, stick: 0, bank: 0, dur: 3.5 },
  { id: 'descente', throttle: 0.12, stick: -0.35, bank: 0,
    done: function (s) { return s.alt <= FLARE_ALT + 2; }, maxDur: 40 },
  { id: 'arrondi', throttle: 0, stick: 0.25, bank: 0,
    done: function (s) { return s.onGround; }, maxDur: 30 },
  { id: 'freinage', throttle: 0, stick: 0, bank: 0,
    done: function (s) { return s.v < 1.5; }, maxDur: 30 },
];

export function phaseIndex(id) {
  for (let i = 0; i < AUTO_PHASES.length; i++) {
    if (AUTO_PHASES[i].id === id) return i;
  }
  return -1;
}

// Avance le petit chef de bord : { index, t } → phase suivante quand c'est fini.
// Rend { auto, phase } — `auto` est un NOUVEL objet (pur), `phase` la phase active.
export function autoStep(auto, state, dt) {
  let index = auto.index, t = auto.t + dt;
  let phase = AUTO_PHASES[index];
  const dur = phase.dur !== undefined ? phase.dur : phase.maxDur;
  const finished = (phase.done && phase.done(state)) || (dur !== undefined && t >= dur);
  if (finished) {
    index = (index + 1) % AUTO_PHASES.length;
    t = 0;
    phase = AUTO_PHASES[index];
  }
  return { auto: { index: index, t: t }, phase: phase };
}

// ------------------------------------------------------------------ les scénarios
// Quatre moments de vol. `entry` : l'état de départ vers lequel on GLISSE en
// douceur (jamais de marche arrière brutale) ; `phases` : les phases jouées
// ensuite ; puis deux textes — le même instant sous les deux regards.
export const ENTRY_GROUND = { v: 0, alt: 0, vs: 0, bank: 0, onGround: true };
export const ENTRY_AIR = { v: V_CRUISE, alt: ALT_CRUISE, vs: 0, bank: 0, onGround: false };

export const SCENARIOS = [
  {
    id: 'decollage', emoji: '🛫', label: 'Le décollage', sub: 'plein gaz !',
    entry: ENTRY_GROUND, phases: ['roule', 'montee', 'croisiere'],
    cote: 'Les moteurs poussent fort, ton avion court de plus en plus vite… Regarde la flèche de l’air grandir ! Quand elle dépasse le poids : hop, l’air le porte, il s’envole !',
    derriere: 'Les ailes restent bien à plat, l’horizon bien droit : ton avion file tout droit, droit vers le ciel.',
  },
  {
    id: 'croisiere', emoji: '✈️', label: 'La croisière', sub: 'tout en équilibre',
    entry: ENTRY_AIR, phases: ['croisiere'],
    cote: 'Tout est en équilibre : l’air porte autant que la Terre tire, les moteurs poussent autant que l’air freine. Les 4 flèches se répondent — l’avion vole droit, tranquille.',
    derriere: 'Les ailes à plat, l’horizon posé bien à plat aussi : pas de virage, on se laisse porter.',
  },
  {
    id: 'virage', emoji: '🔄', label: 'Le virage', sub: 'penche les ailes !',
    entry: ENTRY_AIR, phases: ['virage', 'redresse'],
    cote: 'L’avion garde sa vitesse : l’air le porte toujours. Pas de volant dans un avion — pour tourner, il se penche !',
    derriere: 'Penche les ailes : l’air pousse un peu de côté, et l’avion tourne ! Regarde la trajectoire s’incurver sur la carte. Plus tu penches, plus le virage est serré.',
  },
  {
    id: 'atterrissage', emoji: '🛬', label: 'L’atterrissage', sub: 'tout doux…',
    entry: ENTRY_AIR, phases: ['descente', 'arrondi', 'freinage', 'attente'],
    cote: 'On réduit les moteurs : l’avion ralentit, l’air porte un peu moins, alors il descend doucement… tout près du sol, il se redresse — et pose ses roues tout doux.',
    derriere: 'Les ailes bien à plat pour se poser : l’horizon est droit, la piste arrive tout droit devant.',
  },
];

// ------------------------------------------------------------- les phrases d'état
// La petite phrase sous chaque vue : le même instant, raconté deux fois.
export function statusSide(state, controls) {
  const f = forces(state, controls);
  if (state.onGround) {
    if (state.v < 2) {
      return '😴 Ton avion est posé. Pas de vitesse : l’air ne porte pas.';
    }
    if (f.lift > WEIGHT) {
      return '💨 À cette vitesse, l’air soulève ton avion dès que tu le laisses !';
    }
    if (f.lift < WEIGHT * 0.55) {
      return '🏃 Il court sur la piste… la flèche de l’air grandit avec la vitesse !';
    }
    return '💨 Encore un peu… la flèche de l’air va dépasser le poids !';
  }
  if (state.alt > ALT_MAX - 3 && state.vs > -0.4) {
    return '🎈 Tout en haut ! Plus haut, l’air est trop léger pour bien porter.';
  }
  if (state.alt < FLARE_ALT && state.vs < -0.4) {
    return '🪶 Tout près du sol, l’avion se redresse… toucher tout doux !';
  }
  if (state.vs > 1.2) {
    return '💨 L’air pousse plus fort que le poids : ton avion monte !';
  }
  if (state.vs < -1.2) {
    return controls.throttle < 0.2
      ? '🍃 Moteurs tout doux : l’avion plane et descend lentement — il ne tombe pas !'
      : '🛬 L’air porte un peu moins que le poids : l’avion descend doucement.';
  }
  return '⚖️ Tout est en équilibre : l’air porte, l’avion vole droit.';
}

export function statusBack(state) {
  const deg = Math.abs(state.bank) / DEG;
  if (state.onGround) {
    return '🛣️ Les roues sur la piste, les ailes bien à plat.';
  }
  if (deg < 6) {
    return '➡️ Ailes à plat : ton avion vole tout droit.';
  }
  const side = state.bank > 0 ? 'droite' : 'gauche';
  if (deg < 22) {
    return '🔄 Penché vers la ' + side + ' : l’air pousse de côté, l’avion tourne !';
  }
  return '🔄 Bien penché : le virage à ' + side + ' se serre — regarde la carte !';
}

// ------------------------------------------------------------------ l'affichage
export function formatSpeed(v) {
  return Math.round(v * SPEED_KMH) + ' km/h';
}

export function formatAlt(alt) {
  const m = Math.round(alt * ALT_METERS / 10) * 10;
  if (m < 1000) return m + ' m';
  const rest = m % 1000;
  return Math.floor(m / 1000) + ' ' + (rest < 100 ? '0' : '') + (rest < 10 ? '0' : '') + rest + ' m';
}
