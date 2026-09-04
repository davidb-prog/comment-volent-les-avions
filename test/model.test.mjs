// Tests du modèle — zéro dépendance : `node test/model.test.mjs`
// Les vérités de l'épisode : la portance grandit avec la vitesse (nulle à
// l'arrêt), l'avion s'envole quand elle atteint le poids (vitesse de décollage
// précise), vitesse réduite = il plane et descend doucement, toucher toujours
// doux, jamais punitif — et le grand curseur suffit à tout faire.

import {
  TAU, borne, borne01,
  VITESSE_MAX, VITESSE_DECOLLAGE, POIDS, ALTITUDE_MAX,
  VZ_MONTEE_MAX, VZ_DESCENTE_MAX, VZ_SOL, ALT_ARRONDI,
  VITESSE_PLANE, ALT_AIR_LEGER, DENSITE_PLAFOND,
  REPERE_DECOLLAGE, TOUR_DUREE,
  COULEUR_AIR, COULEUR_POIDS, COULEUR_AVION,
  portance, densiteAir, portanceEnVol, plafondDescente, etatInitial, pas,
  cibleAuto, MOMENTS, etapeMoment, phraseEtat, PIECES,
  DEFIS, JEU_FENETRE, JEU_SORTIE, JEU_TENUE, defiDansFenetre,
  consignePiece, bravoPiece, ratePiece,
  formatVitesse, formatAltitude,
} from '../js/model.js';

let rates = 0;
let reussis = 0;
function verifie(nom, cond, detail) {
  if (cond) { reussis++; console.log('  ✓ ' + nom); }
  else { rates++; console.error('  ✗ ' + nom + (detail === undefined ? '' : ' — ' + detail)); }
}
const proche = (a, b, eps) => Math.abs(a - b) <= (eps === undefined ? 1e-9 : eps);

// un générateur pseudo-aléatoire à graine : les tests sont reproductibles
function mulberry32(graine) {
  let a = graine >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DT = 1 / 30;
function simule(etat, cibleDe, secondes, aChaquePas) {
  let e = etat;
  const n = Math.round(secondes / DT);
  for (let i = 0; i < n; i++) {
    const avant = e;
    e = pas(e, cibleDe(i * DT, e), DT);
    if (aChaquePas) aChaquePas(avant, e, i * DT);
  }
  return e;
}
const TIENT = (cible) => () => cible;

console.log('La portance grandit avec la vitesse (∝ v²) — nulle à l’arrêt');
verifie('à l’arrêt, portance nulle : un avion posé n’est pas porté du tout',
  portance(0) === 0);
verifie('portance ∝ v² : doubler la vitesse la multiplie par 4',
  proche(portance(40), 4 * portance(20)) && proche(portance(30) / portance(10), 9));
verifie('à VITESSE_DECOLLAGE pile, portance = poids exactement',
  proche(portance(VITESSE_DECOLLAGE), POIDS));
verifie('en dessous : portance < poids ; au-dessus : portance > poids',
  portance(VITESSE_DECOLLAGE - 5) < POIDS && portance(VITESSE_DECOLLAGE + 5) > POIDS);
verifie('curseur à zéro : un avion posé ne bouge pas, ne s’envole jamais tout seul',
  (() => {
    const fin = simule(etatInitial(), TIENT(0), 10);
    return fin.auSol && fin.v === 0 && fin.alt === 0;
  })());

console.log('Le grand curseur — un seul geste, tout en découle');
verifie('curseur à fond depuis l’arrêt : l’avion décolle, pile autour de la vitesse de décollage',
  (() => {
    let vEnvol = -1;
    simule(etatInitial(), TIENT(1), 30, (avant, e) => {
      if (avant.auSol && !e.auSol && vEnvol < 0) vEnvol = e.v;
    });
    return vEnvol >= VITESSE_DECOLLAGE - 1 && vEnvol <= VITESSE_DECOLLAGE + 2;
  })());
verifie('le repère « il s’envole » du curseur est exactement la vitesse de décollage',
  proche(REPERE_DECOLLAGE, VITESSE_DECOLLAGE / VITESSE_MAX));
verifie('curseur pile sur le repère : l’avion vole en équilibre (les deux flèches égales)',
  (() => {
    const depuisLArret = simule(etatInitial(), TIENT(REPERE_DECOLLAGE), 40);
    if (depuisLArret.auSol) return false; // à la vitesse pile, l'air le soulève
    // en vol : une fois la vitesse calée sur le repère, l'altitude ne bouge plus
    const a30 = simule({ v: 80, alt: 60, vz: 0, auSol: false, distance: 0 },
      TIENT(REPERE_DECOLLAGE), 30);
    const a40 = simule(a30, TIENT(REPERE_DECOLLAGE), 10);
    return !a40.auSol && proche(a40.alt, a30.alt, 1) && Math.abs(a40.vz) < 0.3;
  })());
verifie('curseur à fond : il grimpe, puis s’installe en douceur sous le plafond (l’air trop léger)',
  (() => {
    const fin = simule(etatInitial(), TIENT(1), 60);
    return !fin.auSol && fin.alt > ALTITUDE_MAX - 5 && fin.alt <= ALTITUDE_MAX;
  })());
verifie('curseur réduit en vol : il descend doucement — il PLANE, il ne tombe pas',
  (() => {
    const e0 = { v: 80, alt: ALTITUDE_MAX, vz: 0, auSol: false, distance: 0 };
    let vzMini = 0;
    const fin = simule(e0, TIENT(0.3), 30, (avant, e) => {
      vzMini = Math.min(vzMini, e.vz);
    });
    return fin.alt < ALTITUDE_MAX && vzMini < -0.5 && vzMini >= -VZ_DESCENTE_MAX - 1e-6;
  })());
verifie('posé, l’avion ROULE longtemps avant de s’arrêter : encore en mouvement à 5 s, ' +
  'arrêté avant 15 s (retour de David 2026-09-04 : « il roule très peu »)',
  (() => {
    let e = { v: VITESSE_PLANE, alt: 0, vz: 0, auSol: true, distance: 0 };
    let vA5s = 0;
    for (let t = 0; t < 15; t += 0.05) {
      e = pas(e, 0, 0.05);
      if (Math.abs(t - 5) < 0.026) vA5s = e.v;
    }
    return vA5s > 10 && e.v === 0;
  })());
verifie('curseur à zéro depuis n’importe où : l’avion finit posé, roues arrêtées',
  (() => {
    const alea = mulberry32(42);
    for (let essai = 0; essai < 12; essai++) {
      const e0 = {
        v: alea() * VITESSE_MAX, alt: 5 + alea() * 95,
        vz: VZ_MONTEE_MAX * (alea() * 2 - 1), auSol: false, distance: 0,
      };
      const fin = simule(e0, TIENT(0), 120);
      if (!fin.auSol || fin.v >= 2) return false;
    }
    return true;
  })());

console.log('L’atterrissage — l’arrondi automatique, le toucher toujours doux');
verifie('le plafond de descente se resserre près du sol : doux là-haut, très doux au ras',
  proche(plafondDescente(0), VZ_SOL) && proche(plafondDescente(ALT_ARRONDI), VZ_SOL + (VZ_DESCENTE_MAX - VZ_SOL)) &&
  plafondDescente(ALT_ARRONDI / 2) > VZ_SOL && plafondDescente(ALT_ARRONDI / 2) < VZ_DESCENTE_MAX);

console.log('L’air raréfié là-haut — chaque vitesse a son altitude de croisière');
verifie('l’air est plein en bas, raréfié tout en haut du ciel dessiné',
  proche(densiteAir(0), 1) && proche(densiteAir(ALT_AIR_LEGER), 1) &&
  proche(densiteAir(ALTITUDE_MAX), DENSITE_PLAFOND) &&
  densiteAir(75) < 1 && densiteAir(75) > DENSITE_PLAFOND);
verifie('en palier, l’air porte pile le poids : les deux flèches sont égales, à toute altitude d’équilibre',
  (() => {
    for (const cible of [0.7, 1]) {
      const fin = simule({ v: 60, alt: 60, vz: 0, auSol: false, distance: 0 },
        TIENT(cible), 60);
      if (fin.auSol || Math.abs(fin.vz) > 0.3) return false;
      if (!proche(portanceEnVol(fin.v, fin.alt), POIDS, 0.06)) return false;
    }
    return true;
  })());
verifie('plus vite = plus haut : l’altitude d’équilibre grandit avec la vitesse',
  (() => {
    const a70 = simule({ v: 70, alt: 60, vz: 0, auSol: false, distance: 0 }, TIENT(0.7), 60);
    const a100 = simule({ v: 100, alt: 60, vz: 0, auSol: false, distance: 0 }, TIENT(1), 60);
    return a100.alt > a70.alt + 10 && a100.alt <= ALTITUDE_MAX;
  })());
verifie('un avion ne s’arrête pas en l’air : curseur à zéro, il garde son élan de plané ' +
  'jusqu’à la piste — et ne freine qu’une fois posé',
  (() => {
    let vMiniEnVol = 999;
    const fin = simule({ v: 80, alt: 80, vz: 0, auSol: false, distance: 0 },
      TIENT(0), 120, (avant, e) => {
        if (!e.auSol) vMiniEnVol = Math.min(vMiniEnVol, e.v);
      });
    return vMiniEnVol >= VITESSE_PLANE - 0.5 && fin.auSol && fin.v < 2;
  })());
verifie('vitesse réduite depuis le plein vol : il descend, se pose, et le toucher est doux',
  (() => {
    const e0 = { v: 80, alt: 60, vz: 0, auSol: false, distance: 0 };
    let vzToucher = null;
    const fin = simule(e0, TIENT(0.2), 90, (avant, e) => {
      if (!avant.auSol && e.auSol && vzToucher === null) vzToucher = avant.vz;
    });
    return fin.auSol && vzToucher !== null && Math.abs(vzToucher) <= VZ_SOL + 0.3;
  })());

console.log('Jamais punitif — aucun geste au curseur ne produit de crash');
{
  const alea = mulberry32(20260819);
  let okAlt = true, okNombres = true, okToucher = true, atterrissages = 0;
  for (let vol = 0; vol < 40; vol++) {
    const enVol = alea() < 0.75;
    const alt = enVol ? 5 + alea() * 95 : 0;
    let e = {
      v: alea() * VITESSE_MAX, alt: alt,
      vz: enVol ? -plafondDescente(alt) + alea() * (VZ_MONTEE_MAX + plafondDescente(alt)) : 0,
      auSol: !enVol, distance: 0,
    };
    let cible = alea();
    let prochainChangement = 0;
    simule(e, (t) => {
      if (t >= prochainChangement) {
        cible = alea();
        prochainChangement = t + 0.4 + alea() * 2.5;
      }
      return cible;
    }, 60, (avant, apres) => {
      if (apres.alt < 0) okAlt = false;
      if (!isFinite(apres.v) || !isFinite(apres.alt) || !isFinite(apres.vz)) okNombres = false;
      if (!avant.auSol && apres.auSol) {
        atterrissages++;
        if (Math.abs(avant.vz) > VZ_SOL + 0.3) okToucher = false;
      }
    });
  }
  verifie('40 vols au curseur fou (graine fixe) : l’altitude ne passe jamais sous le sol', okAlt);
  verifie('aucune valeur ne part en vrille (pas de NaN, pas d’infini)', okNombres);
  verifie('CHAQUE retour au sol est un toucher doux (' + atterrissages + ' atterrissages observés)',
    okToucher && atterrissages > 0);
}

console.log('La lecture automatique — le tour d’avion vit tout seul, en boucle');
{
  let e = etatInitial();
  let decolle = false, toutEnHaut = false, redescendu = false, repose = false, arrete = false;
  for (let t = 0; t < TOUR_DUREE; t += DT) {
    const avant = e;
    e = pas(e, cibleAuto(t), DT);
    if (!e.auSol) decolle = true;
    if (e.alt > ALTITUDE_MAX - 10) toutEnHaut = true;
    if (toutEnHaut && e.alt < ALTITUDE_MAX / 2) redescendu = true;
    if (decolle && !avant.auSol && e.auSol) repose = true;
    if (repose && e.auSol && e.v < 2) arrete = true;
  }
  verifie('en un tour : il décolle', decolle);
  verifie('il monte tout en haut', toutEnHaut);
  verifie('il redescend', redescendu);
  verifie('il se pose', repose);
  verifie('il s’arrête — prêt à recommencer', arrete);
  verifie('le tour reboucle proprement (la cible revient à zéro aux deux bouts)',
    proche(cibleAuto(0), 0) && proche(cibleAuto(TOUR_DUREE - 0.01), 0, 0.01) &&
    proche(cibleAuto(TOUR_DUREE + 3), cibleAuto(3), 1e-9));
}

console.log('Les deux moments — les deux vrais événements, une phrase chacun');
verifie('deux moments : le décollage et l’atterrissage (l’équilibre est un ÉTAT — il vit dans le repère et le jeu)',
  MOMENTS.length === 2 && MOMENTS[0].id === 'decollage' && MOMENTS[1].id === 'atterrissage');
verifie('chaque moment a son émoji, son sous-titre et UNE phrase courte (pas de pavé)',
  MOMENTS.every((m) => m.emoji && m.sub && m.phrase.length > 40 && m.phrase.length <= 140));
verifie('le décollage raconte la course des flèches (dépasser le poids)',
  MOMENTS[0].phrase.indexOf('dépasse') !== -1);
verifie('l’atterrissage promet le toucher tout doux',
  MOMENTS[1].phrase.indexOf('doux') !== -1);
verifie('chaque moment sait quand il a du sens : décoller seulement posé, atterrir seulement en vol',
  (() => {
    const auSol = etatInitial();
    const enVol = { v: 80, alt: 60, vz: 0, auSol: false, distance: 0 };
    return MOMENTS[0].dispo(auSol) && !MOMENTS[0].dispo(enVol) &&
      !MOMENTS[1].dispo(auSol) && MOMENTS[1].dispo(enVol);
  })());
verifie('le moment décollage, joué depuis le sol, fait vraiment décoller',
  (() => {
    let e = etatInitial();
    let indice = 0;
    for (let t = 0; t < 30; t += DT) {
      const r = etapeMoment(MOMENTS[0], indice, e);
      indice = r.indice;
      e = pas(e, r.cible, DT);
    }
    return !e.auSol && e.alt > 10;
  })());
verifie('le moment atterrissage finit posé, roues arrêtées',
  (() => {
    let e = { v: 80, alt: 90, vz: 0, auSol: false, distance: 0 };
    let indice = 0;
    for (let t = 0; t < 120; t += DT) {
      const r = etapeMoment(MOMENTS[1], indice, e);
      indice = r.indice;
      e = pas(e, r.cible, DT);
    }
    return e.auSol && e.v < 2;
  })());

console.log('La phrase d’état — ce que l’air fait, à chaque instant');
verifie('posé à l’arrêt, la phrase dit le refrain : « pas de vitesse, pas d’envol »',
  phraseEtat(etatInitial()).indexOf('posé') !== -1 &&
  phraseEtat(etatInitial()).indexOf('pas de vitesse, pas d’envol') !== -1);
verifie('les phrases d’état sont COURTES — lisibles pendant leur tenue (≤ 50 signes, ' +
  'décision David 2026-09-04)',
  (() => {
    const etats = [
      [{ v: 0, alt: 0, vz: 0, auSol: true, distance: 0 }, 0],
      [{ v: 30, alt: 0, vz: 0, auSol: true, distance: 0 }, 1],
      [{ v: 30, alt: 0, vz: 0, auSol: true, distance: 0 }, 0],
      [{ v: 30, alt: 0, vz: 0, auSol: true, distance: 0 }, 0.3],
      [{ v: 53, alt: 0, vz: 0, auSol: true, distance: 0 }, 1],
      [{ v: 80, alt: 12, vz: 2, auSol: false, distance: 0 }, 1],
      [{ v: 80, alt: 40, vz: 5, auSol: false, distance: 0 }, 1],
      [{ v: 56, alt: 30, vz: 0.9, auSol: false, distance: 0 }, 0.56],
      [{ v: 54, alt: 30, vz: -0.9, auSol: false, distance: 0 }, 0.54],
      [{ v: 40, alt: 50, vz: -4, auSol: false, distance: 0 }, 0],
      [{ v: 60, alt: 60, vz: -2, auSol: false, distance: 0 }, 0.4],
      [{ v: 50, alt: 5, vz: -1.5, auSol: false, distance: 0 }, 0.4],
      [{ v: VITESSE_DECOLLAGE, alt: 50, vz: 0, auSol: false, distance: 0 }, 0.55],
    ];
    for (const [e, c] of etats) { if (phraseEtat(e, c).length > 50) return false; }
    return true;
  })());
verifie('au roulage, l’avion ROULE (il ne « court » jamais) et la flèche grandit',
  (() => {
    const ph = phraseEtat({ v: 30, alt: 0, vz: 0, auSol: true, distance: 0 }, 1);
    return ph.indexOf('roule') !== -1 && ph.indexOf('grandir') !== -1 &&
      ph.indexOf('court') === -1;
  })());
verifie('la phrase du sol sait dans quel sens on va : en freinant, la flèche RAPETISSE ' +
  '(elle ne « grandit » plus — retour de David : la phrase du décollage s’affichait à l’atterrissage)',
  (() => {
    const freine = phraseEtat({ v: 35, alt: 0, vz: 0, auSol: true, distance: 0 }, 0);
    const maintient = phraseEtat({ v: 30, alt: 0, vz: 0, auSol: true, distance: 0 }, 0.3);
    return freine.indexOf('freine') !== -1 && freine.indexOf('rapetisse') !== -1 &&
      freine.indexOf('grandir') === -1 &&
      maintient.indexOf('reste petite') !== -1 && // observation neutre des flèches
      maintient.indexOf('Pousse') === -1; // descriptive, jamais une injonction
  })());
verifie('au sol aussi, LE MOUVEMENT décide : en pleine accélération la flèche grandit ' +
  'même si la consigne colle à la vitesse, et le roulage stable reste neutre ' +
  '(retour de David 2026-09-04 : « il roule, l’air ne le porte pas assez » au décollage)',
  (() => {
    // la lecture auto pousse la consigne au rythme de l'avion : écart quasi nul,
    // mais dv = +11 — la phrase doit raconter l'accélération
    const accelere = phraseEtat({ v: 30, alt: 0, vz: 0, dv: 11, auSol: true, distance: 0 }, 0.31);
    // après l'atterrissage du tour auto : il roule stable à 38 — observation
    // neutre, plus jamais le récit d'un envol raté
    const arrive = phraseEtat({ v: 38, alt: 0, vz: 0, dv: 0, auSol: true, distance: 0 }, 0.38);
    // stable juste sous le seuil : les flèches sont presque égales, pas « petites »
    const presque = phraseEtat({ v: 53, alt: 0, vz: 0, dv: 0, auSol: true, distance: 0 }, 0.53);
    return accelere.indexOf('grandir') !== -1 &&
      arrive.indexOf('reste petite') !== -1 && arrive.indexOf('porte pas') === -1 &&
      presque.indexOf('presque le poids') !== -1;
  })());
verifie('le drapeau à damier a disparu du roulage (il dit « arrivée ! », pas « ça roule »)',
  phraseEtat({ v: 30, alt: 0, vz: 0, auSol: true, distance: 0 }, 1).indexOf('🏁') === -1);
verifie('en montée : l’air pousse plus fort que le poids',
  phraseEtat({ v: 80, alt: 40, vz: 5, auSol: false, distance: 0 }).indexOf('monte') !== -1);
verifie('vitesse réduite : il plane, il ne tombe pas',
  phraseEtat({ v: 40, alt: 50, vz: -4, auSol: false, distance: 0 }).indexOf('plane') !== -1);
verifie('curseur à zéro en vol : la phrase explique l’élan (« un avion ne s’arrête pas en l’air »)',
  phraseEtat({ v: VITESSE_PLANE, alt: 50, vz: -4, auSol: false, distance: 0 })
    .indexOf('s’arrête pas en l’air') !== -1);
verifie('en équilibre : les deux flèches sont égales',
  phraseEtat({ v: VITESSE_DECOLLAGE, alt: 50, vz: 0, auSol: false, distance: 0 })
    .indexOf('égales') !== -1);
verifie('la phrase ne contredit JAMAIS le mouvement : petit excès = « il monte doucement », ' +
  'petit manque = « il descend » — « égales » réservé au vrai équilibre',
  (() => {
    // alt 40 : hors de la bande où la phrase raconte les roues qui se rangent
    const monteDoucement = phraseEtat({ v: 56, alt: 40, vz: 0.9, auSol: false, distance: 0 });
    const descendDoucement = phraseEtat({ v: 54, alt: 40, vz: -0.9, auSol: false, distance: 0 });
    return monteDoucement.indexOf('monte doucement') !== -1 &&
      monteDoucement.indexOf('égales') === -1 &&
      descendDoucement.indexOf('descend') !== -1 &&
      descendDoucement.indexOf('égales') === -1;
  })());
verifie('JAMAIS « égales » pendant que ça bouge : juste après l’envol, l’excès est ' +
  'minuscule mais l’avion monte — la phrase le dit (retour de David 2026-09-04)',
  (() => {
    // le mouvement d'abord : « égales » exige une altitude qui ne bouge pas
    const envol = phraseEtat({ v: 56, alt: 2, vz: 0.6, auSol: false, distance: 0 });
    const petitEnvol = phraseEtat({ v: 55.4, alt: 3, vz: 0.5, auSol: false, distance: 0 });
    const glisse = phraseEtat({ v: 54.6, alt: 30, vz: -0.5, auSol: false, distance: 0 });
    const calme = phraseEtat({ v: VITESSE_DECOLLAGE, alt: 3, vz: 0.1, auSol: false, distance: 0 });
    return envol.indexOf('monte') !== -1 && envol.indexOf('égales') === -1 &&
      petitEnvol.indexOf('monte') !== -1 && petitEnvol.indexOf('égales') === -1 &&
      glisse.indexOf('descend') !== -1 && glisse.indexOf('égales') === -1 &&
      calme.indexOf('égales') !== -1;
  })());
verifie('la phrase raconte les roues PILE quand le dessin les bouge : rangées juste ' +
  'au-dessus du seuil en montée, sorties sous le seuil en descente — jamais ailleurs',
  (() => {
    // le dessin rentre les roues dès ALT_ARRONDI : la phrase doit dire vrai
    const range = phraseEtat({ v: 80, alt: ALT_ARRONDI + 4, vz: 2, auSol: false, distance: 0 });
    const sort = phraseEtat({ v: 50, alt: ALT_ARRONDI - 3, vz: -1.5, auSol: false, distance: 0 });
    const hautEnMontee = phraseEtat({ v: 80, alt: 40, vz: 2, auSol: false, distance: 0 });
    const hautEnDescente = phraseEtat({ v: 60, alt: 40, vz: -2, auSol: false, distance: 0 });
    return range.indexOf('se rangent') !== -1 && range.indexOf('monte') !== -1 &&
      sort.indexOf('sort ses roues') !== -1 &&
      hautEnMontee.indexOf('roues') === -1 && hautEnDescente.indexOf('roues') === -1;
  })());
verifie('le plafond n’a plus de phrase à lui : tout en haut, l’équilibre se raconte ' +
  'comme partout (« une vitesse = une altitude » — décision David 2026-09-04)',
  (() => {
    const e0 = { v: VITESSE_MAX, alt: 0, vz: 0, auSol: false, distance: 0 };
    let e = e0;
    for (let t = 0; t < 240; t += 0.05) e = pas(e, 1, 0.05); // il se cale au plafond
    const phrase = phraseEtat(e);
    return phrase.indexOf('Tout en haut') === -1 && phrase.indexOf('trop léger') === -1 &&
      phrase.indexOf('égales') !== -1;
  })());

console.log('Le jeu « Rejoins-les là-haut ! » — les défis de la famille');
verifie('l’hystérésis de sortie est plus large que la fenêtre de victoire (le bravo ne clignote pas)',
  JEU_SORTIE > JEU_FENETRE && JEU_TENUE > 0);
verifie('quatre défis, du ballon au papillon — et leurs fenêtres ne se chevauchent pas',
  (() => {
    if (DEFIS.length !== 4 || DEFIS[DEFIS.length - 1].id !== 'papillon') return false;
    const alts = DEFIS.filter((d) => d.altitude > 0).map((d) => d.altitude).sort((a, b) => a - b);
    for (let i = 1; i < alts.length; i++) {
      if (alts[i] - alts[i - 1] <= 2 * JEU_SORTIE) return false;
    }
    return true;
  })());
verifie('chaque défi volant est GAGNABLE au curseur (fenêtre tenue assez longtemps)',
  (() => {
    for (const defi of DEFIS) {
      if (defi.altitude === 0) continue;
      // la consigne gagnante : viser la vitesse dont l'altitude d'équilibre
      // est celle de l'invité (pile la découverte que le jeu enseigne)
      const vEquilibre = defi.altitude > ALT_AIR_LEGER
        ? VITESSE_DECOLLAGE / Math.sqrt(densiteAir(defi.altitude))
        : VITESSE_DECOLLAGE;
      let e = etatInitial();
      let tenue = 0, meilleure = 0;
      for (let t = 0; t < 90; t += DT) {
        const cible = e.alt < defi.altitude - 10
          ? Math.min(1, (vEquilibre + 14) / VITESSE_MAX)
          : vEquilibre / VITESSE_MAX;
        e = pas(e, cible, DT);
        if (defiDansFenetre(defi, e, JEU_FENETRE)) {
          tenue += DT;
          meilleure = Math.max(meilleure, tenue);
        } else tenue = 0;
      }
      if (meilleure < JEU_TENUE) return false;
    }
    return true;
  })());
verifie('le défi du papillon se gagne en se posant — la révélation à l’envers',
  (() => {
    const papillon = DEFIS[DEFIS.length - 1];
    const enVol = { v: 80, alt: 60, vz: 0, auSol: false, distance: 0 };
    if (defiDansFenetre(papillon, enVol, JEU_FENETRE)) return false;
    const fin = simule(enVol, TIENT(0), 60);
    return defiDansFenetre(papillon, fin, JEU_FENETRE) &&
      papillon.bravo.indexOf('roule') !== -1;
  })());

console.log('Le jeu « Où est… ? » — les phrases des pièces');
verifie('les consignes s’accordent : « Où sont les ailes ? », « Où est le réacteur ? »',
  (() => {
    const ailes = PIECES.filter((p) => p.id === 'ailes')[0];
    const reacteur = PIECES.filter((p) => p.id === 'reacteurs')[0];
    return consignePiece(ailes) === 'Où sont les ailes ?' &&
      consignePiece(reacteur) === 'Où est le réacteur ?' &&
      bravoPiece(ailes).indexOf('étaient') !== -1 &&
      ratePiece(reacteur).indexOf('était') !== -1;
  })());

console.log('Les pièces de l’avion — cinq histoires à taper');
verifie('cinq pièces : ailes, réacteur, cockpit, queue, roues',
  PIECES.length === 5 &&
  ['ailes', 'reacteurs', 'cockpit', 'queue', 'roues']
    .every((id) => PIECES.some((p) => p.id === id)));
verifie('chaque pièce a son nom, sa couleur et son explication — et AUCUN emoji sur sa pastille',
  PIECES.every((p) => p.emoji === undefined && p.label && p.couleur && p.texte && p.texte.length > 40));
verifie('les ailes racontent la révélation (pousser l’air), le réacteur souffle',
  (() => {
    const ailes = PIECES.filter((p) => p.id === 'ailes')[0];
    const reacteur = PIECES.filter((p) => p.id === 'reacteurs')[0];
    return ailes.texte.indexOf('pouss') !== -1 && reacteur.texte.indexOf('souffle') !== -1;
  })());

console.log('Couleurs sémantiques et affichage');
verifie('l’air, le poids et l’avion ont chacun leur couleur, toutes différentes',
  COULEUR_AIR !== COULEUR_POIDS && COULEUR_AIR !== COULEUR_AVION &&
  COULEUR_POIDS !== COULEUR_AVION);
verifie('« ton avion » porte le rose de la série (l’ancre « chez toi »)',
  COULEUR_AVION === '#ff6b9d');
verifie('vitesse et altitude parlantes pour le parent : 55 → 220 km/h, 100 → 4 000 m',
  formatVitesse(VITESSE_DECOLLAGE) === '220 km/h' &&
  formatAltitude(ALTITUDE_MAX) === '4 000 m' && formatAltitude(10) === '400 m');
verifie('le décor défile : la distance parcourue grandit avec la vitesse',
  (() => {
    const e0 = { v: 60, alt: 50, vz: 0, auSol: false, distance: 0 };
    const fin = simule(e0, TIENT(0.6), 5);
    return fin.distance > 4 * 60 && fin.distance < 6.5 * 60;
  })());

console.log('Honnêteté pédagogique');
verifie('le mythe du « chemin plus long » n’apparaît NULLE PART dans les textes',
  (() => {
    let tout = '';
    for (const m of MOMENTS) tout += m.label + m.sub + m.phrase;
    for (const p of PIECES) tout += p.label + p.texte + consignePiece(p) + bravoPiece(p);
    for (const d of DEFIS) tout += d.invite + d.consigne + d.bravo;
    tout += phraseEtat(etatInitial());
    tout += phraseEtat({ v: 80, alt: 40, vz: 5, auSol: false, distance: 0 });
    return tout.indexOf('plus long') === -1 && tout.indexOf('rattrap') === -1;
  })());
verifie('apostrophes typographiques « ’ » partout dans les chaînes UI (jamais le « \' » droit)',
  (() => {
    let tout = '';
    for (const m of MOMENTS) tout += m.label + m.sub + m.phrase;
    for (const p of PIECES) tout += p.label + p.texte + consignePiece(p) + bravoPiece(p) + ratePiece(p);
    for (const d of DEFIS) tout += d.invite + d.consigne + d.bravo;
    tout += phraseEtat(etatInitial());
    return tout.indexOf("'") === -1;
  })());

console.log('');
if (rates > 0) {
  console.error(rates + ' test(s) en échec, ' + reussis + ' réussi(s).');
  process.exit(1);
}
console.log('Tous les tests passent (' + reussis + ').');
