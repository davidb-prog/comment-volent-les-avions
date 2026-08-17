// Câblage de l'interface : boucle d'animation, manette des gaz, glissers sur
// les deux vues (haut/bas = monter/descendre, gauche/droite = pencher),
// tour d'avion automatique, scénarios racontés, plein écran, conteur vocal.
// Les deux vues montrent TOUJOURS le même instant du même vol — c'est le cœur
// du site : le même vol, deux regards.

import { clamp, clamp01, newState, step, forces, autoStep, AUTO_PHASES,
         phaseIndex, SCENARIOS, ENTRY_GROUND, ALT_CRUISE,
         statusSide, statusBack, formatSpeed, formatAlt } from './model.js';
import { SideView } from './side.js';
import { BackView } from './back.js';

const $ = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const sim = {
  state: newState(),
  controls: { throttle: 0, stick: 0, bank: 0 },     // les commandes réelles (lissées)
  targets: { throttle: 0, stick: 0, bank: 0 },      // vers quoi elles glissent
  playing: !reduceMotion, // le tour d'avion automatique (décollage → … → atterrissage)
  auto: { index: 0, t: 0 },
  scn: null,              // { scn, queue, idx, t, tween } pendant un scénario
};
let activeScn = null; // le scénario affiché — nul dès qu'on reprend la main

const side = new SideView($('side-view'));
const back = new BackView($('back-view'));

// vitesses de réponse des commandes (unité de commande / s) : tout est doux
const RATE = { throttle: 0.9, stick: 2.2, bank: 1.8 };

// ---- lecture / pause : le tour d'avion automatique ----

function setPlaying(p) {
  sim.playing = p;
  const btn = $('btn-spin');
  btn.textContent = p ? '⏸ Pause' : '▶ Le tour tout seul';
  btn.setAttribute('aria-pressed', p ? 'true' : 'false');
  if (p) {
    // on reprend le tour là où l'état de l'avion nous place, jamais en arrière
    const s = sim.state;
    let id = 'roule';
    if (s.onGround && s.v < 2) id = 'attente';
    else if (!s.onGround) id = s.alt < ALT_CRUISE - 10 ? 'montee' : 'croisiere';
    sim.auto = { index: phaseIndex(id), t: 0 };
  }
}

function setActiveScenario(id) {
  for (const key in scnButtons) {
    scnButtons[key].classList.toggle('active', key === id);
    scnButtons[key].setAttribute('aria-pressed', key === id ? 'true' : 'false');
  }
}

// L'enfant reprend la main : plus d'automatique, plus de scénario.
function stopAuto() {
  sim.scn = null;
  activeScn = null;
  if (sim.playing) setPlaying(false);
  setActiveScenario(null);
}

function toggleSpin() {
  sim.scn = null;
  activeScn = null;
  setActiveScenario(null);
  setPlaying(!sim.playing);
}

$('btn-spin').addEventListener('click', toggleSpin);
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.target.closest('button, input, a, summary, select')) {
    e.preventDefault();
    toggleSpin();
  }
});

// ---- la manette des gaz ----

const throttleEl = $('throttle');
let throttleHeld = false;
throttleEl.addEventListener('input', () => {
  stopAuto();
  sim.targets.throttle = clamp01(+throttleEl.value / 100);
});
throttleEl.addEventListener('pointerdown', () => { throttleHeld = true; });
window.addEventListener('pointerup', () => { throttleHeld = false; });
window.addEventListener('pointercancel', () => { throttleHeld = false; });

function hideHint() {
  const hint = $('drag-hint');
  if (hint) hint.classList.add('hide');
}
setTimeout(hideHint, 8000);

// ---- glisser sur les vues = piloter, petit tap = pause/lecture ----
// Sur la vue de côté : glisser vers le HAUT tire le manche (on monte).
// Sur la vue de derrière : glisser à GAUCHE/DROITE penche les ailes.

function wireDrag(canvas, opts) {
  let dragging = false, moved = 0, downT = 0, unlocked = false, downX = 0, downY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    unlocked = false;
    downX = e.clientX; downY = e.clientY; moved = 0; downT = performance.now();
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    hideHint();
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    moved += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
    const dx = e.clientX - downX, dy = e.clientY - downY;
    if (!unlocked && Math.abs(opts.axis === 'y' ? dy : dx) > 8) {
      unlocked = true;
      stopAuto();
    }
    if (unlocked) opts.move(dx, dy);
  });
  const release = () => {
    if (dragging && moved <= 6 && performance.now() - downT < 600) toggleSpin();
    if (unlocked) opts.release();
    dragging = false;
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', () => {
    if (unlocked) opts.release();
    dragging = false;
  });
}

wireDrag($('side-view'), {
  axis: 'y',
  // un quart de la hauteur de la vue sous le doigt = manche à fond
  move: (dx, dy) => {
    const span = Math.max(60, $('side-view').clientHeight * 0.25);
    sim.targets.stick = clamp(-dy / span, -1, 1);
  },
  release: () => { sim.targets.stick = 0; }, // le manche revient au neutre, en douceur
});

wireDrag($('back-view'), {
  axis: 'x',
  // un tiers de la largeur de la vue sous le doigt = inclinaison à fond
  move: (dx) => {
    const span = Math.max(60, $('back-view').clientWidth * 0.33);
    sim.targets.bank = clamp(dx / span, -1, 1);
  },
  release: () => { sim.targets.bank = 0; }, // les ailes reviennent à plat, en douceur
});

// Le pilotage au clavier, sur chaque vue (les canvas sont focusables).
function wireKeys(canvas, keys) {
  canvas.addEventListener('keydown', (e) => {
    const act = keys[e.key];
    if (!act) return;
    e.preventDefault();
    stopAuto();
    act();
  });
  canvas.addEventListener('keyup', (e) => {
    if (keys[e.key] && keys._reset) keys._reset();
  });
}
wireKeys($('side-view'), {
  ArrowUp: () => { sim.targets.stick = 0.8; },
  ArrowDown: () => { sim.targets.stick = -0.8; },
  _reset: () => { sim.targets.stick = 0; },
});
wireKeys($('back-view'), {
  ArrowLeft: () => { sim.targets.bank = -0.8; },
  ArrowRight: () => { sim.targets.bank = 0.8; },
  _reset: () => { sim.targets.bank = 0; },
});

// ---- plein écran de la scène (API native, repli CSS pour iOS) ----

const stagePanel = $('stage-panel');
const fsBtn = $('fs-toggle');

function setFsUi(active) {
  fsBtn.textContent = active ? '✕ Quitter le plein écran' : '⛶ Plein écran';
}
fsBtn.addEventListener('click', () => {
  if (document.fullscreenElement === stagePanel) { document.exitFullscreen(); return; }
  if (stagePanel.classList.contains('fs-fallback')) {
    stagePanel.classList.remove('fs-fallback');
    setFsUi(false);
    return;
  }
  if (stagePanel.requestFullscreen) {
    const p = stagePanel.requestFullscreen();
    if (p && p.then) {
      p.then(null, () => { stagePanel.classList.add('fs-fallback'); setFsUi(true); });
    }
    return;
  }
  stagePanel.classList.add('fs-fallback');
  setFsUi(true);
});
document.addEventListener('fullscreenchange', () => {
  setFsUi(document.fullscreenElement === stagePanel);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && stagePanel.classList.contains('fs-fallback')) {
    stagePanel.classList.remove('fs-fallback');
    setFsUi(false);
  }
});

// ---- les boutons-scénarios et leurs micro-histoires ----

const scnButtons = {};
const scnBox = $('scenario-buttons');
for (const scn of SCENARIOS) {
  const btn = document.createElement('button');
  btn.className = 'scn scn-' + scn.id;
  btn.setAttribute('aria-pressed', 'false');
  const em = document.createElement('span');
  em.className = 'scn-emoji';
  em.textContent = scn.emoji;
  const lab = document.createElement('span');
  lab.textContent = scn.label;
  const sub = document.createElement('span');
  sub.className = 'scn-sub';
  sub.textContent = scn.sub;
  btn.appendChild(em); btn.appendChild(lab); btn.appendChild(sub);
  btn.addEventListener('click', () => runScenario(scn));
  scnBox.appendChild(btn);
  scnButtons[scn.id] = btn;
}

function renderInvite() {
  const box = $('story');
  box.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'story-invite';
  p.textContent = 'Appuie sur un bouton : ton avion joue le moment choisi, puis on raconte le même instant deux fois — vu de côté, et vu de derrière.';
  box.appendChild(p);
}

function renderStory(scn) {
  const box = $('story');
  box.innerHTML = '';
  const lines = [
    { cls: 'story-chip-cote', chip: '🛩️ vu de côté', text: scn.cote },
    { cls: 'story-chip-derriere', chip: '🧭 vu de derrière', text: scn.derriere },
  ];
  for (const line of lines) {
    const row = document.createElement('div');
    row.className = 'story-line';
    const chip = document.createElement('span');
    chip.className = 'story-chip ' + line.cls;
    chip.textContent = line.chip;
    const txt = document.createElement('p');
    txt.className = 'story-text';
    txt.textContent = line.text;
    row.appendChild(chip); row.appendChild(txt);
    box.appendChild(row);
  }
}

// L'avion GLISSE en douceur vers l'état de départ du scénario (jamais de
// marche arrière brutale), puis joue ses phases — la physique fait le reste.
function runScenario(scn) {
  setPlaying(false);
  setActiveScenario(scn.id);
  renderStory(scn);
  activeScn = scn;
  tellScenario(); // la version sonore, si le parent l'a activée
  const from = {
    v: sim.state.v, alt: sim.state.alt, vs: sim.state.vs, bank: sim.state.bank,
  };
  const firstPhase = AUTO_PHASES[phaseIndex(scn.phases[0])];
  sim.targets = {
    throttle: firstPhase.throttle, stick: firstPhase.stick, bank: firstPhase.bank,
  };
  sim.scn = {
    scn: scn,
    queue: scn.phases,
    idx: 0,
    t: 0,
    tween: reduceMotion ? null : {
      from: from, to: scn.entry, start: performance.now(), dur: 1400,
    },
  };
  if (reduceMotion) applyEntry(scn.entry);
}

function applyEntry(entry) {
  const s = sim.state;
  s.v = entry.v; s.alt = entry.alt; s.vs = entry.vs; s.bank = entry.bank;
  s.onGround = entry.onGround;
}

// ---- mise à jour des textes (seulement quand ils changent) ----

const cache = {};
function setText(key, el, value) {
  if (cache[key] === value) return;
  cache[key] = value;
  el.textContent = value;
}

function updateTexts() {
  setText('speed', $('speed-out'), formatSpeed(sim.state.v));
  setText('alt', $('alt-out'), formatAlt(sim.state.alt));
  setText('side', $('side-status'), statusSide(sim.state, sim.controls));
  setText('back', $('back-status'), statusBack(sim.state));
  if (!throttleHeld) throttleEl.value = Math.round(sim.controls.throttle * 100);
}

// ---- boucle d'animation ----

const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;

// chaque commande glisse vers sa cible, à sa vitesse — tout reste doux
function easeControls(dt) {
  for (const key in RATE) {
    const cur = sim.controls[key], tgt = sim.targets[key];
    const maxStep = RATE[key] * dt;
    sim.controls[key] = Math.abs(tgt - cur) <= maxStep
      ? tgt
      : cur + Math.sign(tgt - cur) * maxStep;
  }
}

// le scénario en cours : d'abord la glissade d'entrée, puis les phases
function scnFrame(ms, dt) {
  const run = sim.scn;
  if (run.tween) {
    const tw = run.tween;
    const k = Math.min(1, (ms - tw.start) / tw.dur);
    const e = easeInOut(k);
    const s = sim.state;
    s.v = lerp(tw.from.v, tw.to.v, e);
    s.alt = lerp(tw.from.alt, tw.to.alt, e);
    s.vs = lerp(tw.from.vs, tw.to.vs, e);
    s.bank = lerp(tw.from.bank, tw.to.bank, e);
    s.onGround = k >= 1 ? tw.to.onGround : false;
    if (tw.to.onGround && tw.from.alt <= 0.01) s.onGround = true; // déjà posé
    if (k >= 1) run.tween = null;
    return false; // pendant la glissade, la physique attend son tour
  }
  const phase = AUTO_PHASES[phaseIndex(run.queue[run.idx])];
  sim.targets = { throttle: phase.throttle, stick: phase.stick, bank: phase.bank };
  run.t += dt;
  const dur = phase.dur !== undefined ? phase.dur : phase.maxDur;
  const finished = (phase.done && phase.done(sim.state)) ||
    (dur !== undefined && run.t >= dur);
  if (finished && run.idx < run.queue.length - 1) {
    run.idx++;
    run.t = 0;
  }
  // la dernière phase se prolonge : l'avion reste dans son moment, tout doux
  return true;
}

let lastMs = performance.now();
function frame(ms) {
  try {
    const dt = Math.min((ms - lastMs) / 1000, 0.1);
    lastMs = ms;
    let physics = true;
    if (sim.scn) {
      physics = scnFrame(ms, dt);
    } else if (sim.playing) {
      const r = autoStep(sim.auto, sim.state, dt);
      sim.auto = r.auto;
      sim.targets = {
        throttle: r.phase.throttle, stick: r.phase.stick, bank: r.phase.bank,
      };
    }
    easeControls(dt);
    if (physics) sim.state = step(sim.state, sim.controls, dt);
    sim.state.forces = forces(sim.state, sim.controls);
    side.draw(sim.state, sim.controls);
    back.remember(sim.state, dt);
    back.draw(sim.state);
    updateTexts();
  } finally {
    // la boucle survit à un raté de rendu ponctuel (canvas en cours de layout…)
    requestAnimationFrame(frame);
  }
}

// ---- le conteur : une seule voix pour tout le site — la boîte « L'air est
// costaud ! » ET la version sonore des scénarios. La synthèse vocale du
// navigateur lit hors-ligne, rien n'est envoyé nulle part. Même conteur que
// les labos d'astronomie : on note chaque voix française et on prend d'office
// la plus douce — français de France et voix « naturelles » d'abord, voix
// robotiques et accents lointains en dernier — et un petit menu laisse les
// parents en changer (choix partagé entre les labos via localStorage). ----

// une phrase par bulle (les longs textes d'une traite se font couper) ; la
// dernière phrase du bloc marque une vraie respiration
function sentenceChunks(text, endPara) {
  const bits = text.replace(/\s+/g, ' ').match(/[^.!?…]+[.!?…]*/g) || [];
  const out = [];
  for (const b of bits) { if (b.trim()) out.push({ text: b.trim(), endPara: false }); }
  if (out.length && endPara) out[out.length - 1].endPara = true;
  return out;
}

const listenBtn = $('btn-listen');
const voiceSel = $('voice-pick');
const voiceHint = $('voice-hint');
let narrator = null; // { speak(chunks, onDone), stop() } — null sans synthèse vocale

if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
  let frVoices = [];
  let chosenURI = null;
  // même clé que les labos d'astronomie : sur github.io (même origine), la
  // voix choisie par la famille se partage d'un labo à l'autre — c'est voulu
  try { chosenURI = window.localStorage.getItem('ltt-voice'); } catch (e) { /* mode privé */ }

  const voiceScore = (v) => {
    const lang = (v.lang || '').replace('_', '-').toLowerCase();
    const name = (v.name || '').toLowerCase();
    let s = 0;
    if (lang.indexOf('fr-fr') === 0) s += 60;      // le français de France d'abord
    else if (lang.indexOf('fr') === 0) s += 20;
    if (lang.indexOf('fr-ca') === 0) s -= 30;      // l'accent québécois surprend ici
    // les voix neurales (Edge, Google…) et « premium » sont bien plus naturelles
    if (/natural|neural|online|premium|enhanced|am[ée]lior[ée]e|siri/.test(name)) s += 30;
    if (name.indexOf('google') !== -1) s += 24;
    if (/audrey|thomas|aur[ée]lie|marie|denise|henri|[ée]lo[ïi]se|vivienne|r[ée]my|jacqueline|charline|coralie|hortense/.test(name)) s += 12;
    if (!v.localService) s += 6;
    // les moteurs d'appoint et les voix rigolotes, très robotiques, en dernier
    if (/espeak|eloquence|compact|robot/.test(name)) s -= 50;
    if (/eddy|\bflo\b|grandma|grandpa|\breed\b|rocko|sandy|shelley|jester|bells|organ|superstar|trinoids|whisper|zarvox|bad news|bahh|boing|bubbles|cellos|wobble/.test(name)) s -= 40;
    return s;
  };

  const prettyName = (v) => {
    let n = v.name.replace(/^microsoft\s+/i, '')
      .replace(/\s*[-–—]\s*(french|fran[çc]ais).*$/i, '')
      .replace(/\s*\((french|fran[çc]ais)[^)]*\)\s*$/i, '');
    const lang = (v.lang || '').replace('_', '-');
    if (lang && lang.toLowerCase().indexOf('fr-fr') !== 0) n += ' · ' + lang;
    return n;
  };

  const refreshVoices = () => {
    const all = window.speechSynthesis.getVoices();
    frVoices = [];
    for (const v of all) {
      if ((v.lang || '').replace('_', '-').toLowerCase().indexOf('fr') === 0) frVoices.push(v);
    }
    frVoices.sort((a, b) => voiceScore(b) - voiceScore(a));
    if (voiceSel) {
      voiceSel.innerHTML = '';
      for (const v of frVoices) {
        const opt = document.createElement('option');
        opt.value = v.voiceURI;
        opt.textContent = prettyName(v);
        voiceSel.appendChild(opt);
      }
      let known = false;
      for (const v of frVoices) { if (v.voiceURI === chosenURI) known = true; }
      if (known) voiceSel.value = chosenURI;
      voiceSel.hidden = frVoices.length < 2;
    }
    if (voiceHint) {
      // en dessous de ce score, l'appareil n'a que des voix métalliques :
      // on souffle aux parents comment en obtenir une plus douce
      const best = frVoices.length ? voiceScore(frVoices[0]) : -1;
      voiceHint.hidden = best >= 84;
    }
  };
  refreshVoices();
  if ('onvoiceschanged' in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }

  const pickVoice = () => {
    for (const v of frVoices) { if (v.voiceURI === chosenURI) return v; }
    return frVoices.length ? frVoices[0] : null;
  };

  // une lecture à la fois : gen invalide les onend des lectures annulées, et
  // le onDone de la lecture précédente est toujours prévenu qu'elle s'achève
  let gen = 0;
  let curDone = null;
  const settle = () => { const d = curDone; curDone = null; if (d) d(); };
  const stopSpeaking = () => { gen++; window.speechSynthesis.cancel(); settle(); };

  // ton de conteur : les phrases s'enchaînent avec de vraies pauses, sur un
  // débit posé, et un peu de relief là où le texte s'exclame ou questionne
  // (la synthèse du navigateur n'offre que rate et pitch — on s'en sert)
  const speakChunks = (chunks, onDone) => {
    stopSpeaking();
    refreshVoices(); // certaines listes de voix n'arrivent qu'après le chargement
    const myGen = gen;
    curDone = onDone || null;
    const voice = pickVoice();
    let at = 0;
    const speakNext = () => {
      if (myGen !== gen) return;
      if (at >= chunks.length) { settle(); return; }
      const c = chunks[at++];
      const u = new SpeechSynthesisUtterance(c.text);
      u.lang = voice ? voice.lang : 'fr-FR';
      if (voice) u.voice = voice;
      u.rate = 0.92; u.pitch = 1.04;
      if (/!\s*$/.test(c.text)) { u.rate = 0.96; u.pitch = 1.14; }  // l'émerveillement
      else if (/\?\s*$/.test(c.text)) { u.pitch = 1.12; }           // la question
      else if (c.text.indexOf('…') !== -1) { u.rate = 0.87; }       // le suspens
      u.onend = () => {
        if (myGen !== gen) return;
        window.setTimeout(speakNext, c.endPara ? 620 : 300);
      };
      u.onerror = () => { if (myGen === gen) settle(); };
      window.speechSynthesis.speak(u);
    };
    speakNext();
  };
  narrator = { speak: speakChunks, stop: stopSpeaking };

  // -- « Écouter l'histoire » : la boîte-révélation, phrase à phrase --
  listenBtn.hidden = false;
  let reading = false;
  const resetListen = () => {
    reading = false;
    listenBtn.textContent = '🔊 Écouter l’histoire';
    listenBtn.setAttribute('aria-pressed', 'false');
  };
  const startReading = () => {
    const chunks = [];
    const paras = $('explain-text').querySelectorAll('p');
    for (const para of paras) {
      for (const c of sentenceChunks(para.textContent, true)) chunks.push(c);
    }
    speakChunks(chunks, resetListen);
    reading = true;
    listenBtn.textContent = '⏹ Arrêter';
    listenBtn.setAttribute('aria-pressed', 'true');
  };
  listenBtn.addEventListener('click', () => {
    if (reading) { stopSpeaking(); return; } // le onDone remet le bouton
    startReading();
  });
  if (voiceSel) {
    voiceSel.addEventListener('change', () => {
      chosenURI = voiceSel.value;
      try { window.localStorage.setItem('ltt-voice', chosenURI); } catch (e) { /* tant pis */ }
      if (reading) startReading(); // on réécoute tout de suite avec la nouvelle voix
    });
  }
  window.addEventListener('pagehide', () => { window.speechSynthesis.cancel(); });
} else {
  $('btn-scn-voice').hidden = true; // pas de synthèse vocale : pas de version sonore
}

// ---- la version sonore des scénarios : quand l'enfant choisit un moment, le
// conteur raconte le même instant deux fois — vu de côté, puis vu de
// derrière. On ne lit pas les bulles écrites telles quelles : à l'oral, il
// manque les enchaînements — le conteur ajoute « Vu de côté… » et
// « Et maintenant, vu de derrière… », et retire les émojis, imprononçables. ----

const scnVoiceBtn = $('btn-scn-voice');
let scnVoiceOn = false;
// même clé que les labos d'astronomie : la famille qui a déjà activé la voix
// là-bas la retrouve ici (même origine github.io) — c'est voulu
try { scnVoiceOn = window.localStorage.getItem('ltt-scn-voice') === '1'; } catch (e) { /* mode privé */ }

function setScnVoiceUi() {
  scnVoiceBtn.textContent = scnVoiceOn ? '🔊 la voix raconte' : '🔇 sans la voix';
  scnVoiceBtn.setAttribute('aria-pressed', scnVoiceOn ? 'true' : 'false');
}
setScnVoiceUi();
scnVoiceBtn.addEventListener('click', () => {
  scnVoiceOn = !scnVoiceOn;
  try { window.localStorage.setItem('ltt-scn-voice', scnVoiceOn ? '1' : '0'); } catch (e) { /* tant pis */ }
  setScnVoiceUi();
  if (!narrator) return;
  if (scnVoiceOn) tellScenario(); else narrator.stop();
});

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;

function spokenStory(scn) {
  // retirer un émoji laisse un espace orphelin devant le point final — et un
  // « . » isolé se fait lire « point » par certaines voix : on le recolle
  const clean = (t) => t.replace(EMOJI_RE, '').replace(/\s+/g, ' ')
    .replace(/\s+\./g, '.').trim();
  const chunks = [{ text: 'Vu de côté…', endPara: false }];
  for (const c of sentenceChunks(clean(scn.cote), true)) chunks.push(c);
  chunks.push({ text: 'Et maintenant, vu de derrière…', endPara: false });
  for (const c of sentenceChunks(clean(scn.derriere), true)) chunks.push(c);
  return chunks;
}

function tellScenario() {
  if (narrator && scnVoiceOn && activeScn) {
    narrator.speak(spokenStory(activeScn));
  }
}

renderInvite();
setPlaying(sim.playing);
requestAnimationFrame(frame);
