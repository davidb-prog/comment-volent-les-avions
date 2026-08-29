# Comment volent les avions ? — contexte projet

Premier épisode du « **Petit labo de physique** » (série sœur du « Petit labo
d'astronomie ») : site statique d'une page qui explique à une enfant de 5 ans (le parent
lit à voix haute) pourquoi les avions volent. Français uniquement. En ligne à terme sur
<https://petit-labo.fr/comment-volent-les-avions/>.

La grande révélation : **l'air est costaud**. Quand l'avion va vite, l'air le porte —
**pas de vitesse, pas d'envol**. L'aile pousse l'air vers le bas, alors l'air pousse
l'aile vers le haut (action-réaction). Refrain : « … parce que l'air pousse ! ».
Kicker : « Petit labo de physique » — **sans numéro d'épisode** (l'ordre vit dans le
registre du skill petit-labo, jamais dans l'interface).

⚠️ **REFONTE 2026-08-19, décidée par David après essai en famille** : la première version
(deux vues synchronisées, cockpit à boutons, quatre scénarios, virage) était trop
compliquée — navigation, gestes ET pédagogie. L'épisode est recentré sur **UNE idée, UNE
vue, UN geste** :

- **Le geste-signature : le grand curseur de vitesse** (le patron du curseur maître de la
  famille). L'enfant pousse la vitesse, tout découle — décollage passé le repère
  « ✨ ici, il s'envole ! » (posé PILE sur `VITESSE_DECOLLAGE/VITESSE_MAX` par main.js),
  plané et atterrissage doux en reculant. Aucun autre geste : pas de glisser sur les
  canvas, pas de tap-pause, pas de cockpit.
- **La vue unique** : la vue de côté avec DEUX flèches (l'air pousse 🟢 / le poids tire
  🟣) — la poussée et la traînée sont parties dans la note aux parents. Des filets d'air
  déviés vers le bas derrière l'aile montrent la CAUSE quand ça va vite.
- **Le virage est SORTI de l'épisode** (pencher = tourner sera un épisode à lui —
  l'ancienne carte du ciel et son médaillon vivent dans l'historique git, branche
  `claude/petit-labo-avions-8eulj1` et commits antérieurs à la refonte).

⚠️ **Mythe INTERDIT** : le « chemin plus long au-dessus de l'aile » (temps de transit
égal) est **faux** — il n'apparaît que signalé comme mythe dans la note aux parents.
L'explication du site : l'air dévié vers le bas + « il faut de la vitesse ».

## Les codes pédagogiques (l'ADN de la famille, appliqué ici)

1. **Une seule grande révélation** en phrase d'enfant, reprise en refrain (accroche,
   boîte 💡, pont).
2. **Public : 5 ans, ne sait pas lire.** Très peu de texte côté enfant ; le vocabulaire
   technique (portance, action-réaction, décrochage…) vit dans la note aux parents et le
   README.
3. **Manipuler d'abord, expliquer ensuite** : le curseur avant la théorie.
4. **Le phénomène vit tout seul** : lecture automatique `cibleAuto(t)` (un tour de
   `TOUR_DUREE` = 85 s : décollage → plein vol → atterrissage → arrêt), commandée
   UNIQUEMENT par le bouton ⏸/▶ (libellés empilés, largeur stable). Un tap sur la vue ne
   fait RIEN. Toucher le curseur rend la main. `prefers-reduced-motion` : pas de lecture
   au chargement.
5. **Trois boutons-moments** (🛫 ✈️ 🛬) : le curseur glisse tout seul, toujours vers
   l'avant (le moment décollage se POSE d'abord si l'avion vole), puis UNE phrase — la
   version sonore via le bouton 🔇/🔊 de la famille. Le moment ✈️ pose le curseur PILE
   sur le repère d'envol : les deux flèches deviennent égales (l'équilibre incarné).
6. **Les pièces de l'avion** (🔍 Découvre ton avion) : 5 pastilles (🪶 🔥 🧑‍✈️ 🪁 🛞),
   une histoire écrite chacune, relue par le bouton 🔊 à la demande — **jamais de voix au
   tap** (règle de la famille : sélectionner ne déclenche pas de commentaire audio).
7. **Honnêteté** : vérités protégées par les tests ; simplifications documentées note aux
   parents + README ; l'avion **roule** (jamais « court » — testé).
8. **Jamais punitif** : aucun geste ne produit de crash (testé au curseur fou).

## Contraintes

- **Zéro dépendance, zéro build** ; modules ES ; canvas 2D maison. `python3 -m
  http.server` suffit ; GitHub Pages tel quel.
- **Compat vieux mobiles** : pas de `?.`/`??`, pas de lookbehind, repli `@supports` pour
  `aspect-ratio`, `top/right/bottom/left` plutôt qu'`inset`, préfixes `-webkit-*`.
- **Blindage tactile de la famille** : `user-select: none` sur body (inputs
  resélectionnables), `* { touch-action: pan-x pan-y }`, viewport `maximum-scale=1` +
  filet `gesturestart` ; le curseur porte `touch-action: none`. Les canvas ne sont PAS
  interactifs (la page défile dessus).
- `js/model.js` est **pur** (aucun accès DOM), testé par `node test/model.test.mjs` ;
  toutes les constantes du récit y vivent. **Code en français** (identifiants, fichiers
  de vues `vue-*.js`) — règle de la famille pour le code neuf.
- Boucle rAF résiliente (`try/finally`) ; en pause complète et tout posé, on ne
  redessine pas (batterie) — sauf pièce choisie (anneau qui respire) ; un `resize`
  force un redessin.
- **Identité visuelle** : palette **« Grand ciel de jour »** confirmée par David
  (2026-08-17, re-confirmée à la refonte) : la page EST le ciel — fond `#aed9f7 →
  #eaf5fd`, panneaux blancs translucides, texte `#1c3550`, accent `--rose-deep #b02a5e`.
  Couleurs sémantiques dans `model.js` : l'air `#0b8a72`, le poids `#6a4fd0`, l'avion
  `#ff6b9d`. NOTE pour la charte du portail : le fond « bleu profond d'altitude
  `#123a66` » proposé au registre a été rodé en clair — à reporter dans
  `docs/charte.md` du portail.
- **Marque de la famille** : titres en **Baloo 2** auto-hébergée
  (`assets/fonts/baloo2-latin.woff2`, copiée du portail) via `--titres` — jamais le corps
  ni les boutons ; **fiole de la série physique** (le nuage au trait d'avion, version
  fond clair : traits `#ff9f1c`, nuit dans la fiole) à côté du kicker ; pied de page
  harmonisé (ligne série + bouton fiole maître vers petit-labo.fr) ; pont vers
  l'astronomie avec les médaillons SVG des cartes du portail (pas d'éclipse — décision de
  la famille) ; « or de l'explication » assombri pour fond clair : `--or-explication
  #a06f00` (boîte 💡 et résumé de la note aux parents).
- **Socle SEO** : title question + suffixe, meta description avec « Dès 5 ans, gratuit et
  sans publicité. », canonique `https://petit-labo.fr/comment-volent-les-avions/`,
  JSON-LD `LearningResource`, balises og/twitter + `docs/og.png` (1200×630, générée par
  `tools/build-og.mjs` du portail — la fiole « physique » a été ajoutée au gabarit en
  local, patch à reporter au portail avec l'entrée du registre et `sitemap.xml`).
- **Conteur de la famille** : synthèse vocale, score de voix françaises (pas de menu de
  choix — héritage retiré), clé localStorage **`petit-labo-son`** (secours : lecture
  unique de l'ancienne `ltt-scn-voice`), `visibilitychange` → stop. Voix enregistrée
  (mp3 ElevenLabs) possible plus tard via le skill `generer-voix-petit-labo`, une fois
  les textes figés.
- Commits conventionnels en français ; apostrophe « ’ » dans les chaînes UI. Pas de
  fusion sur `main` sans feu vert explicite de David.

## Vérités à préserver (couvertes par `test/model.test.mjs`)

- La **portance grandit avec la vitesse** (∝ v²) : nulle à l'arrêt — un avion posé ne
  s'envole jamais tout seul.
- L'avion **s'envole quand la portance atteint le poids** : vitesse de décollage précise,
  et le **repère du curseur est posé dessus** (une seule source de vérité).
- **Curseur pile sur le repère : équilibre** — les deux flèches égales, altitude stable.
- **Curseur réduit : il plane** (descente plafonnée), il ne tombe jamais comme une
  pierre ; **toucher toujours doux** (arrondi automatique) ; **jamais punitif** (curseur
  fou testé).
- La **lecture automatique** fait un tour complet et reboucle proprement.
- Le moment décollage décolle vraiment **depuis n'importe quel état** (en se posant
  d'abord — jamais de marche arrière).
- L'avion **roule**, il ne « court » jamais ; pas de mythe ; apostrophes typographiques.

Simplifications assumées et **documentées** (note aux parents + README) — ne pas les
« corriger » sans en parler à David : deux flèches seulement (poussée/traînée dans un
futur épisode) ; monter = excès de portance (en vrai, montée stabilisée = excès de
poussée) ; curseur = vitesse directe ; plané qui laisse fondre la vitesse ; pas de
décrochage ; arrondi automatique ; piste infinie ; le virage = un futur épisode.

## Invariants d'interaction (voulus par David)

- **Un seul geste : le curseur.** Les canvas ne réagissent à rien (pas de tap-pause, pas
  de glisser) — un tap d'enfant ne doit rien déclencher en douce.
- L'avion reste **à poste fixe** à l'écran (le décor défile) ; les flèches sont
  accrochées à lui.
- La lecture auto ne se commande que par ⏸/▶ (ou espace) ; reprendre le curseur met en
  pause ET efface l'histoire du moment affiché (et coupe sa voix).
- Le curseur montre la **consigne** (jamais la valeur lissée) et suit la lecture
  automatique — sauf pendant que le doigt le tient.
- **Seuil mobile unique : 640 px** (CSS seulement — aucun JS de bascule).

## Structure

- `index.html` — page unique : en-tête (fiole + kicker), vue de côté + phrase d'état +
  grand curseur, moments, boîte 💡, pièces, pont (médaillons), note aux parents
  (patron : Comment on s'en sert / Ce que le site simplifie / mot de la fin), pied de
  page harmonisé ; `<head>` SEO complet
- `css/style.css` — Baloo 2, palette de l'épisode, ossature de la famille, curseur
  maître, bascule mobile ≤ 640 px
- `js/model.js` — modèle pur : portance, `pas()`, `cibleAuto()`, MOMENTS, phraseEtat,
  PIECES, couleurs, formats
- `js/canvas.js` — helpers canvas partagés (fitCanvas, flèches, étiquettes à halo)
- `js/vue-cote.js` — LA vue (décor, avion `dessineAvionCote` exporté, deux flèches,
  filets d'air)
- `js/vue-pieces.js` — l'avion en grand, ancres `ANCRES_PIECES`, anneau de sélection
- `js/main.js` — boucle rAF, curseur, lecture auto, moments, pièces, conteur
- `test/model.test.mjs` — tests Node (45 vérifications)
- `assets/fonts/` — Baloo 2 (copiée du portail, licence OFL)

## Vérification navigateur

Suite Playwright dans le scratchpad des sessions (`test-site.cjs`) : desktop,
`prefers-reduced-motion`, mobile tactile 390 px ; zéro erreur console ; sondes de pixels
(attention aux sondes qui tombent sur la flèche du poids ou son étiquette — sonder les
coins) ; `parseInt` sur l'altitude affichée doit retirer l'espace des milliers
(« 1 600 m »). Captures regardées vraiment aux moments clés. Servir avant :
`python3 -m http.server 8123` ; Playwright global : `NODE_PATH=/opt/node22/lib/node_modules`,
`chromium.launch()` avec repli `executablePath: '/opt/pw-browsers/chromium'`.

## Déploiement

`.github/workflows/deploy-pages.yml` publie sur GitHub Pages à chaque push sur `main`.
À la première publication : Settings → Pages → « GitHub Actions » si besoin, puis côté
portail : sitemap, carte du portail, registre og (+ patch fiole physique), et rappeler à
David les liens croisés depuis les épisodes d'astronomie.

## Conventions

- Textes UI, commentaires ET code en français ; apostrophe « ’ » dans les chaînes UI.
- Commits conventionnels en français. Pas de fusion sur `main` sans feu vert explicite.
- Un artifact Claude (page unique auto-contenue, générée par le bundler du skill
  petit-labo : `references/construire-page-test.mjs <racine> <sortie.html>`) sert aux
  tests en famille — republier **au même URL** à chaque itération :
  <https://claude.ai/code/artifact/632965ba-8789-4862-968d-0c065322f9b4>
  (depuis une autre session : passer cette URL au paramètre `url` de l'outil Artifact).
  Contraintes du bundler : imports nommés, exports `export const|let|var|function NOM`
  en début de ligne — donc pas de `export class` (écrire `export const VueCote =
  class { … };`), pas de ré-export, une seule déclaration par nom global entre modules.
  **Après le bundle** : remplacer l'`url("../assets/fonts/baloo2-latin.woff2")` du CSS
  inliné par un data URI base64 (l'artefact ne sert qu'un fichier — sans ça, Baloo
  tombe en 404 et la page retombe sur la pile de repli).
