// Helpers canvas partagés par les deux vues — repris de la série astronomie,
// adaptés au thème clair. Aucune constante du modèle ici : de la tuyauterie.

import { TAU } from './model.js';

// Ajuste le buffer du canvas à sa taille CSS (net sur écrans denses) et
// renvoie le contexte prêt à dessiner en coordonnées CSS.
export function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const bw = Math.max(1, Math.round(w * dpr)), bh = Math.max(1, Math.round(h * dpr));
  if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx: ctx, w: w, h: h };
}

// Texte avec halo clair : lisible sur le ciel comme sur l'herbe.
// `clampW`/`clampH` : garde le texte à l'intérieur du canvas (mesure réelle).
export function label(ctx, text, x, y, opts) {
  const o = opts || {};
  const size = o.size || 11;
  const weight = o.weight || 700;
  const align = o.align || 'left';
  ctx.font = weight + ' ' + size + 'px system-ui, sans-serif';
  if (o.clampW) {
    const tw = ctx.measureText(text).width;
    if (align === 'left') x = Math.min(x, o.clampW - tw - 5);
    else if (align === 'right') x = Math.max(x, tw + 5);
    else x = Math.max(tw / 2 + 5, Math.min(x, o.clampW - tw / 2 - 5));
  }
  if (o.clampH) y = Math.max(size * 0.7 + 3, Math.min(y, o.clampH - size * 0.7 - 3));
  ctx.textAlign = align;
  ctx.textBaseline = o.baseline || 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = o.halo || 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = Math.max(3, size * 0.3);
  ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = o.color || 'rgba(28, 53, 80, 0.9)';
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
}

// Une flèche de force, bien ronde et bien visible : trait épais + pointe pleine.
// `len` en pixels (déjà mis à l'échelle par la vue), `angle` en radians
// (0 = vers la droite, −π/2 = vers le haut).
export function drawArrow(ctx, x, y, angle, len, color, width) {
  if (len < 3) return;
  const wdt = width || 7;
  const hx = x + Math.cos(angle) * len;
  const hy = y + Math.sin(angle) * len;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = wdt;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  const ah = Math.max(9, wdt * 1.7);
  ctx.beginPath();
  ctx.moveTo(hx + Math.cos(angle) * ah, hy + Math.sin(angle) * ah);
  ctx.lineTo(hx + Math.cos(angle + 2.4) * ah, hy + Math.sin(angle + 2.4) * ah);
  ctx.lineTo(hx + Math.cos(angle - 2.4) * ah, hy + Math.sin(angle - 2.4) * ah);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Un nuage rond et joueur.
export function drawCloud(ctx, x, y, k, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha === undefined ? 0.9 : alpha;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 13 * k, 0, TAU);
  ctx.arc(x + 14 * k, y - 6 * k, 10 * k, 0, TAU);
  ctx.arc(x + 28 * k, y, 11 * k, 0, TAU);
  ctx.arc(x + 14 * k, y + 5 * k, 10 * k, 0, TAU);
  ctx.fill();
  ctx.restore();
}
