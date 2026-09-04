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
5. **Deux boutons-moments** (🛫 🛬) : les deux vrais ÉVÉNEMENTS, dont la phrase raconte
   ce qui se passe à l'écran (un bouton sans objet se grise) — version sonore via le
   bouton 🔇/🔊. Décision David 2026-08-31 : l'ancien « ✈️ En plein vol » affichait
   l'équilibre pendant que l'écran montrait un décollage — l'équilibre est un ÉTAT, il
   vit dans le repère ✨ et le défi de la montgolfière. Ne pas réintroduire de bouton
   d'état.
6. **Les pièces de l'avion** (🔍 Découvre ton avion) : 5 **points colorés** posés sur
   les pièces — PAS d'emoji sur les pastilles (retour de David 2026-09-03 : ils cachaient
   les pièces et jouaient aux devinettes — le cerf-volant pour la queue…) ; le dessin de
   l'avion est le seul indice. Taper un point affiche l'histoire de la pièce et la LIT si
   la voix 🔇/🔊 est allumée (une pastille est un choix de contenu, comme un moment — le
   bouton 🔊 par pièce, redondant, a été retiré ; voix éteinte = silence complet, l'esprit
   de la règle « sélectionner ne parle pas » est préservé).
7. **LE jeu de l'épisode : « 🎮 Rejoins-les là-haut ! »** (2026-08-30) — un invité à SON
   altitude (`DEFIS` : ballon 56, montgolfière 77, aigle 98 — chacun dans la zone d'air
   raréfié, donc chacun a SA vitesse d'équilibre stable : l'enfant trouve la vitesse,
   l'avion se cale seul), à rejoindre au curseur. Patron des défis de la famille :
   fenêtre `JEU_FENETRE` + tenue `JEU_TENUE`, hystérésis `JEU_SORTIE`, le bravo ne ment
   jamais (il se range si on ressort, « Encore une ! » reste acquis), bravo lu une seule
   fois, rien ne se gagne pendant la lecture auto ou un moment. Défi final inversé : le
   papillon au ras des fleurs — le rejoindre, c'est se poser (« en dessous de la vitesse
   magique, un avion ne vole pas : il roule »). **Placé JUSTE SOUS la scène** (décision
   assumée d'écart à l'ordre canonique : la consigne, l'avion, l'invité et le curseur
   restent visibles ensemble, même sur mobile — pas besoin de médaillon flottant).
8. **Le jeu des pièces : « Où est… ? »** — mode jeu du panneau 🔍 (`consignePiece`,
   accords singulier/pluriel testés) : la bonne pastille gagne bravo + histoire en
   récompense ; une autre frétille et dit son nom PAR ÉCRIT seulement (pas de voix au
   mauvais tap). Cinq trouvées = bravo final, « Encore une partie ! » remélange.
   **Mise en page immobile** (retour de David 2026-09-03 : le cadre changeait tout le
   temps de taille, et « Pièce suivante ! » traînait en bas loin des commandes) : la
   consigne/bravo et « Pièce suivante ! » vivent CÔTE À CÔTE dans `.pieces-defi-zone`,
   au-dessus du cadre avec les autres commandes, hauteur réservée (56 px desktop,
   122 px mobile où le bouton passe sous le message, bravo un cran plus petit) ;
   l'histoire des pièces a la place de la plus longue (`.piece-histoire`). Le bouton
   garde SA place même caché (`visibility`, pas `display`, + `min-width` couvrant ses
   deux libellés). Pendant tout le jeu, le cadre, le panneau ET le bouton ne bougent
   pas d'un pixel (testé en navigateur, raté/bravo/bouton compris) — attention : la
   zone est en `display:flex`, son `[hidden]` doit être ré-affirmé en CSS. Même
   principe plus haut : `.phrase-etat` réserve ses 2 lignes (3 sur mobile), car la
   lecture automatique la change toute seule — la page ne respire jamais sans geste
   (retour de David 2026-09-03 : « la fenêtre bouge quand je ne fais rien »).
9. **Honnêteté** : vérités protégées par les tests ; simplifications documentées note aux
   parents + README ; l'avion **roule** (jamais « court » — testé).
10. **Jamais punitif** : aucun geste ne produit de crash (testé au curseur fou), aucune
    mauvaise réponse ne gronde.

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
- **La phrase d'état est assise sur l'excès de portance** (la grandeur des flèches),
  graduée (« un tout petit peu plus fort : il monte doucement ») : texte, flèches et
  mouvement toujours d'accord (retour de David 2026-08-31 : à 224 km/h l'avion montait
  pendant que la phrase parlait d'équilibre — testé). Au sol, elle reçoit la consigne
  du curseur et distingue accélérer (« la flèche grandit »), freiner (« elle
  rapetisse ») et maintenir — et la roue 🛞 a remplacé le drapeau à damier 🏁, qui dit
  « arrivée ! » (retours de David 2026-09-02, testés). En vol, elle raconte aussi les
  **roues** (mot choisi avec David 2026-09-04, cohérent avec la pastille — « train
  d'atterrissage » reste côté parents) PILE quand le dessin les bouge : « elles se
  rangent » juste au-dessus du seuil en montée, « il sort ses roues » sous
  `ALT_ARRONDI` en descente — jamais ailleurs (testé). Et le **plafond n'a plus de
  phrase à lui** (décision David 2026-09-04) : depuis « une vitesse = une altitude »,
  tout en haut est un équilibre comme un autre — les flèches égales disent vrai, et
  l'air léger se raconte dans la boîte 💡 (paragraphe « jusqu'aux étoiles »). Côté
  affichage (main.js), chaque phrase **tient à l'écran le temps d'être lue**
  (`PHRASE_TENUE`) : sur une transition rapide (décollage, arrondi) on saute les
  micro-états au lieu de les faire clignoter — la phrase affichée n'est jamais vieille
  de plus d'une tenue (retour de David 2026-09-04 : « on voit juste le texte
  changer » — tenue mesurée en navigateur, séquence des roues comprise).
- **Curseur réduit : il plane** (descente plafonnée), il ne tombe jamais comme une
  pierre — et **un avion ne s'arrête pas en l'air** : en vol la vitesse garde un
  plancher de plané (`VITESSE_PLANE`), on ne freine qu'une fois posé (retour de David
  2026-08-30 : l'avion « planait sans avancer ») ; **toucher toujours doux** (arrondi
  automatique) ; **jamais punitif** (curseur fou testé). Une fois posé, l'avion
  **roule longtemps avant de s'arrêter** (`DECELERATION_ROULAGE`, plus douce que le
  freinage de vol — retour de David 2026-09-04 : « il roule très peu, peu
  réaliste » ; testé : encore en mouvement à 5 s, arrêté avant 15 s — la lecture
  auto lui laisse ce temps avant de reboucler).
- **L'air se raréfie là-haut** (`densiteAir`, `portanceEnVol`) : la flèche verte dessine
  la portance RESSENTIE — en palier les deux flèches sont égales à toute altitude
  d'équilibre, et « plus vite = plus haut » (retours de David 2026-08-30 : la flèche
  sortait du cadre en altitude, et l'équilibre affiché contredisait la montée).
- La **lecture automatique** fait un tour complet et reboucle proprement.
- Les **moments savent quand ils ont du sens** (`MOMENTS[].dispo`) : décoller seulement
  posé, atterrir seulement en vol — le bouton se grise sinon (celui du moment en cours
  reste allumé).
- **Chaque défi du jeu est GAGNABLE au curseur** (simulé), les fenêtres des invités ne se
  chevauchent pas (écart > 2·`JEU_SORTIE`), l'hystérésis est plus large que la fenêtre,
  et le papillon se gagne en se posant (son bravo dit « roule »).
- L'avion **roule**, il ne « court » jamais ; pas de mythe ; apostrophes typographiques.

Simplifications assumées et **documentées** (note aux parents + README) — ne pas les
« corriger » sans en parler à David : deux flèches seulement (poussée/traînée dans un
futur épisode) ; monter = excès de portance (en vrai, montée stabilisée = excès de
poussée) ; curseur = vitesse directe ; **une vitesse = une altitude** (assiette figée —
en vrai le pilote peut tenir plusieurs altitudes à la même vitesse, questionné par David
2026-08-31 et assumé : c'est le socle du jeu) ; plané qui laisse fondre la vitesse ; pas
de décrochage ; arrondi automatique ; piste infinie où l'avion peut s'arrêter tout à
fait (questionné par David 2026-09-02 — en vrai on libère la piste et on roule au
parking — et assumé : l'arrêt est le repos du jouet, l'état d'où tout repart ; pas de
bretelles ni d'aéroport dans cet épisode) ; le virage = un futur épisode.

## Invariants d'interaction (voulus par David)

- **Un seul geste : le curseur.** Les canvas ne réagissent à rien (pas de tap-pause, pas
  de glisser) — un tap d'enfant ne doit rien déclencher en douce.
- L'avion reste **à poste fixe** à l'écran (le décor défile) ; les flèches sont
  accrochées à lui. L'étiquette « l'air pousse » ne se fait jamais recouvrir : à court
  de place tout en haut du ciel, elle se range À GAUCHE de la flèche (retour de David
  2026-09-04). Sous la scène, **seule la vitesse s'affiche en chiffres** — l'altitude
  est partie (décision David 2026-09-04 : « on voit l'avion voler ») ; la suite
  navigateur lit l'état par le crochet `window.etatLabo` (posé par main.js).
- La lecture auto ne se commande que par ⏸/▶ (ou espace) ; reprendre le curseur met en
  pause ET efface l'histoire du moment affiché (et coupe sa voix).
- Le curseur montre la **consigne** (jamais la valeur lissée) et suit la lecture
  automatique — sauf pendant que le doigt le tient.
- Le bouton 🔇/🔊 a **trois jumeaux synchronisés** (moments, jeu, pièces — même état,
  même clé) : le réglage du son à portée de main sans remonter la page.
- **L'avion est dessiné pour ses pièces** (2026-08-30, feuille blanche 2026-09-03 :
  « le nez n'est pas ajusté sur la carlingue, c'est très grossier » — le fuselage est
  désormais UNE seule silhouette continue en courbes de Bézier, toit → front arrondi →
  menton du nez → ventre → effilement → cône de queue : jamais de forme rapportée qui
  laisse un raccord visible ; l'ombre du ventre et le reflet du nez suivent la même
  courbe) : aile en flèche aux coins doux (bord d'attaque brillant, ligne de volet),
  bulle de cockpit, dérive arrondie à gouvernail, hublots. Trois règles nées des
  retours de David (2026-09-03) : le **réacteur pend SOUS l'aile** par son pylône (il
  flottait devant, à la place du train — trompeur) ; son **entrée d'air est une fine
  ellipse de profil** avec sa lèvre claire — jamais un disque à moyeu, qui se lisait
  comme une roue ; le train principal est un **boggie à roues jumelées** (pneus sombres,
  moyeux clairs) qui dépasse bien sous l'aile. Et une règle de pastilles : **une
  pastille ne cache jamais la pièce qu'elle désigne** — celle des roues se pose sur la
  piste, SOUS le boggie. Le stabilisateur est une **mini-aile au bout arrondi** (bord
  d'attaque brillant), bien visible sous le cône de queue (retour 2026-09-04 : « on ne
  voit pas bien les ailerons »). Les pastilles sont des points de 20 px (zone de tap
  44 px, couleur via `--c`) — testé en navigateur : jamais de chevauchement, même à
  390 px, et toutes dans le cadre. **Couleur d'une pastille ≠ couleur de son fond** :
  celle des roues vit sur la piste grise, elle est bleu vif `#2f7fd6` (jamais
  `COULEUR_PISTE` — retour 2026-09-04) ; et l'ancre des ailes vit au BOUT de l'aile,
  loin de la pastille des roues.
- **Seuil mobile unique : 640 px** (CSS seulement — aucun JS de bascule).

## Structure

- `index.html` — page unique : en-tête (fiole + kicker), vue de côté + phrase d'état +
  grand curseur, panneau du jeu, moments, boîte 💡, pièces (+ mode jeu), pont
  (médaillons), note aux parents
  (patron : Comment on s'en sert / Ce que le site simplifie / mot de la fin), pied de
  page harmonisé ; `<head>` SEO complet
- `css/style.css` — Baloo 2, palette de l'épisode, ossature de la famille, curseur
  maître, bascule mobile ≤ 640 px
- `js/model.js` — modèle pur : portance, `pas()`, `cibleAuto()`, MOMENTS, phraseEtat,
  PIECES + consignes du jeu « Où est… ? », DEFIS + fenêtres du grand jeu, couleurs,
  formats
- `js/canvas.js` — helpers canvas partagés (fitCanvas, flèches, étiquettes à halo)
- `js/vue-cote.js` — LA vue (décor, avion `dessineAvionCote` exporté, deux flèches,
  filets d'air, invités du jeu `dessineInvite`)
- `js/vue-pieces.js` — l'avion en grand, ancres `ANCRES_PIECES`, anneau de sélection
- `js/main.js` — boucle rAF, curseur, lecture auto, moments, les deux jeux, pièces,
  conteur
- `test/model.test.mjs` — tests Node (56 vérifications)
- `assets/fonts/` — Baloo 2 (copiée du portail, licence OFL)

## Vérification navigateur

Suite Playwright dans le scratchpad des sessions (`test-site.cjs`) : desktop,
`prefers-reduced-motion`, mobile tactile 390 px ; zéro erreur console ; sondes de pixels
(attention aux sondes qui tombent sur la flèche du poids ou son étiquette — sonder les
coins) ; l'altitude n'est plus affichée : les scripts lisent `window.etatLabo.alt`
(unités du modèle, ×40 pour des mètres). Captures regardées vraiment aux moments clés. Servir avant :
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
