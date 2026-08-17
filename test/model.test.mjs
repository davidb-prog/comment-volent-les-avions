// Tests du modèle — zéro dépendance : `node test/model.test.mjs`
// Vérifie les vérités du site : portance ∝ v² (nulle à l'arrêt), vitesse de
// décollage précise, équilibre de croisière, traînée qui freine, planer moteurs
// coupés, pencher = tourner (plafond doux), toucher toujours doux, jamais de
// crash — et l'absence du mythe du « chemin plus long ».

import {
  TAU, DEG, clamp, clamp01,
  V_MAX, V_TAKEOFF, V_CRUISE, ALT_MAX, ALT_CRUISE,
  WEIGHT, THRUST_MAX, ACCEL, AOA_MIN, AOA_MAX, LIFT_STICK_GAIN,
  VS_MAX, VS_DOWN_MAX, VS_LAND, FLARE_ALT,
  BANK_MAX, TURN_RATE_MAX, T_CRUISE,
  COLOR_LIFT, COLOR_WEIGHT, COLOR_THRUST, COLOR_DRAG, COLOR_PLANE,
  FORCES, thrustForce, dragForce, aoaTrim, liftGround, liftAir, forces,
  turnRate, descentCap, newState, step,
  AUTO_PHASES, phaseIndex, autoStep,
  ENTRY_GROUND, ENTRY_AIR, SCENARIOS,
  statusSide, statusBack, formatSpeed, formatAlt,
} from '../js/model.js';

let failed = 0;
let passed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ✓ ' + name); }
  else { failed++; console.error('  ✗ ' + name + (detail === undefined ? '' : ' — ' + detail)); }
}
const approx = (a, b, eps) => Math.abs(a - b) <= (eps === undefined ? 1e-9 : eps);

// un générateur pseudo-aléatoire à graine : les tests sont reproductibles
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DT = 1 / 30;
function simulate(state, controlsOf, seconds, onStep) {
  let s = state;
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) {
    const prev = s;
    s = step(s, controlsOf(i * DT, s), DT);
    if (onStep) onStep(prev, s, i * DT);
  }
  return s;
}
const HOLD = (throttle, stick, bank) => () => ({ throttle: throttle, stick: stick, bank: bank });

console.log('La portance grandit avec la vitesse (∝ v²) — nulle à l’arrêt');
check('à l’arrêt, portance nulle : un avion posé n’est pas porté du tout',
  liftGround(0, 0) === 0 && liftGround(0, 1) === 0);
check('portance ∝ v² sur la piste : doubler la vitesse la multiplie par 4',
  approx(liftGround(40, 0), 4 * liftGround(20, 0)) &&
  approx(liftGround(30, 0) / liftGround(10, 0), 9));
check('un avion posé ne s’envole jamais tout seul (moteurs coupés, il ne bouge pas)',
  (() => {
    const end = simulate(newState(), HOLD(0, 1, 0), 10);
    return end.onGround && end.v === 0 && end.alt === 0;
  })());
check('la flèche de portance ne dépend que de la vitesse au roulage (manche neutre)',
  approx(forces({ v: 30, alt: 0, onGround: true }, { throttle: 1, stick: 0, bank: 0 }).lift,
    liftGround(30, 0)));

console.log('La vitesse de décollage — la portance dépasse le poids');
check('à V_TAKEOFF pile (manche neutre), portance = poids exactement',
  approx(liftGround(V_TAKEOFF, 0), WEIGHT));
check('en dessous : portance < poids ; au-dessus : portance > poids',
  liftGround(V_TAKEOFF - 5, 0) < WEIGHT && liftGround(V_TAKEOFF + 5, 0) > WEIGHT);
check('plein gaz depuis l’arrêt : l’avion décolle, et pile autour de V_TAKEOFF',
  (() => {
    let liftoffV = -1;
    simulate(newState(), HOLD(1, 0, 0), 30, (prev, s) => {
      if (prev.onGround && !s.onGround && liftoffV < 0) liftoffV = s.v;
    });
    return liftoffV >= V_TAKEOFF - 0.5 && liftoffV <= V_TAKEOFF + 3;
  })());
check('tirer le manche fait décoller un peu plus tôt (la rotation), jamais plus tard',
  (() => {
    let v1 = -1;
    simulate(newState(), HOLD(1, 0.5, 0), 30, (prev, s) => {
      if (prev.onGround && !s.onGround && v1 < 0) v1 = s.v;
    });
    return v1 > 0 && v1 < V_TAKEOFF;
  })());

console.log('La croisière stable — portance = poids et poussée = traînée');
check('à V_CRUISE avec la poussée de croisière : poussée = traînée exactement',
  approx(thrustForce(T_CRUISE), dragForce(V_CRUISE)));
check('en vol stabilisé à V_CRUISE (manche neutre) : portance = poids exactement',
  approx(liftAir(V_CRUISE, 0), WEIGHT));
check('l’équilibre tient : 30 s de croisière sans bouger ni vitesse ni altitude',
  (() => {
    const s0 = Object.assign(newState(), ENTRY_AIR, { heading: 0, x: 0, y: 0 });
    const end = simulate(s0, HOLD(T_CRUISE, 0, 0), 30);
    return approx(end.v, V_CRUISE, 0.5) && approx(end.alt, ALT_CRUISE, 0.5) &&
      Math.abs(end.vs) < 0.2 && !end.onGround;
  })());
check('le réglage automatique en vol : à toute vitesse de croisière raisonnable, ' +
  'manche neutre = portance ≈ poids (l’avion se règle tout seul)',
  (() => {
    for (let v = 50; v <= 105; v += 5) {
      if (!approx(liftAir(v, 0), WEIGHT, 0.02)) return false;
    }
    return true;
  })());

console.log('La traînée freine toujours, et grandit avec la vitesse');
check('traînée nulle à l’arrêt, croissante ensuite',
  dragForce(0) === 0 && dragForce(40) > dragForce(20) && dragForce(80) > dragForce(40));
check('plein gaz, poussée = traînée pile à V_MAX (la vitesse plafonne toute seule)',
  approx(thrustForce(1), dragForce(V_MAX)));
check('moteurs coupés en croisière : l’avion RALENTIT et descend doucement — il plane',
  (() => {
    const s0 = Object.assign(newState(), ENTRY_AIR);
    let ok = true;
    let minVs = 0;
    const end = simulate(s0, HOLD(0, 0, 0), 20, (prev, s) => {
      if (s.v > prev.v + 1e-9) ok = false;         // il ne peut que ralentir
      minVs = Math.min(minVs, s.vs);
    });
    return ok && end.v < V_CRUISE && minVs < -0.5 && minVs >= -VS_DOWN_MAX - 1e-6;
  })());
check('il ne tombe JAMAIS comme une pierre : descente plafonnée à VS_DOWN_MAX partout',
  (() => {
    const s0 = Object.assign(newState(), ENTRY_AIR, { alt: ALT_MAX });
    let ok = true;
    simulate(s0, HOLD(0, -1, 0), 60, (prev, s) => {
      if (s.vs < -VS_DOWN_MAX - 1e-6) ok = false;
    });
    return ok;
  })());
check('moteurs coupés, l’histoire finit bien : posé, roues arrêtées',
  (() => {
    const s0 = Object.assign(newState(), ENTRY_AIR, { alt: ALT_MAX });
    const end = simulate(s0, HOLD(0, 0, 0), 120);
    return end.onGround && end.v < 2;
  })());

console.log('Pencher les ailes = tourner (la portance penchée, pas un volant)');
check('ailes à plat : aucune envie de tourner', turnRate(0, false) === 0);
check('au sol, pencher ne fait pas tourner (il faut voler !)',
  turnRate(BANK_MAX, true) === 0);
check('plus on penche, plus le virage est serré (strictement croissant)',
  (() => {
    let prev = 0;
    for (let b = 0.1; b <= 1; b += 0.1) {
      const r = turnRate(b * BANK_MAX, false);
      if (r <= prev) return false;
      prev = r;
    }
    return true;
  })());
check('le plafond doux : pencher « trop » ne tourne jamais plus fort qu’à BANK_MAX',
  approx(turnRate(BANK_MAX, false), TURN_RATE_MAX) &&
  approx(turnRate(BANK_MAX * 2, false), TURN_RATE_MAX) &&
  approx(turnRate(-BANK_MAX * 3, false), -TURN_RATE_MAX));
check('pencher à gauche tourne à gauche, à droite tourne à droite',
  turnRate(-0.3, false) < 0 && turnRate(0.3, false) > 0);
check('les deux regards sont d’accord : le cap ne change QUE si les ailes sont penchées',
  (() => {
    const s0 = Object.assign(newState(), ENTRY_AIR);
    const straight = simulate(s0, HOLD(T_CRUISE, 0, 0), 10);
    const turning = simulate(s0, HOLD(T_CRUISE, 0.3, 0.6), 10);
    return approx(straight.heading, 0, 1e-6) && Math.abs(turning.heading) > 0.5;
  })());
check('la trajectoire s’incurve : en virage tenu, l’avion revient vers son cap + un tour',
  (() => {
    const s0 = Object.assign(newState(), ENTRY_AIR);
    const end = simulate(s0, HOLD(T_CRUISE + 0.06, 0.3, 1), 30);
    return end.heading > TAU * 0.8 && !end.onGround;
  })());
check('en virage, la portance penchée tient un peu moins en l’air : ' +
  'sans tirer le manche, l’avion descend doucement (et jamais brutalement)',
  (() => {
    const s0 = Object.assign(newState(), ENTRY_AIR);
    let minVs = 0;
    const end = simulate(s0, HOLD(T_CRUISE, 0, 1), 12, (prev, s) => {
      minVs = Math.min(minVs, s.vs);
    });
    return end.alt < ALT_CRUISE && minVs < -0.3 && minVs >= -VS_DOWN_MAX - 1e-6;
  })());

console.log('L’atterrissage — l’arrondi automatique, le toucher toujours doux');
check('le plafond de descente se resserre près du sol : VS_DOWN_MAX là-haut, VS_LAND au ras',
  approx(descentCap(0), VS_LAND) && approx(descentCap(FLARE_ALT), VS_DOWN_MAX) &&
  descentCap(FLARE_ALT / 2) > VS_LAND && descentCap(FLARE_ALT / 2) < VS_DOWN_MAX);
check('gaz réduits depuis la croisière : l’avion descend, se pose, et le toucher est doux',
  (() => {
    const s0 = Object.assign(newState(), ENTRY_AIR);
    let touchVs = null;
    const end = simulate(s0, HOLD(0.05, -0.2, 0), 90, (prev, s) => {
      if (!prev.onGround && s.onGround && touchVs === null) touchVs = prev.vs;
    });
    return end.onGround && touchVs !== null && Math.abs(touchVs) <= VS_LAND + 0.3;
  })());

console.log('Jamais punitif — aucune combinaison de commandes ne produit de crash');
{
  const rand = mulberry32(20260817);
  let okAlt = true, okNaN = true, okTouch = true, landings = 0;
  for (let run = 0; run < 40; run++) {
    const airborne = rand() < 0.75;
    const alt = airborne ? 5 + rand() * 95 : 0;
    let s = {
      v: rand() * 110,
      alt: alt,
      vs: airborne ? -descentCap(alt) + rand() * (VS_MAX + descentCap(alt)) : 0,
      bank: (rand() * 2 - 1) * BANK_MAX,
      heading: rand() * TAU,
      x: 0, y: 0,
      onGround: !airborne,
    };
    let controls = { throttle: rand(), stick: rand() * 2 - 1, bank: rand() * 2 - 1 };
    let nextChange = 0;
    simulate(s, (t) => {
      if (t >= nextChange) {
        controls = { throttle: rand(), stick: rand() * 2 - 1, bank: rand() * 2 - 1 };
        nextChange = t + 0.5 + rand() * 2.5;
      }
      return controls;
    }, 60, (prev, cur) => {
      if (cur.alt < 0) okAlt = false;
      if (!isFinite(cur.v) || !isFinite(cur.alt) || !isFinite(cur.vs) ||
          !isFinite(cur.bank) || !isFinite(cur.heading)) okNaN = false;
      if (!prev.onGround && cur.onGround) {
        landings++;
        if (Math.abs(prev.vs) > VS_LAND + 0.3) okTouch = false;
      }
    });
  }
  check('40 vols aux commandes folles (graine fixe) : l’altitude ne passe jamais sous le sol', okAlt);
  check('aucune valeur ne part en vrille (pas de NaN, pas d’infini)', okNaN);
  check('CHAQUE retour au sol est un toucher doux (' + landings + ' atterrissages observés)',
    okTouch && landings > 0);
}
check('depuis n’importe quel état, gaz coupés : l’avion finit posé, roues arrêtées',
  (() => {
    const rand = mulberry32(42);
    for (let run = 0; run < 12; run++) {
      const s0 = {
        v: rand() * 110, alt: 5 + rand() * 95, vs: VS_MAX * (rand() * 2 - 1),
        bank: (rand() * 2 - 1) * BANK_MAX, heading: rand() * TAU,
        x: 0, y: 0, onGround: false,
      };
      const end = simulate(s0, HOLD(0, 0, 0), 120);
      if (!end.onGround || end.v >= 2) return false;
    }
    return true;
  })());

console.log('Le tour d’avion automatique — le phénomène vit tout seul, en boucle');
{
  let s = newState();
  let auto = { index: 0, t: 0 };
  let tookOff = false, cruised = false, banked = false, landedBack = false, looped = false;
  let phase = AUTO_PHASES[0];
  for (let t = 0; t < 400; t += DT) {
    const r = autoStep(auto, s, DT);
    auto = r.auto; phase = r.phase;
    const prev = s;
    s = step(s, { throttle: phase.throttle, stick: phase.stick, bank: phase.bank }, DT);
    if (!s.onGround) tookOff = true;
    if (s.alt >= ALT_CRUISE - 1) cruised = true;
    if (Math.abs(s.bank) > 15 * DEG) banked = true;
    if (tookOff && !prev.onGround && s.onGround) landedBack = true;
    if (landedBack && phase.id === 'montee') { looped = true; break; }
  }
  check('l’avion décolle tout seul', tookOff);
  check('il atteint l’altitude de croisière', cruised);
  check('il penche les ailes pour son virage', banked);
  check('il revient se poser', landedBack);
  check('et le tour recommence (la boucle du spectacle)', looped);
}
check('chaque phase du tour a une fin garantie (dur ou maxDur) — pas de blocage possible',
  AUTO_PHASES.every((p) => p.dur !== undefined || p.maxDur !== undefined));

console.log('Les scénarios — quatre moments, deux regards à chaque fois');
check('quatre scénarios : décollage, croisière, virage, atterrissage',
  SCENARIOS.length === 4 &&
  SCENARIOS[0].id === 'decollage' && SCENARIOS[1].id === 'croisiere' &&
  SCENARIOS[2].id === 'virage' && SCENARIOS[3].id === 'atterrissage');
check('chaque scénario part d’un état d’entrée valide et joue des phases connues',
  SCENARIOS.every((scn) =>
    (scn.entry === ENTRY_GROUND || scn.entry === ENTRY_AIR) &&
    scn.phases.length > 0 && scn.phases.every((id) => phaseIndex(id) >= 0)));
check('chaque histoire a sa version « de côté » ET sa version « de derrière »',
  SCENARIOS.every((s) => s.cote.length > 40 && s.derriere.length > 40));
check('le décollage raconte la course des flèches (l’air qui dépasse le poids)',
  SCENARIOS[0].cote.indexOf('dépasse') !== -1);
check('la croisière raconte l’équilibre des 4 flèches',
  SCENARIOS[1].cote.indexOf('équilibre') !== -1);
check('le virage raconte « pas de volant : on penche »',
  (SCENARIOS[2].cote + SCENARIOS[2].derriere).indexOf('penche') !== -1 &&
  SCENARIOS[2].cote.indexOf('volant') !== -1);
check('l’atterrissage promet le toucher tout doux',
  SCENARIOS[3].cote.indexOf('doux') !== -1);

console.log('Les phrases d’état — le même instant, deux regards d’accord');
check('posé à l’arrêt : « pas de vitesse, l’air ne porte pas »',
  statusSide(newState(), { throttle: 0, stick: 0, bank: 0 }).indexOf('l’air ne porte pas') !== -1);
check('au roulage : la flèche de l’air grandit',
  statusSide({ v: 30, alt: 0, vs: 0, bank: 0, onGround: false ? 0 : true },
    { throttle: 1, stick: 0, bank: 0 }).indexOf('grandit') !== -1);
check('en montée : l’air pousse plus fort que le poids',
  statusSide({ v: 70, alt: 30, vs: 5, bank: 0, onGround: false },
    { throttle: 0.8, stick: 0.5, bank: 0 }).indexOf('monte') !== -1);
check('moteurs réduits : il plane, il ne tombe pas',
  statusSide({ v: 50, alt: 50, vs: -4, bank: 0, onGround: false },
    { throttle: 0, stick: 0, bank: 0 }).indexOf('plane') !== -1);
check('vue de derrière : à plat = tout droit, penché = ça tourne (du bon côté)',
  statusBack({ v: 65, alt: 60, vs: 0, bank: 0, onGround: false }).indexOf('droit') !== -1 &&
  statusBack({ v: 65, alt: 60, vs: 0, bank: 0.3, onGround: false }).indexOf('droite') !== -1 &&
  statusBack({ v: 65, alt: 60, vs: 0, bank: -0.3, onGround: false }).indexOf('gauche') !== -1);

console.log('Couleurs sémantiques et affichage');
check('chaque force a sa couleur, toutes différentes (et l’avion a la sienne)',
  (() => {
    const cols = [COLOR_LIFT, COLOR_WEIGHT, COLOR_THRUST, COLOR_DRAG, COLOR_PLANE];
    const seen = {};
    for (const c of cols) {
      if (seen[c]) return false;
      seen[c] = true;
    }
    return FORCES.length === 4 && FORCES[0].color === COLOR_LIFT &&
      FORCES[1].color === COLOR_WEIGHT && FORCES[2].color === COLOR_THRUST &&
      FORCES[3].color === COLOR_DRAG;
  })());
check('« ton avion » porte le rose de la série (l’ancre « chez toi » de l’astronomie)',
  COLOR_PLANE === '#ff6b9d');
check('vitesse et altitude parlantes pour le parent : 65 → 260 km/h, 60 → 2 400 m',
  formatSpeed(V_CRUISE) === '260 km/h' && formatAlt(ALT_CRUISE) === '2 400 m' &&
  formatAlt(10) === '400 m');
check('le décor défile : la distance parcourue grandit avec la vitesse',
  (() => {
    const s0 = Object.assign(newState(), ENTRY_AIR);
    const end = simulate(s0, HOLD(T_CRUISE, 0, 0), 5);
    return end.dist > 4 * V_CRUISE && end.dist < 6 * V_CRUISE;
  })());

console.log('Honnêteté pédagogique');
check('le mythe du « chemin plus long » n’apparaît NULLE PART dans le modèle',
  (() => {
    let all = '';
    for (const scn of SCENARIOS) all += scn.label + scn.sub + scn.cote + scn.derriere;
    for (const f of FORCES) all += f.label + f.sub;
    const states = [
      statusSide(newState(), { throttle: 0, stick: 0, bank: 0 }),
      statusSide({ v: 70, alt: 30, vs: 5, bank: 0, onGround: false }, { throttle: 1, stick: 0.5, bank: 0 }),
      statusBack({ v: 65, alt: 60, vs: 0, bank: 0.4, onGround: false }),
    ];
    all += states.join('');
    return all.indexOf('plus long') === -1 && all.indexOf('rattrap') === -1;
  })());
check('apostrophes typographiques « ’ » partout dans les chaînes UI (jamais le « \' » droit)',
  (() => {
    let all = '';
    for (const scn of SCENARIOS) all += scn.label + scn.sub + scn.cote + scn.derriere;
    for (const f of FORCES) all += f.label + f.sub;
    all += statusSide(newState(), { throttle: 0, stick: 0, bank: 0 });
    all += statusBack(newState());
    return all.indexOf("'") === -1;
  })());

console.log('');
if (failed > 0) {
  console.error(failed + ' test(s) en échec, ' + passed + ' réussi(s).');
  process.exit(1);
}
console.log('Tous les tests passent (' + passed + ').');
