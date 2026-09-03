# Polyglot

Utilitaire de bureau (Tauri 2 + React 19 + TypeScript + Tailwind 4 + shadcn/ui) qui traduit
et corrige le texte sélectionné n'importe où dans le système, via l'API Anthropic
(`claude-haiku-4-5`), puis le recolle par-dessus la sélection d'origine.

Déclencheurs : `Ctrl+Shift+T` (raccourci global, **Ctrl** aussi sur macOS, pas Cmd),
double copie (`Ctrl+C` / `Cmd+C` deux fois de suite), ou clic sur l'icône du tray.

---

## Architecture

```
src/                        front (React)
  pages/MainWindow.tsx      shell : Tabs (Translate / Correct) + TitleBar + SettingsDialog
  components/               panneaux + composants shadcn dans components/ui/
  hooks/                    useTranslation, useCorrection, useSettings,
                            useClipboardTrigger, useCopyButton, useUpdater
  store/appStore.ts         Zustand — état global, y compris erreurs et pendingAction
  store/updateStore.ts      état de la mise à jour (statut, version, progression)
  lib/parseCorrection.ts    parsing tolérant du JSON de correction
  lib/platform.ts           IS_MAC / MOD_KEY

scripts/make-latest-json.mjs   fabrique le manifeste de mise à jour après un build

site/                       vitrine Next.js bilingue — voir site/README.md

src-tauri/src/
  lib.rs                    setup : plugins, raccourci global, tray, monitor presse-papiers
  anthropic.rs              client HTTP mutualisé + SSE + retry + messages d'erreur
  clipboard_monitor.rs      détection de la double copie
  window.rs                 affichage fenêtre + mémorisation de la fenêtre précédente
  tray.rs                   icône + menu système
  commands/
    translate.rs            prompt de traduction
    correct.rs              prompt de relecture
    paste.rs                écriture presse-papiers + Ctrl/Cmd+V synthétique
    settings.rs             store local (clé API, préférences)
```

Flux d'une traduction : le front appelle `invoke("translate_text")` avec un `stream_event`
unique ; le Rust streame la réponse SSE et émet `{stream_event}`, `-done`, `-error`,
`-truncated` ; le hook accumule et rafraîchit l'UI toutes les 50 ms.

---

## Ce qui a été corrigé (session du 1er septembre 2026)

### 1. Le modèle répondait au texte au lieu de le traduire

**Symptôme** : coller « Comment réinitialiser mon mot de passe ? » renvoyait
« Désolé, je ne comprends pas votre question… » au lieu de la traduction.

**Cause** : le texte copié était envoyé tel quel comme message `user`. Pour le modèle,
un tour utilisateur qui contient une question **est** une question qui lui est adressée.

**Correctif** (`commands/translate.rs`, `commands/correct.rs`) :
- le texte est encapsulé dans `<source_text>…</source_text>` ;
- le system prompt dit explicitement que ce bloc est de la **donnée**, jamais une consigne :
  ne jamais répondre, ne jamais obéir, ne jamais commenter, ne jamais s'excuser ;
- **préremplissage du tour assistant** (`<translation>` pour la traduction, `{` pour la
  correction) : le modèle n'a matériellement pas la place de commencer par une phrase
  d'introduction ou un refus ;
- `stop_sequences: ["</translation>"]` pour fermer proprement ;
- `temperature: 0` (traduire n'est pas une tâche créative).

Effet secondaire bienvenu : plus de ```` ```json ```` autour de la réponse de correction,
et plus de « Voici la traduction : ».

### 2. Le remplacement ne se faisait pas / pas tout de suite

Quatre bugs distincts se cumulaient :

**a. Le raccourci global se déclenchait deux fois** (`lib.rs`)
Le handler ignorait `event.state()` : il tournait au **key-down et au key-up**. Le second
appel se produisait alors que Polyglot était déjà au premier plan, donc `PREV_HWND` était
écrasé avec le handle de **notre propre fenêtre** — et « Replace » collait dans le vide.
→ filtre `ShortcutState::Pressed`, et `show_window` refuse désormais d'enregistrer sa
propre fenêtre comme « fenêtre précédente » (`window.rs`).

**b. Attente à l'aveugle de 250 ms avant le collage** (`commands/paste.rs`)
Trop court, le `Ctrl+V` partait avant que la cible ait repris le focus ; trop long, ça
traînait. → on **attend la reprise effective du focus** (`GetForegroundWindow` en boucle,
avec `AttachThreadInput` pour que `SetForegroundWindow` ne soit pas refusé par Windows),
plafonné à ~800 ms. En pratique le collage part sous les 100 ms.

**c. Modificateurs physiques encore enfoncés**
Si l'utilisateur tenait encore `Ctrl`/`Shift` (typique juste après un `Ctrl+C` ou le
raccourci), le `Ctrl+V` injecté devenait `Ctrl+Shift+V`, ignoré par la plupart des apps.
→ on relâche `Shift`/`Alt`/`Win`/`Ctrl` avant d'injecter.

**d. Écriture presse-papiers non vérifiée**
On collait parfois **l'ancien** contenu. → `write_clipboard_verified` relit jusqu'à ce que
le contenu corresponde (20 × 10 ms max).

Côté **macOS**, l'AppleScript `set frontmost of (first process whose unix id is N)`
parcourait *tous* les processus (plusieurs centaines de ms à lui seul). → activation via
`NSRunningApplication.activateWithOptions` sur le thread principal, puis `key code 9`
(touche V physique, indépendante de la disposition AZERTY) au lieu de `keystroke "v"`.

### 3. Accents cassés dans les réponses longues (`anthropic.rs`)

Le flux SSE était décodé chunk par chunk avec `String::from_utf8_lossy`. Une frontière de
chunk peut tomber **au milieu** d'un caractère multi-octets → un « é » devenait « <?> ».
→ le buffer est désormais un `Vec<u8>` ; on ne décode qu'une ligne SSE complète.

### 4. Aucune erreur n'était jamais affichée

Clé API invalide, quota dépassé, API surchargée, réseau coupé : tout partait dans
`console.error`. Le spinner s'arrêtait, rien ne s'affichait — d'où l'impression que
« parfois ça ne marche pas ».
→ messages traduits en clair côté Rust (`friendly_error`), affichés dans l'UI via
`<ErrorNotice>`, plus **retry automatique** (2 tentatives, backoff) sur 429 / 529 / 5xx et
sur les erreurs de connexion, uniquement tant que rien n'a encore été streamé.

### 5. JSON de correction illisible = écran vide

`JSON.parse` échouait (réponse tronquée, fence markdown) → `console.error`, rien à l'écran.
→ `lib/parseCorrection.ts` : parse strict, puis récupération tolérante (extraction du champ
`corrected` seul), et si vraiment rien n'est exploitable, une erreur visible.

### 6. Détection de double copie peu fiable (`clipboard_monitor.rs`)

- Une seule copie peut incrémenter le compteur plusieurs fois (Office, navigateurs,
  rendu différé) → une simple copie ouvrait parfois la fenêtre toute seule.
  Correctif : les changements espacés de moins de 90 ms sont fusionnés en une seule copie
  logique.
- Fenêtre de double-tap passée de 400 ms à 750 ms (400 ms était plus rapide qu'un
  double-tap humain moyen).
- La double copie n'est retenue que si **le texte est identique** aux deux copies.
- Nos propres écritures (bouton Copy, Replace) coupaient l'herbe sous le pied du détecteur :
  `suppress_for()` met le monitor en sourdine pendant 2,5 s autour de nos écritures.
  Le bouton Copy passe désormais par la commande `copy_to_clipboard` et non plus
  directement par le plugin.

### 7. Races de démarrage

- Une traduction lancée avant que la clé API ne soit chargée depuis le store ne faisait
  **rien du tout, silencieusement**. → le Rust résout la clé lui-même
  (`settings::resolve_api_key`) si le front ne l'a pas encore.
- Les `window.dispatchEvent(...)` + `setTimeout(50/100 ms)` pour déclencher
  auto-traduction / auto-correction pouvaient partir avant que le panneau cible ne soit
  monté. → remplacés par `pendingAction` dans le store, consommé au montage du panneau.

### 8. Divers

- Client `reqwest` mutualisé (`OnceLock`) : plus de handshake TLS à chaque requête
  (~150–300 ms gagnés à partir de la 2ᵉ traduction), + timeouts connect/read.
- `max_tokens` calculé à partir de la longueur du texte (4096 fixe tronquait les textes
  longs), avec un événement `-truncated` si la sortie est coupée.
- Entrée « Settings… » ajoutée au menu du tray (le handler existait, l'item n'avait jamais
  été créé).
- Fuites : les listeners d'événements et le timer de flush sont nettoyés au démontage
  (la fenêtre étant seulement masquée, l'arbre React vit toute la session).
- Le surlignage des corrections partait en vrille si un `replacement` était vide
  (`indexOf("")` renvoie 0) → filtré.
- `Escape` ne masque plus la fenêtre quand un dialogue ou un select est ouvert.
- Le presse-papiers **n'est volontairement pas restauré** après un Replace : garder la
  traduction dedans est plus utile que de rendre l'ancien contenu.

### 9. Refonte UI (shadcn)

- L'app utilise enfin ses **tokens** shadcn (`bg-card`, `text-muted-foreground`, `border`,
  `primary`…) au lieu de `zinc-800` / `violet-600` codés en dur partout. Le violet est
  maintenant `--primary`, plus des tokens `--success` ajoutés pour les corrections.
- Thème sombre retravaillé (fond plus profond, cartes en surface surélevée), scrollbars
  et fond de `index.html` alignés sur les tokens (plus de flash blanc au lancement).
- Les onglets sont remontés **dans la barre de titre** : une rangée de gagnée sur 560 px
  de hauteur.
- Panneau Translate : barre de langues unifiée, deux cartes avec pied de carte
  (compteur de caractères, raccourci, Copy / Replace), bouton d'effacement, curseur de
  streaming, auto-scroll pendant la génération.
- Panneau Correct : segmented control compact pour les modes (changer de mode relance la
  correction), résultat en carte avec badge du nombre de changements et détails repliables.
- Sélecteur de langue : groupe « Recent » (4 dernières, en `localStorage`) au-dessus de la
  liste complète ; la recherche au clavier de Radix fait le reste.
- Settings : `Input` / `Label` / `Separator` shadcn, liste des raccourcis, resynchronisation
  à l'ouverture (il affichait un champ vide alors qu'une clé valide était enregistrée).
- Nouveaux primitives ajoutés à la main dans `components/ui/` : `card`, `input`, `label`,
  `separator`, `kbd`. `src/App.css` (mort) supprimé.

### 10. Clé API dans le trousseau système

`settings.json` (dans `%APPDATA%/com.polyglot.app` ou `~/Library/Application Support`)
stockait la clé Anthropic **en clair**. Ce fichier se retrouve dans les sauvegardes et
les dossiers synchronisés, et se lit sans aucun privilège.

Elle vit désormais dans le trousseau du système via la crate `keyring` :
Windows Credential Manager, Keychain sur macOS. Service `com.polyglot.app`,
compte `anthropic-api-key`.

- **Migration automatique** : au premier `get_api_key`, une clé encore présente dans
  `settings.json` est déplacée dans le trousseau, et effacée du fichier **seulement**
  une fois l'écriture confirmée. Rien à faire côté utilisateur.
- **Repli assumé** : si le trousseau est indisponible (verrouillé, session distante),
  `set_api_key` retombe sur le fichier plutôt que de refuser d'enregistrer. La commande
  `api_key_storage()` dit où la clé a réellement atterri (`keychain` / `file` / `none`),
  et Settings l'affiche — un badge vert « In Windows Credential Manager », ou un
  avertissement ambre « stored as plain text ». Ne jamais masquer ce repli.
- Les deux backends natifs sont activés explicitement dans `Cargo.toml`
  (`windows-native-keyring-store`, `apple-native-keyring-store`) : avec les features
  par défaut, la build macOS n'aurait aucun backend et retomberait silencieusement sur
  le fichier en clair.

### 11. Direction artistique — reprise de Hublink

Polyglot suit désormais la DA de Hublink, celle du site et celle du shell de l'app, qui
partagent la même famille de gris. Le violet en dégradé qui existait avant a été retiré :
la DA Hublink ne signale ni par la couleur, ni par le mouvement.

**Ce qui la caractérise, et qu'il ne faut pas contredire :**

- **Gris très légèrement froids**, teinte 265 — elle se devine, elle n'assombrit pas.
  Aucune couleur d'accent. Seules subsistent les couleurs *sémantiques*, qui portent une
  information : `--destructive` pour les erreurs, `--success` pour les corrections.
- **L'action principale est un aplat encre.** En clair, un bouton noir sur texte blanc ;
  en sombre, l'inverse. Jamais un bouton coloré.
- **Les surfaces ressortent par leur élévation, jamais par une bordure marquée** — carte
  plus claire que le fond, plus une ombre discrète. C'est écrit tel quel dans le
  `globals.css` de la vitrine.
- **La sélection se lit par l'élévation**, pas par la couleur : l'onglet ou la pastille
  active passe sur `--card` avec une ombre, dans un conteneur `rounded-full`.
- **Inter Tight**, resserrée (`-0.011em` sur le corps de texte, `-0.045em` sur les
  titres via l'utilitaire `headline`). Les polices sont **auto-hébergées** via
  `@fontsource-variable` : le site peut taper Google Fonts, une app de bureau non.
- Beaucoup de `rounded-full` sur les contrôles, `rounded-2xl` sur les cartes.

**L'icône suit la même DA.** `SVG/icon-hublink.svg` est la source ; toutes les tailles
se régénèrent avec `npx tauri icon SVG/icon-hublink.svg`. Squircle presque noir à dégradé
sourd, glyphe blanc, et **deux éléments seulement à l'intérieur** — un « A » au trait et
un bloc plein. L'ancienne icône contenait « A Ň » et « 語 » : illisible en dessous de
48 px. Le bloc plein répond au panneau intérieur de l'icône Hublink, et c'est ce qui fait
la parenté entre les deux applications.

Le monogramme de la barre de titre (`components/Wordmark.tsx`) reprend **les mêmes tracés**,
en `currentColor` et dans le repère du fichier source recadré : les deux ne peuvent pas
diverger sans qu'on s'en aperçoive. Le nom est du texte, pas une image, donc il utilise
la vraie Inter Tight.

### 12. Mise à jour automatique

Plugin officiel `tauri-plugin-updater` (+ `tauri-plugin-process` pour le redémarrage).
L'app télécharge, vérifie la signature, installe et se relance — sur Windows **et**
macOS, sans certificat de signature payant.

- **Vérification** : 20 s après le lancement, puis toutes les 2 h. Polyglot restant
  ouvert des jours, un seul contrôle au démarrage laisserait passer les versions
  publiées entre-temps.
- **UI** : pastille dégradée dans la barre de titre (`UpdateBadge`) qui n'apparaît que
  s'il y a quelque chose à faire — disponible, téléchargement en cours, prêt à
  redémarrer. Les états « en cours de vérification » et « à jour » vivent dans Settings
  (`UpdateSection`), la barre de titre n'est pas une console d'état.
- **Un seul timer** : `UpdaterProvider` (dans `App.tsx`) possède l'intervalle et le
  handle de mise à jour ; le badge et Settings passent par le contexte. Ne pas appeler
  `useUpdater()` en dehors du provider.
- **En `tauri dev`, `check()` échoue toujours** (pas de bundle installé à mettre à
  jour). C'est normal : un échec de vérification en tâche de fond est silencieux, seul
  un clic manuel sur « Check » affiche l'erreur.

#### Clé de signature — à sauvegarder ailleurs

`.tauri/polyglot.key` (privée, **gitignorée**) et `.tauri/polyglot.key.pub`. La clé
publique est déjà recopiée dans `tauri.conf.json`.

Sans mot de passe, pour ne pas avoir à en saisir un à chaque build.

> **Si la clé privée est perdue, les versions déjà installées ne pourront plus jamais
> se mettre à jour** : elles n'accepteront que des artefacts signés par cette clé
> précise. La recopier dans un gestionnaire de mots de passe **maintenant**.

#### Procédure de release

Tout passe par GitHub Actions (`.github/workflows/release.yml`) : **les binaires macOS
ne peuvent se construire que sur macOS**, et l'intérêt de la mise à jour automatique
serait nul s'il fallait ressortir le Mac à chaque version. Les runners macOS de GitHub
s'en chargent.

1. Aligner la version dans `src-tauri/tauri.conf.json` **et** `package.json`, commiter.
2. `git tag v0.2.0 && git push origin main --tags`
3. Le workflow construit Windows + macOS (arm64 et Intel), signe les artefacts et
   dépose une release **en brouillon** avec `latest.json`.
4. Vérifier que les trois jobs ont bien déposé leurs fichiers, puis publier :
   `gh release edit v0.2.0 --draft=false`

L'ordre compte : tant que la release est en brouillon, l'endpoint `releases/latest`
continue de servir la version précédente — aucune machine ne voit une release
incomplète.

**Prérequis, à faire une seule fois** : `gh secret set TAURI_SIGNING_PRIVATE_KEY < .tauri/polyglot.key`
Sans ce secret, les artefacts sortent non signés et l'updater les refuse.

**Repli manuel** — `scripts/make-latest-json.mjs` fabrique le même `latest.json` à
partir d'un build local, si le CI est indisponible. Il faut alors exporter
`TAURI_SIGNING_PRIVATE_KEY` avant `npm run tauri build`, lancer
`npm run release:manifest -- --notes "..."`, puis `gh release create`. Le script
fusionne avec un `latest.json` déjà présent, pour qu'une machine n'écrase pas
l'entrée de l'autre.

**Amorçage** : la version installée aujourd'hui ne contient pas l'updater. La première
build qui l'embarque doit être installée **à la main** sur chaque machine ; les
suivantes se mettront à jour toutes seules.

**Le dépôt doit être public** — ou au moins ses assets de release. L'updater télécharge
`latest.json` sans authentification : sur un dépôt privé, GitHub répond 404. Un jeton
glissé dans la config n'est pas une option, il serait committé avec elle.

---

## Le site

`site/` est une vitrine Next.js bilingue, déployable indépendamment de l'application.
**Tout ce qui la concerne est dans `site/README.md`** : direction artistique, captures,
changelog, module de dons.

Deux choses à retenir d'ici :

- **Le changelog du site lit les releases GitHub**, dont le corps est composé par le CI
  à partir des messages de commit. Un commit mal écrit se retrouve donc sur le site. Les
  quatre premières puces seulement sont retenues : mettre l'important en tête.
- **Plus rien n'est à bumper à la main.** `VERSION` construisait les URL de
  téléchargement et donnait deux liens morts dès qu'on l'oubliait ; `getTelechargements()`
  lit désormais les fichiers de la dernière release — le `.exe`, le `.dmg` Apple Silicon
  et le `.dmg` Intel — et le numéro affiché vient de la même source.
- Le journal est revalidé toutes les **dix** minutes, pas toutes les heures : à une heure,
  il affichait encore l'avant-dernière version longtemps après sa publication.

Le site est déployé sur **`polyglot-luth.vercel.app`** (projet Vercel `polyglot-site`),
par `vercel --prod` depuis `site/`. Il n'est pas relié au dépôt : le déploiement est
manuel, à faire après chaque release pour que le journal soit à jour tout de suite.

`vercel link` **réécrit le `.gitignore` du dossier** en n'y laissant que ses propres
entrées — vérifier que `.next` y figure encore après avoir relié le projet. Et un projet
Vercel créé à la main n'a aucun préréglage de framework : il sert `public/` en statique et
répond 404, d'où le `vercel.json` qui fixe `framework: nextjs`.

Le tutoriel de la clé Anthropic vit dans `site/app/tutoriel.tsx`, servi sur `/api-key` et
`/fr/api-key`. Ses écrans sont **dessinés** : la console d'Anthropic exige un compte, donc
aucune capture n'est possible sans photographier le compte de quelqu'un.

---

## Lancer / builder sur le Mac du boulot

### Prérequis (une fois)

```bash
xcode-select --install
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Node 20+ (via `brew install node` ou nvm). Vérifier : `node -v`, `cargo -V`.

### Dev

```bash
npm install
npm run tauri dev
```

`run-dev.bat` et `build-release.bat` sont **spécifiques Windows** (ils appellent
`vcvars64.bat`) — ne pas les utiliser sur Mac.

### Build release

```bash
npm run tauri build
```

Sortie dans `src-tauri/target/release/bundle/` (`.app` et `.dmg`).

### Permission macOS obligatoire

Le collage automatique (« Replace ») passe par `osascript` → **Accessibilité** :

> Réglages Système → Confidentialité et sécurité → Accessibilité

- en **dev**, autoriser le Terminal (ou l'IDE) qui lance `npm run tauri dev` ;
- en **release**, autoriser `Polyglot.app`.

Sans ça, tout fonctionne sauf le collage final : le texte est bien mis dans le
presse-papiers, mais le `Cmd+V` n'est jamais envoyé.

L'app est en `ActivationPolicy::Accessory` : pas d'icône dans le Dock, uniquement le tray.

### Le code macOS ne se vérifie que par le CI

Tout le bloc `#[cfg(target_os = "macos")]` est **retiré à la compilation** sous Windows :
`cargo check` y passe au vert sur du code macOS qui ne compile pas. C'est arrivé dès le
premier passage — sept erreurs « cannot find macro sel » dans `window.rs`,
`clipboard_monitor.rs` et `paste.rs`, parce que `msg_send!` se développe en `sel!` et
qu'il faut importer les deux (`use objc::{class, msg_send, sel, sel_impl};`).

**Ne jamais conclure qu'une modification macOS tient parce que `cargo check` passe sous
Windows.** Pousser un tag (ou déclencher le workflow à la main) est le seul contrôle réel.

Ce qui reste à vérifier à l'usage, que le compilateur ne dira pas :

1. La double copie ouvre bien la fenêtre (et une copie simple ne l'ouvre pas).
2. « Replace » recolle bien dans l'app précédente, et rapidement.
3. `Ctrl+Shift+T` n'entre pas en conflit avec un raccourci macOS existant.

Si le collage part trop tôt sur une app lente, augmenter le `sleep` de 120 ms dans le
bloc `#[cfg(target_os = "macos")]` de `commands/paste.rs`.

### Pièges déjà payés — ne pas les refaire

- **`.cargo/config.toml` est gitignoré.** Il fige le chemin exact du linker MSVC d'une
  machine (`...MSVC/14.44.35207/...`) ; commité, il faisait échouer tout job Windows du
  CI. Il reste nécessaire en local, donc : sur disque oui, dans le dépôt non.
- **La clé de signature a un mot de passe, et ce n'est pas cosmétique.** Une clé sans mot
  de passe oblige à passer `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` à la chaîne vide — que
  ni Windows ni PowerShell ne savent transmettre (`$env:VAR = ""` *supprime* la variable).
  Sans variable, Tauri pose la question sur l'entrée standard et le build reste bloqué
  indéfiniment, après avoir produit des bundles non signés. Ne jamais regénérer la clé
  sans mot de passe.
- **Un seul installeur par plateforme** (`bundle.targets: ["nsis", "app", "dmg"]`).
  Avec `"all"`, Windows produisait MSI *et* NSIS, et la clé générique `windows-x86_64`
  de `latest.json` pointait vers le MSI : une mise à jour d'une installation NSIS aurait
  posé une seconde entrée à côté de la première.
- **Une classe CSS maison ne doit jamais porter un préfixe que Tailwind connaît.**
  `tailwind-merge`, derrière `cn()`, range `accent-gradient` dans le même groupe que
  l'utilitaire `accent-<color>` et ne garde que la dernière classe du groupe : la règle
  disparaissait sans erreur ni avertissement. D'où le préfixe `pg-` sur les rares classes
  maison qui restent (`pg-tab`, `pg-caret`).
- **Lire les logs, pas les supposer.** `... | Select-Object -Last N` en PowerShell
  bufferise toute la sortie jusqu'à la fin du pipeline : un build bloqué n'affiche alors
  rien du tout. Rediriger vers un fichier, ou passer par bash.

---

## Conventions

- Les commandes Tauri prennent un objet `request` unique désérialisé en struct Rust
  (`#[derive(Deserialize)]`), en `snake_case` côté champs.
- Tout appel à l'API passe par `anthropic::stream_message` — ne pas refaire un client
  `reqwest` ailleurs.
- Le front lit le store via des **sélecteurs** (`useAppStore((s) => s.champ)`), jamais
  `useAppStore()` nu : le streaming rafraîchit l'état toutes les 50 ms et un abonnement
  global re-rendait tout l'arbre.
- Nouveaux composants UI : d'abord chercher dans `components/ui/`, style shadcn
  « new-york », tokens uniquement (pas de couleur Tailwind brute).

## Reste à faire / pistes

- Le raccourci global est codé en dur ; le rendre configurable dans Settings.
- Les notes de version affichées par l'API (`update.body`) sont récupérées mais pas
  encore montrées dans l'UI.
- Le champ `preferences.theme` existe mais n'est pas utilisé — l'app force le mode sombre.
  Les tokens clairs sont pourtant définis dans `index.css`, il ne manque que le toggle.
- Pas de tests automatisés. `lib/parseCorrection.ts` et le parsing SSE de `anthropic.rs`
  sont les deux endroits qui en mériteraient le plus.
