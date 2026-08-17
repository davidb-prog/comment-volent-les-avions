# Comment volent les avions ? — contexte projet

Épisode 1 du « **Petit labo de physique** », petite sœur du « Petit labo d'astronomie » :
site statique d'une page qui explique à une enfant de 5 ans (le parent lit à voix haute)
comment un avion vole, décolle, tourne et atterrit. Français uniquement.

La grande révélation : **l'air est costaud**. On ne le voit pas, mais il porte les avions !
L'aile, en avançant vite, **pousse l'air vers le bas — alors l'air pousse l'aile vers le
haut** (action-réaction). Pas de vitesse, pas de portance : un avion posé ne s'envole pas,
c'est pour ça qu'il court si vite sur la piste. Refrain de l'épisode : « … parce que l'air
pousse ! ». Kicker : « Petit labo de physique — épisode 1 ».

Le cœur visuel : **les 4 forces dessinées comme des flèches vivantes** accrochées à l'avion —
portance (l'air pousse vers le haut), poids (la Terre tire vers le bas), poussée (les
moteurs), traînée (l'air qui freine). Leur longueur change en direct avec la vitesse et la
pente : c'est le « graphe » que l'enfant lit sans savoir lire. Quand la flèche du haut
dépasse la flèche du bas… l'avion décolle !

⚠️ **Mythe INTERDIT** : l'explication du « chemin plus long au-dessus de l'aile, donc l'air
va plus vite pour rattraper » (temps de transit égal) est **fausse** — elle n'apparaît nulle
part (sauf, au choix, signalée comme mythe dans la note aux parents). L'explication du
site : l'air dévié vers le bas + « il faut de la vitesse ».

Les trois épisodes d'astronomie font référence (niveau d'exigence, conventions, codes) :
épisode 1 <https://github.com/davidb-prog/eclipse-explorer>, épisode 2
<https://github.com/davidb-prog/ou-va-le-soleil> (le CLAUDE.md le plus à jour — leçons
reprises ici), épisode 3 <https://github.com/davidb-prog/la-terre-tourne>. Clones de lecture
dans les sessions : `/workspace/davidb-prog/<repo>`. Quand ce site sera fusionné et publié :
rappeler à David d'ajouter des liens croisés vers ce labo dans les pieds de page des trois
sites d'astronomie.

## Les codes pédagogiques de la série (notre ADN)

1. **Une seule grande révélation**, en phrase d'enfant (« l'air est costaud, c'est lui qui
   porte l'avion »), reprise en refrain dans l'accroche et la boîte-révélation.
2. **Public : 5 ans, ne sait pas lire.** Très peu de texte côté enfant, phrases courtes lues
   à voix haute, gros visuels, tons ronds. Le vocabulaire technique (portance, traînée, angle
   d'attaque, décrochage…) va dans la note aux parents repliable et le README — jamais dans
   le chemin de l'enfant.
3. **Le même phénomène, deux regards synchronisés** : la vue de côté (décoller, planer,
   atterrir) et la vue de derrière (pencher = tourner), toujours d'accord entre elles, avec
   sous chaque vue une petite **phrase d'état** qui raconte le même instant.
4. **Manipuler d'abord, expliquer ensuite** : geste direct sur les canvas
   (`touch-action: none`, tap = pause), grande manette des gaz, glisser haut/bas (monter /
   descendre) et gauche/droite (pencher). Jamais de théorie avant le jeu.
5. **Le phénomène vit tout seul** (lecture automatique douce), pause d'un petit tap ou
   espace, le pilotage manuel reprend la main dès qu'on touche une commande. Avec
   `prefers-reduced-motion`, rien ne bouge tout seul.
6. **Boutons-scénarios avec micro-histoires** : 🛫 le décollage, ✈️ la croisière, 🔄 le
   virage, 🛬 l'atterrissage — le site amène l'état en douceur (jamais de marche arrière
   brutale), puis raconte le même instant sous les deux regards (deux lignes à puces
   colorées, le patron des épisodes 2 et 3).
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
14. **En-tête** : kicker « Petit labo de physique <épisode 1> », titre-question « Comment
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

## Invariants d'interaction (voulus par David)

- Vue de côté : l'avion reste à poste fixe à l'écran, le décor défile ; les 4 flèches sont
  accrochées à l'avion et changent de longueur en direct. Deux commandes maximum : la
  manette des gaz + glisser haut/bas sur le ciel (monter / descendre).
- Vue de derrière : glisser gauche/droite penche les ailes, l'horizon s'incline, la
  mini-carte (vue de dessus) montre la trajectoire qui s'incurve.
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
- `js/side.js` — vue de côté (piste, herbe, ciel, avion rond avec pilote, flèches des
  forces, décor défilant)
- `js/back.js` — vue de derrière (horizon qui s'incline, avion vu de dos, mini-carte
  trajectoire)
- `js/main.js` — boucle rAF, manette des gaz, glissers, tap-pause, scénarios, plein écran
  (natif + repli iOS), conteur vocal (repris de l'épisode 2, clés `ltt-voice` /
  `ltt-scn-voice`)
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
- Un artifact Claude (page unique auto-contenue, générée par le script scratchpad
  `build-artifact.mjs` : CSS inliné + modules concaténés sans import/export, dans l'ordre
  model → canvas → side → back → main) sert aux tests en famille — republier **au même
  URL** à chaque itération : <https://claude.ai/code/artifact/632965ba-8789-4862-968d-0c065322f9b4>
  (depuis une autre session : passer cette URL au paramètre `url` de l'outil Artifact).
  Contrainte de concaténation : une seule déclaration par nom global (TAU vit dans
  `model.js`, `canvas.js` le réimporte ; préfixer les constantes homonymes des vues).
