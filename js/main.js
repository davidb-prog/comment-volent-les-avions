// Câblage de l'interface : la boucle d'animation, LE grand curseur de vitesse
// (le geste unique de l'épisode), le bouton ⏸/▶ de la lecture automatique,
// les trois boutons-moments, les pièces de l'avion, et le conteur vocal de la
// famille. Un geste = un effet : le curseur règle la vitesse, tout en découle.

import { VITESSE_MAX, REPERE_DECOLLAGE, TOUR_DUREE,
         etatInitial, pas, cibleAuto, MOMENTS, etapeMoment, phraseEtat,
         PIECES, formatVitesse, formatAltitude, borne01,
         DEFIS, JEU_FENETRE, JEU_SORTIE, JEU_TENUE, defiDansFenetre,
         consignePiece, bravoPiece, ratePiece } from './model.js';
import { VueCote } from './vue-cote.js';
import { VuePieces } from './vue-pieces.js';

const $ = (id) => document.getElementById(id);
const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const sim = {
  etat: etatInitial(),
  cible: 0,               // la consigne du curseur (0..1)
  lecture: !mouvementReduit, // le tour automatique (décollage → vol → atterrissage)
  tAuto: 0,               // l'horloge du tour automatique
  moment: null,           // { moment, indice } pendant un bouton-moment
};

// « Rejoins-les là-haut ! » — fenêtre + tenue + hystérésis (patron des défis
// de la famille) : `gagne` = le bravo est affiché (il s'efface si on ressort
// de la fenêtre élargie), `acquis` = « Encore une ! » reste, `bravoLu` = le
// bravo ne se relit pas quand on ressort puis revient.
const jeu = { actif: false, indice: 0, tenue: 0, gagne: false, acquis: false, bravoLu: false };

// « Où est… ? » — le jeu des pièces : un ordre mélangé, une pièce à trouver.
const jeuPieces = { actif: false, ordre: [], indice: 0 };

const vueCote = new VueCote($('vue-cote'));
const vuePieces = new VuePieces($('vue-pieces'));

// Safari iOS ignore user-scalable : le filet anti-pincement de la famille
document.addEventListener('gesturestart', (e) => e.preventDefault());

// ---- lecture / pause : le tour automatique (bouton ⏸/▶ SEULEMENT) ----

function regleLecture(active) {
  sim.lecture = active;
  $('btn-lecture').setAttribute('aria-pressed', active ? 'true' : 'false');
  if (active) {
    // on reprend le tour là où l'état de l'avion nous place, jamais en arrière
    const e = sim.etat;
    if (e.auSol && e.v < 2) sim.tAuto = 0;
    else if (e.auSol) sim.tAuto = 5;
    else sim.tAuto = 14; // en l'air : plein vol
  }
}

// L'enfant reprend la main : plus d'automatique, plus de moment affiché
// (et la voix du moment se tait — l'état affiché suit les changements).
function prendreLaMain() {
  if (sim.moment) {
    sim.moment = null;
    montreInvite();
    regleMomentActif(null);
    if (conteur) conteur.stop();
  }
  if (sim.lecture) regleLecture(false);
}

function basculeLecture() {
  const enCours = sim.lecture;
  prendreLaMain();
  regleLecture(!enCours);
}
$('btn-lecture').addEventListener('click', basculeLecture);
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.target.closest('button, input, a, summary')) {
    e.preventDefault();
    basculeLecture();
  }
});

// au redimensionnement, on redessine même en pause (canvas et pastilles)
window.addEventListener('resize', () => { cache.premierDessin = false; });

// ---- LE grand curseur de vitesse ----

const curseur = $('curseur');
let curseurTenu = false;
curseur.addEventListener('input', () => {
  prendreLaMain();
  sim.cible = borne01(+curseur.value / 100);
});
curseur.addEventListener('pointerdown', () => { curseurTenu = true; });
window.addEventListener('pointerup', () => { curseurTenu = false; });
window.addEventListener('pointercancel', () => { curseurTenu = false; });

// le repère « ici, il s'envole ! » se pose pile sur la vitesse de décollage
// du modèle — une seule source de vérité
document.querySelector('.repere-envol').style.left = (REPERE_DECOLLAGE * 100) + '%';

// ---- les trois boutons-moments et leur phrase ----

const boutonsMoments = {};
const cadreMoments = $('moments-boutons');
for (const moment of MOMENTS) {
  const btn = document.createElement('button');
  btn.className = 'moment moment-' + moment.id;
  btn.setAttribute('aria-pressed', 'false');
  const em = document.createElement('span');
  em.className = 'moment-emoji';
  em.textContent = moment.emoji;
  const nom = document.createElement('span');
  nom.textContent = moment.label;
  const sub = document.createElement('span');
  sub.className = 'moment-sub';
  sub.textContent = moment.sub;
  btn.appendChild(em); btn.appendChild(nom); btn.appendChild(sub);
  btn.addEventListener('click', () => lanceMoment(moment));
  cadreMoments.appendChild(btn);
  boutonsMoments[moment.id] = btn;
}

function regleMomentActif(id) {
  for (const cle in boutonsMoments) {
    boutonsMoments[cle].classList.toggle('actif', cle === id);
    boutonsMoments[cle].setAttribute('aria-pressed', cle === id ? 'true' : 'false');
  }
}

function montreInvite() {
  const boite = $('histoire');
  boite.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'histoire-invite';
  p.textContent = 'Appuie sur un bouton : le curseur bouge tout seul, ton avion joue le moment choisi, et on te le raconte.';
  boite.appendChild(p);
}

function montrePhrase(moment) {
  const boite = $('histoire');
  boite.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'histoire-phrase';
  p.style.borderLeftColor = moment.id === 'decollage' ? 'var(--feu)' : 'var(--rose-deep)';
  p.textContent = moment.phrase;
  boite.appendChild(p);
}

function lanceMoment(moment) {
  regleLecture(false);
  sim.moment = { moment: moment, indice: 0 };
  regleMomentActif(moment.id);
  montrePhrase(moment);
  raconteMoment(); // la version sonore, si le parent a allumé la voix
}

// ---- mise à jour des textes (seulement quand ils changent) ----

const cache = {};
function poseTexte(cle, el, valeur) {
  if (cache[cle] === valeur) return;
  cache[cle] = valeur;
  el.textContent = valeur;
}

function majTextes() {
  poseTexte('vitesse', $('vitesse-txt'), formatVitesse(sim.etat.v));
  poseTexte('altitude', $('altitude-txt'), formatAltitude(sim.etat.alt));
  poseTexte('etat', $('phrase-etat'), phraseEtat(sim.etat, sim.cible));
  // un bouton-moment se grise quand il n'a pas de sens (décoller en vol,
  // atterrir déjà posé) — sauf celui du moment en cours, qui reste allumé
  for (const moment of MOMENTS) {
    const utile = moment.dispo(sim.etat) ||
      (sim.moment !== null && sim.moment.moment.id === moment.id);
    if (cache['btn-' + moment.id] !== utile) {
      cache['btn-' + moment.id] = utile;
      boutonsMoments[moment.id].disabled = !utile;
    }
  }
  // le curseur montre la CONSIGNE (jamais la valeur lissée : il ne « revient
  // pas en arrière » sous le doigt) — et il suit la lecture automatique
  if (!curseurTenu) {
    const v = Math.round(sim.cible * 100);
    if (cache.curseur !== v) { cache.curseur = v; curseur.value = v; }
  }
}

// ---- boucle d'animation (résiliente : le rAF suivant est garanti) ----

let dernierMs = performance.now();
function image(ms) {
  try {
    const dt = Math.min((ms - dernierMs) / 1000, 0.1);
    dernierMs = ms;
    if (sim.moment) {
      const r = etapeMoment(sim.moment.moment, sim.moment.indice, sim.etat);
      sim.moment.indice = r.indice;
      sim.cible = r.cible;
    } else if (sim.lecture) {
      sim.tAuto = (sim.tAuto + dt) % TOUR_DUREE;
      sim.cible = cibleAuto(sim.tAuto);
    }
    // en pause complète et tout posé, on ne redessine pas (batterie) — sauf
    // si une pièce est choisie (son anneau respire) ou qu'un jeu est ouvert
    const vif = sim.lecture || sim.moment || !sim.etat.auSol || sim.etat.v > 0.05 ||
      sim.cible > 0.001 || vuePieces.choisie !== null || jeu.actif || !cache.premierDessin;
    if (vif) {
      cache.premierDessin = true;
      sim.etat = pas(sim.etat, sim.cible, dt);
      majJeu(dt);
      const invite = jeu.actif
        ? { id: DEFIS[jeu.indice].id, altitude: DEFIS[jeu.indice].altitude, gagne: jeu.gagne }
        : null;
      vueCote.dessine(sim.etat, sim.cible, invite, mouvementReduit ? 0 : ms / 500);
      vuePieces.dessine(mouvementReduit ? 0 : ms);
      poseBoutonsPieces();
      majTextes();
    }
  } finally {
    requestAnimationFrame(image);
  }
}

// ---- le conteur : une seule voix pour tout le site — la boîte « Pourquoi »,
// les moments, et les pièces (à la demande). Synthèse vocale du navigateur :
// hors ligne, rien ne part sur Internet. Sans synthèse, les boutons sonores
// se cachent et le site reste complet. ----

// une phrase par bulle (les longs textes d'une traite se font couper) ; la
// dernière phrase du bloc marque une vraie respiration
function phrasesDe(texte, finDeBloc) {
  const bouts = texte.replace(/\s+/g, ' ').match(/[^.!?…]+[.!?…]*/g) || [];
  const sortie = [];
  for (const b of bouts) { if (b.trim()) sortie.push({ text: b.trim(), endPara: false }); }
  if (sortie.length && finDeBloc) sortie[sortie.length - 1].endPara = true;
  return sortie;
}

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;
// retirer un émoji laisse un espace orphelin devant le point final — et un
// « . » isolé se fait lire « point » par certaines voix : on le recolle
function pourLaVoix(t) {
  return t.replace(EMOJI, '').replace(/\s+/g, ' ').replace(/\s+\./g, '.').trim();
}

const btnEcouter = $('btn-ecouter');
const conseilVoix = $('conseil-voix');
let conteur = null; // { parle(bulles, fini), stop() } — nul sans synthèse vocale

if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
  let voixFr = [];

  // noter chaque voix française et prendre d'office la plus douce (le menu de
  // choix des premiers épisodes est un héritage : le score choisit seul)
  const scoreVoix = (v) => {
    const langue = (v.lang || '').replace('_', '-').toLowerCase();
    const nom = (v.name || '').toLowerCase();
    let s = 0;
    if (langue.indexOf('fr-fr') === 0) s += 60;
    else if (langue.indexOf('fr') === 0) s += 20;
    if (langue.indexOf('fr-ca') === 0) s -= 30;
    if (/natural|neural|online|premium|enhanced|am[ée]lior[ée]e|siri/.test(nom)) s += 30;
    if (nom.indexOf('google') !== -1) s += 24;
    if (/audrey|thomas|aur[ée]lie|marie|denise|henri|[ée]lo[ïi]se|vivienne|r[ée]my|jacqueline|charline|coralie|hortense/.test(nom)) s += 12;
    if (!v.localService) s += 6;
    if (/espeak|eloquence|compact|robot/.test(nom)) s -= 50;
    if (/eddy|\bflo\b|grandma|grandpa|\breed\b|rocko|sandy|shelley|jester|bells|organ|superstar|trinoids|whisper|zarvox|bad news|bahh|boing|bubbles|cellos|wobble/.test(nom)) s -= 40;
    return s;
  };

  const rafraichitVoix = () => {
    const toutes = window.speechSynthesis.getVoices();
    voixFr = [];
    for (const v of toutes) {
      if ((v.lang || '').replace('_', '-').toLowerCase().indexOf('fr') === 0) voixFr.push(v);
    }
    voixFr.sort((a, b) => scoreVoix(b) - scoreVoix(a));
    if (conseilVoix) {
      // en dessous de ce score, l'appareil n'a que des voix métalliques :
      // on souffle aux parents comment en obtenir une plus douce
      const meilleur = voixFr.length ? scoreVoix(voixFr[0]) : -1;
      conseilVoix.hidden = meilleur >= 84;
    }
  };
  rafraichitVoix();
  if ('onvoiceschanged' in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = rafraichitVoix;
  }

  // une lecture à la fois : gen invalide les onend des lectures annulées, et
  // le fini() de la lecture précédente est toujours prévenu qu'elle s'achève
  let gen = 0;
  let finiEnCours = null;
  const acheve = () => { const f = finiEnCours; finiEnCours = null; if (f) f(); };
  const coupe = () => { gen++; window.speechSynthesis.cancel(); acheve(); };

  // ton de conteur : débit posé, un peu de relief là où le texte s'exclame
  const parle = (bulles, fini) => {
    coupe();
    rafraichitVoix(); // certaines listes de voix n'arrivent qu'après le chargement
    const maGen = gen;
    finiEnCours = fini || null;
    const voix = voixFr.length ? voixFr[0] : null;
    let i = 0;
    const suivante = () => {
      if (maGen !== gen) return;
      if (i >= bulles.length) { acheve(); return; }
      const b = bulles[i++];
      const u = new SpeechSynthesisUtterance(b.text);
      u.lang = voix ? voix.lang : 'fr-FR';
      if (voix) u.voice = voix;
      u.rate = 0.92; u.pitch = 1.04;
      if (/!\s*$/.test(b.text)) { u.rate = 0.96; u.pitch = 1.14; }  // l'émerveillement
      else if (/\?\s*$/.test(b.text)) { u.pitch = 1.12; }           // la question
      else if (b.text.indexOf('…') !== -1) { u.rate = 0.87; }       // le suspens
      u.onend = () => {
        if (maGen !== gen) return;
        window.setTimeout(suivante, b.endPara ? 620 : 300);
      };
      u.onerror = () => { if (maGen === gen) acheve(); };
      window.speechSynthesis.speak(u);
    };
    suivante();
  };
  conteur = { parle: parle, stop: coupe };

  // -- « 🔊 Écouter l'histoire » : la boîte-explication, phrase à phrase --
  btnEcouter.hidden = false;
  let enLecture = false;
  const reposeEcouter = () => {
    enLecture = false;
    btnEcouter.textContent = '🔊 Écouter l’histoire';
    btnEcouter.setAttribute('aria-pressed', 'false');
  };
  btnEcouter.addEventListener('click', () => {
    if (enLecture) { coupe(); return; } // le fini() remet le bouton
    const bulles = [];
    const paras = $('explication-texte').querySelectorAll('p');
    for (const p of paras) {
      for (const b of phrasesDe(pourLaVoix(p.textContent), true)) bulles.push(b);
    }
    parle(bulles, reposeEcouter);
    enLecture = true;
    btnEcouter.textContent = '⏹ Arrêter';
    btnEcouter.setAttribute('aria-pressed', 'true');
  });

  // partir ailleurs coupe le conteur net (règle de la famille)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') coupe();
  });
  window.addEventListener('pagehide', coupe); // vieux Safari en secours
} else {
  // pas de synthèse vocale : pas de version sonore (les trois jumeaux se cachent)
  $('btn-son').hidden = true;
  $('btn-son-jeu').hidden = true;
  $('btn-son-pieces').hidden = true;
}

// ---- le bouton 🔇/🔊 : la voix des moments, des défis et des pièces — UN
// seul état, trois jumeaux (moments, jeu, pièces : le réglage à portée de
// main sans remonter la page). Clé de la FAMILLE, partagée entre tous les
// labos (même origine petit-labo.fr) ; l'ancienne clé de l'astronomie est
// lue une fois, en secours, pour ne pas perdre le réglage ----

const boutonsSon = [$('btn-son'), $('btn-son-jeu'), $('btn-son-pieces')];
let sonActif = false;
try {
  const son = window.localStorage.getItem('petit-labo-son');
  sonActif = son !== null ? son === '1' : window.localStorage.getItem('ltt-scn-voice') === '1';
} catch (e) { /* mode privé */ }

function majBoutonSon() {
  for (const b of boutonsSon) b.setAttribute('aria-pressed', sonActif ? 'true' : 'false');
}
majBoutonSon();
for (const b of boutonsSon) {
  b.addEventListener('click', () => {
    sonActif = !sonActif;
    try { window.localStorage.setItem('petit-labo-son', sonActif ? '1' : '0'); } catch (e) { /* tant pis */ }
    majBoutonSon();
    if (!conteur) return;
    if (sonActif) raconteMoment(); else conteur.stop();
  });
}

function parleTexte(texte) {
  if (conteur && sonActif) conteur.parle(phrasesDe(pourLaVoix(texte), true));
}

function raconteMoment() {
  if (sim.moment) parleTexte(sim.moment.moment.phrase);
}

// ---- « 🎮 Rejoins-les là-haut ! » — LE jeu de l'épisode : un invité attend
// à SON altitude, l'enfant règle la vitesse pour voler à sa hauteur. Fenêtre
// de victoire + tenue, hystérésis de sortie, le bravo ne ment jamais ; rien
// ne se gagne pendant la lecture automatique ou un moment (c'est l'enfant
// qui fabrique sa victoire, pas l'animation). ----

const defiTexteEl = $('defi-texte');

function montreConsigneDefi(defi, parler) {
  defiTexteEl.className = 'defi-texte';
  defiTexteEl.textContent = defi.consigne;
  if (parler) parleTexte(defi.consigne);
}

function lanceDefi(indice) {
  jeu.indice = indice;
  jeu.tenue = 0;
  jeu.gagne = false;
  jeu.acquis = false;
  jeu.bravoLu = false;
  $('btn-encore').hidden = true;
  montreConsigneDefi(DEFIS[indice], true);
}

function majJeu(dt) {
  if (!jeu.actif) return;
  if (sim.moment || sim.lecture) return; // rien ne se gagne pendant une animation
  const defi = DEFIS[jeu.indice];
  if (!jeu.gagne) {
    if (defiDansFenetre(defi, sim.etat, JEU_FENETRE)) {
      jeu.tenue += dt;
      if (jeu.tenue >= JEU_TENUE) {
        jeu.gagne = true;
        defiTexteEl.className = 'defi-texte bravo';
        defiTexteEl.textContent = '🌟 ' + defi.bravo;
        if (!jeu.bravoLu) { jeu.bravoLu = true; parleTexte(defi.bravo); }
        if (!jeu.acquis) { jeu.acquis = true; $('btn-encore').hidden = false; }
      }
    } else {
      jeu.tenue = 0;
    }
  } else if (!defiDansFenetre(defi, sim.etat, JEU_SORTIE)) {
    // le bravo ne ment jamais : ressorti de la fenêtre (élargie), il se range —
    // la consigne revient, « Encore une ! » reste acquis
    jeu.gagne = false;
    jeu.tenue = 0;
    montreConsigneDefi(DEFIS[jeu.indice], false);
  }
}

function reglerJeu(actif) {
  jeu.actif = actif;
  $('btn-jeu').setAttribute('aria-pressed', actif ? 'true' : 'false');
  $('jeu-corps').hidden = !actif;
  if (actif) {
    prendreLaMain(); // ouvrir le jeu met la lecture en pause (règle de la famille)
    if (sim.lecture) regleLecture(false);
    lanceDefi(0);
  } else if (conteur) {
    conteur.stop();
  }
}
$('btn-jeu').addEventListener('click', () => reglerJeu(!jeu.actif));
$('btn-encore').addEventListener('click', () => {
  lanceDefi((jeu.indice + 1) % DEFIS.length);
});

// ---- « Découvre ton avion » : une pastille-bouton par pièce. Taper affiche
// l'explication ; la voix ne part JAMAIS toute seule au tap (règle de la
// famille) — le petit bouton 🔊 la lit à la demande. ----

const cadrePieces = $('pieces-cadre');
const boutonsPieces = {};
// les pastilles sont de simples POINTS colorés (pas d'emoji — retour de
// David 2026-09-03 : ils cachaient les pièces et jouaient aux devinettes) ;
// la zone de tap reste large (44 px), le point dessiné est petit
for (const piece of PIECES) {
  const btn = document.createElement('button');
  btn.className = 'piece-btn';
  btn.style.setProperty('--c', piece.couleur);
  btn.setAttribute('aria-pressed', 'false');
  btn.setAttribute('aria-label', piece.label + ' — découvrir cette pièce');
  btn.addEventListener('click', () => { tapePiece(piece, btn); });
  cadrePieces.appendChild(btn);
  boutonsPieces[piece.id] = btn;
}

// affiche une pièce : l'anneau sur le dessin et la ligne écrite
function montrePiece(piece) {
  vuePieces.choisie = piece.id;
  for (const id in boutonsPieces) {
    boutonsPieces[id].setAttribute('aria-pressed', id === piece.id ? 'true' : 'false');
  }
  const texteEl = $('piece-texte');
  texteEl.innerHTML = '';
  const gras = document.createElement('strong');
  gras.textContent = piece.label + ' — ';
  gras.style.color = piece.couleur;
  texteEl.appendChild(gras);
  texteEl.appendChild(document.createTextNode(piece.texte));
}

// ---- « Où est… ? » — le mode jeu du panneau : le site demande une pièce,
// l'enfant la trouve. La bonne : bravo + son histoire en récompense. Une
// autre : elle frétille et dit son nom PAR ÉCRIT (jamais punitif, et on
// apprend quand même). ----

const piecesDefiEl = $('pieces-defi');
const btnSuivante = $('btn-pieces-suivante');

function pieceCherchee() {
  for (const p of PIECES) { if (p.id === jeuPieces.ordre[jeuPieces.indice]) return p; }
  return null;
}

function melangePieces() {
  const ordre = PIECES.map((p) => p.id);
  for (let i = ordre.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = ordre[i]; ordre[i] = ordre[j]; ordre[j] = t;
  }
  jeuPieces.ordre = ordre;
  jeuPieces.indice = 0;
}

function montreConsignePieces(parler) {
  const piece = pieceCherchee();
  piecesDefiEl.className = 'defi-texte pieces-defi';
  piecesDefiEl.textContent = '🔍 ' + consignePiece(piece);
  if (parler) parleTexte(consignePiece(piece));
}

function tapePiece(piece, btn) {
  if (!jeuPieces.actif) {
    // mode libre : la pastille est un choix de contenu, comme un moment —
    // son histoire se lit si la voix de la famille est allumée (le bouton
    // 🔊 par pièce, redondant avec 🔇/🔊, a été retiré — David 2026-09-03)
    montrePiece(piece);
    parleTexte(piece.label + '. ' + piece.texte);
    return;
  }
  const cherchee = pieceCherchee();
  if (!cherchee) return;
  if (piece.id === cherchee.id) {
    montrePiece(piece); // l'histoire de la pièce est la récompense
    jeuPieces.indice++;
    const fini = jeuPieces.indice >= jeuPieces.ordre.length;
    piecesDefiEl.className = 'defi-texte pieces-defi bravo';
    piecesDefiEl.textContent = '🌟 ' + bravoPiece(piece) +
      (fini ? ' Tu connais ton avion par cœur !' : '');
    parleTexte(bravoPiece(piece) + (fini ? ' Tu connais ton avion par cœur !' : ''));
    btnSuivante.textContent = fini ? '🎲 Encore une partie !' : '🎲 Pièce suivante !';
    btnSuivante.hidden = false;
  } else {
    // raté : la pastille frétille et dit son nom par écrit — pas de voix au
    // mauvais tap (règle de la famille), pas de punition
    btn.classList.remove('tremble');
    void btn.offsetWidth; // relance l'animation
    btn.classList.add('tremble');
    piecesDefiEl.className = 'defi-texte pieces-defi rate';
    piecesDefiEl.textContent = ratePiece(piece) + ' ' + consignePiece(pieceCherchee());
  }
}

function reglerJeuPieces(actif) {
  jeuPieces.actif = actif;
  $('btn-jeu-pieces').setAttribute('aria-pressed', actif ? 'true' : 'false');
  // c'est la ZONE (hauteur réservée) qui apparaît : pendant le jeu, messages
  // et bouton s'y relaient sans jamais faire bouger le cadre du dessin
  $('pieces-defi-zone').hidden = !actif;
  btnSuivante.hidden = true;
  if (actif) {
    melangePieces();
    montreConsignePieces(true);
  } else if (conteur) {
    conteur.stop();
  }
}
$('btn-jeu-pieces').addEventListener('click', () => reglerJeuPieces(!jeuPieces.actif));
btnSuivante.addEventListener('click', () => {
  btnSuivante.hidden = true;
  if (jeuPieces.indice >= jeuPieces.ordre.length) melangePieces(); // nouvelle partie
  montreConsignePieces(true);
});

// repose les pastilles sur le dessin quand la taille du cadre change
let taillePieces = '';
function poseBoutonsPieces() {
  if (!vuePieces.geometrie) return;
  const signature = vuePieces.geometrie.w + 'x' + vuePieces.geometrie.h;
  if (signature === taillePieces) return;
  taillePieces = signature;
  for (const piece of PIECES) {
    const ancre = vuePieces.ancreDe(piece.id);
    if (!ancre) continue;
    boutonsPieces[piece.id].style.left = ancre.x + 'px';
    boutonsPieces[piece.id].style.top = ancre.y + 'px';
  }
}

montreInvite();
regleLecture(sim.lecture);
requestAnimationFrame(image);
