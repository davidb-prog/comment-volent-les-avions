# Comment volent les avions ? — contexte projet

Épisode 1 du « **Petit labo de physique** », petite sœur du « Petit labo d'astronomie » :
site statique d'une page qui explique à une enfant de 5 ans (le parent lit à voix haute)
comment un avion vole, décolle, tourne et atterrit. Français uniquement.

La grande révélation : **l'air est costaud**. On ne le voit pas, mais il porte les avions !
L'aile, en avançant vite, **pousse l'air vers le bas — alors l'air pousse l'aile vers le
haut** (action-réaction). Pas de vitesse, pas de portance : un avion posé ne s'envole pas,
c'est pour ça qu'il court si vite sur la piste. Refrain de l'épisode : « … parce que l'air
pousse ! ». Kicker : « Petit labo de physique » — **sans numéro d'épisode** (convention de
la famille depuis 2026-08 : la numérotation affichée n'est pas maintenable, l'ordre de
publication vit dans le registre du skill petit-labo, nulle part dans l'interface).

Le cœur visuel : **les 4 forces dessinées comme des flèches vivantes** accrochées à l'avion —
portance (l'air pousse vers le haut), poids (la Terre tire vers le bas), poussée (les
moteurs), traînée (l'air qui freine). Leur longueur change en direct avec la vitesse et la
pente : c'est le « graphe » que l'enfant lit sans savoir lire. Quand la flèche du haut
dépasse la flèche du bas… l'avion décolle !

⚠️ **Mythe INTERDIT** : l'explication du « chemin plus long au-dessus de l'aile, donc l'air
va plus vite pour rattraper » (temps de transit égal) est **fausse** — elle n'apparaît nulle
part (sauf, au choix, signalée comme mythe dans la note aux parents). L'explication du
site : l'air dévié vers le bas + « il faut de la vitesse ».

Les épisodes d'astronomie font référence (niveau d'exigence, conventions, codes) :
<https://github.com/davidb-prog/eclipse-explorer>,
<https://github.com/davidb-prog/ou-va-le-soleil> (le CLAUDE.md le plus à jour — leçons
reprises ici), <https://github.com/davidb-prog/la-terre-tourne>,
<https://github.com/davidb-prog/la-lune-change-de-forme>. Clones de lecture
dans les sessions : `/workspace/davidb-prog/<repo>`. Quand ce site sera fusionné et publié :
rappeler à David d'ajouter des liens croisés vers ce labo dans les pieds de page des quatre
sites d'astronomie.

## Les codes pédagogiques de la série (notre ADN)

1. **Une seule grande révélation**, en phrase d'enfant (« l'air est costaud, c'est lui qui
   porte l'avion »), reprise en refrain dans l'accroche et la boîte-révélation.
2. **Public : 5 ans, ne sait pas lire.** Très peu de texte côté enfant, phrases courtes lues
   à voix haute, gros visuels, tons ronds. Le vocabulaire technique (portance, traînée, angle
   d'attaque, décrochage…) va dans la note aux parents repliable et le README — jamais dans
   le chemin de l'enfant.
3. **Le même phénomène, deux regards synchronisés** : la vue de côté (décoller, planer,
   atterrir) et la carte du ciel vue de dessus (pencher = tourner — refonte « idée B »
   choisie par David le 2026-08-18), toujours d'accord entre elles, avec sous chaque vue
   une petite **phrase d'état** qui raconte le même instant.
4. **Manipuler d'abord, expliquer ensuite** : le **petit cockpit** à boutons ronds
   (🐢/🔥 gaz + jauge, ⬅️/➡️ pencher, ⬆️/⬇️ monter — on MAINTIENT, relâché = neutre ;
   choisi par David le 2026-08-19 à la place du curseur des gaz, trop dur pour des doigts
   de 5 ans), plus le geste direct sur les canvas (`touch-action: none`, tap = pause,
   glissers, flèches du clavier). Jamais de théorie avant le jeu.
5. **Le phénomène vit tout seul** (lecture automatique douce), pause d'un petit tap ou
   espace, le pilotage manuel reprend la main dès qu'on touche une commande. Avec
   `prefers-reduced-motion`, rien ne bouge tout seul.
6. **Boutons-scénarios avec micro-histoires COURTES** : 🛫 le décollage, ✈️ la croisière,
   🔄 le virage, 🛬 l'atterrissage — le site amène l'état en douceur (jamais de marche
   arrière brutale), puis raconte le même instant sous les deux regards en **une phrase
   par regard** (retour de David 2026-08-19 : les histoires longues et redondantes
   lassaient). Le scénario du virage **reste dans le virage** (pas de phase « redresse ») :
   la trace incurvée reste visible pendant qu'on la raconte.
7. **La boîte-révélation à lire ET à écouter** : conteur vocal repris tel quel de
   l'épisode 2 (`ou-va-le-soleil/js/main.js`, bloc « Écouter l'histoire ») — score des voix
   françaises, menu de voix, lecture phrase à phrase avec pauses et relief — et la **même
   clé localStorage `ltt-voice`** (et `ltt-scn-voice` pour la version sonore des
   scénarios) : sur github.io, la voix choisie en famille se partage entre tous les labos.
8. **Honnêteté pédagogique** : vérités physiques protégées par des tests Node ; toute
   simplification assumée et documentée dans la note aux parents ET dans « Ce que le site
   simplifie » (README) ; aucun mythe, même joli.
9. **Jamais punitif** : rien ne peut « échouer », ni crash ni game over — l'enfant explore,
   le site rattrape toujours en douceur.
10. **Couleurs sémantiques constantes** : chaque force garde sa couleur partout (flèches,
    textes, boutons, histoires), « ton avion » a la sienne (le rose de la série — l'ancre
    « chez toi » de l'astronomie). L'enfant reconnaît avant de comprendre.
11. **Ancres personnelles** : c'est « ton avion », avec un petit pilote à bord. Les emoji
    servent de langage visuel des boutons et étiquettes.
12. **Un pont en fin de page** : question ouverte qui donne envie de la suite + passerelle
    vers la série sœur « Le petit labo d'astronomie » (liens vers les 3 épisodes).
13. **Accessibilité** : aria-labels descriptifs sur tous les canvas, commandes au clavier,
    espace = pause, focus visibles.
14. **En-tête** : kicker « Petit labo de physique » (sans numéro), titre-question « Comment
    volent les avions ? », accroche qui se termine par « … parce que l'air pousse ! ».

## Contraintes

- **Zéro dépendance, zéro build** : HTML + CSS + JS vanilla (modules ES), canvas 2D / SVG
  maison. Ouvrable avec `python3 -m http.server`, déployable tel quel sur GitHub Pages.
- **Compat vieux mobiles** : pas de `?.` ni `??`, pas de lookbehind regex, repli `@supports`
  pour `aspect-ratio`, `top/right/bottom/left` plutôt que `inset`, préfixes
  `-webkit-backdrop-filter`/`-webkit-transform`, `touch-action: none` sur les canvas
  interactifs, tester à 390 px.
- `js/model.js` est **pur** (aucun accès DOM), testé par `node test/model.test.mjs`.
  Toutes les constantes (vitesses, seuils, forces, couleurs) y vivent, jamais recopiées
  ailleurs.
- Boucle rAF résiliente (`try/finally`), aria-labels, `prefers-reduced-motion`.
- **Identité visuelle** : ossature graphique de la série (panneaux arrondis, typographie
  système, boutons ronds, organisation CSS de l'épisode 2) ; palette **« Grand ciel de
  jour »** confirmée par David (2026-08-17) : la page EST le ciel — fond dégradé bleu clair
  (`#aed9f7 → #eaf5fd`), panneaux blancs translucides comme des nuages, texte `#1c3550`,
  accent rose foncé `#b02a5e` (kicker, refrains). Couleurs des forces assombries pour le
  contraste sur fond clair (elles vivent dans `model.js` : portance `#0b8a72`, poids
  `#6a4fd0`, poussée `#d86f00`, traînée `#55617a`, avion `#ff6b9d`). Contraste accessible.
- Commits conventionnels en français (`feat:`, `fix:`, `docs:`…), apostrophe typographique
  « ’ » dans les chaînes UI. Pas de fusion sur `main` sans feu vert explicite de David.

## Vérités à préserver (couvertes par `test/model.test.mjs`)

- La **portance grandit avec la vitesse** (∝ v² dans le modèle) : à l'arrêt elle est
  nulle — un avion posé ne s'envole jamais tout seul.
- L'avion **décolle quand la portance dépasse le poids** : il existe une vitesse de
  décollage précise dans le modèle, et elle est testée.
- **En croisière stable : portance = poids et poussée = traînée** (l'équilibre des
  4 flèches).
- La **traînée freine toujours** (opposée au mouvement) et grandit avec la vitesse ;
  moteurs coupés, l'avion ralentit et descend doucement — il **plane**, il ne tombe pas
  comme une pierre.
- **Pencher les ailes = tourner** : le virage vient de la portance penchée (pas d'un
  « volant ») ; plus on penche, plus le virage est serré — avec un plafond doux.
- Pour atterrir : on réduit les gaz, on descend, on se pose — toucher **toujours doux**
  (vitesse verticale plafonnée près du sol : l'arrondi est automatique).
- **Jamais punitif** : aucune combinaison de commandes ne produit de crash (testé : depuis
  n'importe quel état, l'avion finit posé ou en vol stable).
- Les deux vues racontent la même chose (l'inclinaison de la vue de derrière est celle qui
  incurve la trajectoire de la mini-carte).

Simplifications assumées et **documentées** (note aux parents + README) — ne pas les
« corriger » sans en parler à David, elles sont pédagogiques : monter = excès de portance
(en vrai, montée stabilisée = excès de poussée, portance ≈ poids) ; taux de virage
indépendant de la vitesse (en vrai g·tan(inclinaison)/v) ; plané qui laisse fondre la
vitesse (un vrai planeur pique du nez pour la garder) ; pas de décrochage ; arrondi
automatique ; piste infinie.

## Invariants d'interaction (voulus par David)

- Vue de côté : l'avion reste à poste fixe à l'écran, le décor défile ; les 4 flèches sont
  accrochées à l'avion et changent de longueur en direct. Glisser haut/bas sur le ciel
  (monter / descendre) reste possible, mais la commande principale est le cockpit.
- **Le petit cockpit** (2026-08-19, remplace le curseur des gaz) : boutons 🐢/🔥 par
  quarts + jauge qui suit la consigne (même en automatique), boutons à MAINTENIR pour
  pencher/monter/descendre. `position: sticky` en bas du panneau de scène : il « flotte »
  pendant qu'on regarde les vues. Sur mobile ≤ 640 px il devient UNE rangée compacte
  (barre < 135 px de haut, testée) — jamais un panneau qui recouvre les canvas.
- Vue du virage = **la carte vue de dessus en grand** (l'avion au centre, cap en haut, le
  monde en tuiles — lacs, forêts, champs, pistes — qui tourne autour, la trace rose qui
  s'incurve) ; le « pencher » (avion de dos + horizon incliné, sans aucune flèche) vit dans
  un **médaillon** dans le coin. Glisser gauche/droite penche les ailes. Le médaillon dit
  « derrière » sans savoir lire (2026-08-19) : on voit la **nuque** du pilote (jamais son
  visage) et l'**échappement des réacteurs rougeoie** quand la manette des gaz est poussée.
- **Vocabulaire** : sur la piste l'avion **roule**, il ne « court » jamais (testé) —
  retour de David 2026-08-19.
- **Les pastilles qui expliquent** (2026-08-19) : les 4 pastilles de la légende et les
  5 pièces de « 🔍 Découvre ton avion » (🪶 ailes, 🔥 réacteur, 🧑‍✈️ cockpit, 🪁 queue,
  🛞 roues) affichent une petite histoire à lire, et à écouter (🔊, conteur commun).
  Textes dans `model.js` (FORCES[].story, PARTS[].text), positions dans `parts.js`
  (PART_SPOTS) — l'anneau de sélection entoure la pastille, pas la pièce entière.
- Les scénarios amènent l'état **en douceur, jamais en marche arrière brutale**, puis
  racontent l'instant sous les deux regards.
- Tap sur un canvas = pause/lecture ; espace = pause ; toute commande manuelle interrompt le
  scénario/l'auto et rend la main.

## Structure

- `index.html` — page unique : en-tête, vue de côté (canvas + manette des gaz), vue de
  derrière (canvas + mini-carte), phrases d'état, boutons-scénarios + histoire, boîte
  « 💨 L'air est costaud ! » (conteur), pont vers l'astronomie, note aux parents repliable
- `css/style.css` — ossature de la série, palette de l'épisode, bascule mobile ≤ 640 px
  (aucune incrustation ne recouvre les canvas à 390 px), repli plein écran `.fs-fallback`
- `js/model.js` — modèle pur : constantes (dont couleurs sémantiques), forces (portance,
  poids, poussée, traînée), intégration d'état (vitesse, altitude, pente, inclinaison,
  cap, trajectoire), scénarios et textes
- `js/canvas.js` — helpers canvas partagés (fitCanvas, étiquettes à halo — repris de la
  série)
- `js/side.js` — vue de côté (piste, herbe, ciel, avion rond avec pilote — `drawPlaneSide`
  exporté, partagé avec parts.js —, flèches des forces, décor défilant)
- `js/back.js` — la carte du ciel vue de dessus (monde en tuiles déterministes qui tourne
  autour de l'avion, trace, piste sous les roues) + médaillon « vu de derrière » (horizon
  incliné, avion penché de dos : nuque du pilote, échappements rougeoyants)
- `js/parts.js` — « Découvre ton avion » : l'avion en grand (dessin de side.js), ancres
  PART_SPOTS des pastilles, anneau de sélection
- `js/main.js` — boucle rAF, petit cockpit (boutons gaz/pencher/monter, jauge), glissers,
  tap-pause, scénarios, pastilles des forces et des pièces, plein écran (natif + repli
  iOS), conteur vocal (repris de l'épisode 2, clés `ltt-voice` / `ltt-scn-voice`)
- `test/model.test.mjs` — tests Node du modèle (zéro dépendance)

## Vérification navigateur

Suite Playwright dans le scratchpad des sessions (`test-site.cjs`) : desktop + mobile
390 px, zéro erreur console, captures d'écran **regardées vraiment** aux moments clés
(posé, décollage, croisière, virage, atterrissage), sondes de pixels (`getImageData`) pour
la géométrie — attention aux sondes qui tombent sur un objet mobile. Les sondes d'états
asynchrones (synthèse vocale…) se lisent de façon synchrone dans le même `evaluate` que le
clic. Relancer `python3 -m http.server 8123` avant chaque run. Playwright global :
`NODE_PATH=/opt/node22/lib/node_modules node test-site.cjs` ; `chromium.launch()` avec
repli `executablePath: '/opt/pw-browsers/chromium'` ; faire défiler l'élément dans le
viewport avant tout geste souris. Tester le repli `.fs-fallback`, pas seulement le plein
écran natif.

## Déploiement

`.github/workflows/deploy-pages.yml` (copié de l'épisode 2) publie sur GitHub Pages à
chaque push sur `main`. Vérifier le premier run ; si l'activation automatique échoue,
prévenir David (Settings → Pages → Source : « GitHub Actions »).

## Conventions

- Textes UI et commentaires en français ; apostrophe typographique « ’ » dans les chaînes UI.
- Commits conventionnels en français. Pas de fusion sur `main` sans feu vert explicite.
- Un artifact Claude (page unique auto-contenue, générée par le bundler du skill
  petit-labo : `references/construire-page-test.mjs <racine> <sortie.html>`) sert aux
  tests en famille — republier **au même URL** à chaque itération :
  <https://claude.ai/code/artifact/632965ba-8789-4862-968d-0c065322f9b4>
  (depuis une autre session : passer cette URL au paramètre `url` de l'outil Artifact).
  Contraintes du bundler : imports nommés, exports `export const|let|var|function NOM`
  en début de ligne — donc **pas de `export class`** (écrire
  `export const SideView = class { … };`), pas de ré-export (`export { TAU }` interdit :
  chaque vue importe TAU directement de `model.js`), une seule déclaration par nom
  global entre modules.
