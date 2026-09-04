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
export const DECELERATION = 9;       // quand on réduit en vol (l'air freine)
export const DECELERATION_ROULAGE = 4; // au sol : l'avion posé ROULE longtemps avant
                                     // de s'arrêter (retour de David 2026-09-04 :
                                     // « il roule très peu, c'est peu réaliste »)
export const PHRASE_TENUE = 3.5;     // secondes : la phrase d'état reste affichée le
                                     // temps d'être LUE — les transitions rapides ne
                                     // font pas clignoter le texte, et les phrases
                                     // sont courtes exprès (David 2026-09-04)

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
  const freinage = e.auSol ? DECELERATION_ROULAGE : DECELERATION;
  const pasV = ecart >= 0 ? Math.min(ecart, ACCELERATION * dt)
                          : Math.max(ecart, -freinage * dt);
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
// DEUX boutons-moments — les deux vrais ÉVÉNEMENTS du vol, dont la phrase
// raconte exactement ce qui se passe à l'écran (décision de David 2026-08-31 :
// l'ancien « ✈️ En plein vol » affichait une phrase d'équilibre pendant que
// l'écran montrait un décollage — l'équilibre est un ÉTAT, il vit déjà dans
// le repère « ✨ ici, il s'envole ! » et le jeu). `dispo(etat)` dit si le
// moment a un sens maintenant (sinon le bouton se grise) ; `etapes` :
// [{ cible, jusquA }] — la dernière étape se prolonge.
export const MOMENTS = [
  {
    id: 'decollage', emoji: '🛫', label: 'Le décollage', sub: 'pousse à fond !',
    dispo: function (e) { return e.auSol; },
    etapes: [{ cible: 1 }],
    phrase: 'Regarde la flèche de l’air grandir avec la vitesse… dès qu’elle dépasse le poids : hop, ton avion s’envole !',
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
// UNE petite phrase sous la vue — assise sur la MÊME grandeur que les flèches
// (l'excès de portance ressentie) : le texte, les flèches et le mouvement ne
// peuvent pas se contredire (retour de David 2026-08-31 : à 224 km/h l'avion
// montait doucement pendant que la phrase parlait d'équilibre). Au sol, la
// phrase reçoit la consigne du curseur pour savoir si l'on accélère ou si
// l'on freine (retour de David 2026-09-02 : « regarde la flèche grandir »
// s'affichait aussi pendant le freinage après l'atterrissage — et le drapeau
// à damier 🏁, qui dit « arrivée ! », racontait le contraire du roulage).
// ⚠️ Phrases COURTES à dessein (décision David 2026-09-04 : même en tenant
// 2,4 s, les anciennes phrases de 15-20 mots défilaient trop vite pour être
// lues). Squelette fixe « emoji + constat en 4-8 petits mots » : au deuxième
// tour, l'emoji suffit à reconnaître l'état et la lecture est instantanée.
export function phraseEtat(etat, cible01) {
  if (etat.auSol) {
    if (etat.v < 2) {
      return '😴 Il est posé : pas de vitesse, pas d’envol.';
    }
    const vCible = cible01 === undefined ? etat.v : borne01(cible01) * VITESSE_MAX;
    if (vCible < etat.v - 2) {
      return '🛞 Il freine… la flèche rapetisse.';
    }
    if (vCible > etat.v + 2) {
      if (portance(etat.v) < 0.55) {
        return '🛞 Il roule… regarde la flèche grandir !';
      }
      return '💨 Encore un peu… presque le poids !';
    }
    // descriptive, jamais une injonction : après un atterrissage curseur à
    // mi-course, « pousse encore ! » sonnait comme un ordre de redécoller
    return '🛞 Il roule : l’air ne le porte pas assez.';
  }
  // (le plafond n'a plus sa phrase à lui : depuis « une vitesse = une
  //  altitude », tout en haut est un équilibre comme un autre — la phrase des
  //  flèches égales dit vrai, et l'air léger se raconte dans la boîte 💡 ;
  //  décision David 2026-09-04)
  if (etat.alt < ALT_ARRONDI && etat.vz < -0.4) {
    return '🪶 Il sort ses roues… toucher tout doux !';
  }
  if (etat.vz < -0.4 && etat.v <= VITESSE_PLANE + 3) {
    return '🍃 Un avion ne s’arrête pas en l’air : il plane !';
  }
  const exces = portanceEnVol(etat.v, etat.alt) - POIDS;
  // LE MOUVEMENT D'ABORD : la phrase suit ce que l'œil voit (vz) — l'excès
  // des flèches ne fait que graduer. Retour de David 2026-09-04 : « les deux
  // flèches sont égales » s'affichait pendant le décollage, car juste après
  // l'envol l'excès est minuscule… alors que l'avion monte bel et bien.
  // « Égales » est désormais impossible dès que l'avion bouge.
  if (etat.vz > 0.4) {
    // les roues suivent le dessin (rentrées dès ALT_ARRONDI) : racontées
    // seulement là où c'est VRAI à l'écran — bande assez large pour
    // survivre à la tenue de lecture en pleine montée
    if (etat.alt >= ALT_ARRONDI && etat.alt < ALT_ARRONDI * 4.5) {
      return '💨 Il monte… hop, les roues se rangent !';
    }
    if (exces > 0.15) return '💨 L’air gagne : il monte !';
    if (exces > 0.03) return '💨 Un petit peu plus fort : il monte doucement.';
    return '💨 Il monte tout doucement.'; // flèches quasi égales : pas de mensonge
  }
  if (etat.vz < -0.4) {
    if (exces < -0.15) return '🍃 L’air porte moins : il descend en planant.';
    if (exces < -0.03) return '🍃 Un petit peu moins fort : il descend doucement.';
    return '🍃 Il descend tout doucement.';
  }
  // l'altitude ne bouge pas (ou pas encore) à l'œil
  if (exces > 0.15) return '💨 L’air gagne : il va monter !';
  if (exces < -0.15) return '🍃 L’air porte moins : il va descendre.';
  return '⚖️ Les deux flèches sont égales !';
}

// ------------------------------------------------------------------ le jeu
// « Rejoins-les là-haut ! » : un invité attend à SON altitude, l'enfant règle
// la vitesse pour voler à sa hauteur — et découvre dans ses doigts que chaque
// vitesse a son altitude. Patron des défis de la famille : fenêtre de
// victoire + tenue, hystérésis de sortie (le bravo ne clignote pas au bord),
// le bravo ne ment jamais. Le dernier défi renverse la révélation : pour
// voler aussi bas que le papillon… il faut se poser.
export const JEU_FENETRE = 6;   // demi-fenêtre de victoire (± 240 m affichés)
export const JEU_SORTIE = 10;   // hystérésis : le bravo se range plus loin qu'il ne se gagne
export const JEU_TENUE = 2;     // secondes à tenir dans la fenêtre (pas de victoire « en passant »)

export const DEFIS = [
  {
    id: 'ballon', altitude: 56, invite: 'le ballon',
    consigne: 'Oh, un ballon s’est échappé ! Vole à sa hauteur pour lui dire bonjour.',
    bravo: 'Bravo ! Tu voles avec le ballon !',
  },
  {
    id: 'montgolfiere', altitude: 77, invite: 'la montgolfière',
    consigne: 'La montgolfière se promène… monte la rejoindre, tout en douceur !',
    bravo: 'Coucou la montgolfière ! Tu tiens ta hauteur comme un chef !',
  },
  {
    id: 'aigle', altitude: 98, invite: 'l’aigle',
    consigne: 'L’aigle plane tout là-haut… fonce le rejoindre !',
    bravo: 'Waouh, tu voles avec l’aigle ! Plus vite… plus haut !',
  },
  {
    id: 'papillon', altitude: 0, invite: 'le papillon',
    consigne: 'Le papillon volette tout près des fleurs… viens tout près de lui !',
    bravo: 'Tu as trouvé le secret ! En dessous de la vitesse magique, un avion ne vole pas : il roule. Le papillon te dit bravo !',
  },
];

// L'enfant est-il « chez » l'invité ? `marge` : JEU_FENETRE pour gagner,
// JEU_SORTIE pour garder le bravo (hystérésis). Le papillon vit au sol : le
// rejoindre, c'est se poser — la révélation à l'envers.
export function defiDansFenetre(defi, etat, marge) {
  if (defi.altitude === 0) return etat.auSol;
  return !etat.auSol && Math.abs(etat.alt - defi.altitude) <= marge;
}

// ------------------------------------------------------------------ les pièces
// « Découvre ton avion » : cinq pièces marquées d'un simple POINT coloré —
// pas d'emoji sur les pastilles (retour de David 2026-09-03 : le cerf-volant
// pour la queue était une devinette, et les emojis cachaient les pièces).
// Taper une pastille affiche l'histoire, et la LIT si la voix de la famille
// est allumée (une pastille est un choix de contenu, comme un moment — voix
// éteinte, silence complet).
export const PIECES = [
  { id: 'ailes', label: 'les ailes', pluriel: true, couleur: COULEUR_AIR,
    texte: 'Les ailes, c’est le grand secret : en avançant vite, elles poussent l’air vers le bas — alors l’air les pousse vers le haut, et ton avion est porté !' },
  { id: 'reacteurs', label: 'le réacteur', pluriel: false, couleur: COULEUR_FEU,
    texte: 'Le réacteur, c’est le moteur de l’avion : il avale l’air devant et le souffle très fort derrière — et l’avion file en avant. Encore l’air qui pousse !' },
  { id: 'cockpit', label: 'le cockpit', pluriel: false, couleur: COULEUR_AVION_FONCE,
    texte: 'Le cockpit, c’est la petite maison du pilote, tout à l’avant. C’est là qu’il pousse la manette de vitesse — comme toi avec le grand curseur !' },
  { id: 'queue', label: 'la queue', pluriel: false, couleur: COULEUR_POIDS,
    texte: 'La queue et sa grande dérive gardent l’avion bien droit dans le vent — comme les plumes au bout d’une flèche.' },
  { id: 'roues', label: 'les roues', pluriel: true, couleur: '#2f7fd6', // bleu vif :
    // sa pastille vit SUR la piste grise — jamais COULEUR_PISTE (invisible)
    texte: 'Les roues servent à rouler sur la piste. En vol, hop, elles se replient sous le ventre — comme les pattes d’un oiseau !' },
];

// « Où est… ? » — les phrases du jeu des pièces (accord singulier/pluriel).
export function consignePiece(piece) {
  return 'Où ' + (piece.pluriel ? 'sont' : 'est') + ' ' + piece.label + ' ?';
}
export function bravoPiece(piece) {
  return 'Bravo, c’' + (piece.pluriel ? 'étaient bien ' : 'était bien ') + piece.label + ' !';
}
export function ratePiece(piece) {
  return 'Non, ça c’' + (piece.pluriel ? 'étaient ' : 'était ') + piece.label + '…';
}

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
