# Polyglot

Traduit et corrige le texte sélectionné **là où il se trouve** : vous copiez, Polyglot
travaille, et le résultat se recolle par-dessus l'original. Pas de fenêtre à retrouver,
pas d'aller-retour vers un onglet de traduction.

Trois façons de le déclencher : le raccourci `Ctrl+Shift+T` (même sur macOS — `Ctrl`, pas
`Cmd`), une **double copie** (`Ctrl+C` deux fois de suite), ou l'icône dans la zone de
notification.

La traduction passe par l'API d'Anthropic (`claude-haiku-4-5`) avec **votre** clé.
L'application n'a pas de serveur : votre texte va directement chez Anthropic, et rien
n'est conservé.

## Fonctionnalités

- **Traduire ou relire** — deux onglets. La relecture renvoie le texte corrigé plus le
  détail des changements, repliable.
- **Double copie** — copier deux fois le même texte en moins de 750 ms ouvre la fenêtre
  avec le texte déjà chargé. Une copie simple ne déclenche rien.
- **Remplacement sur place** — « Replace » rend le focus à l'application d'origine,
  attend qu'elle l'ait réellement repris, puis injecte le collage. En pratique sous les
  100 ms.
- **Réponse en flux** — le texte s'écrit au fur et à mesure, rafraîchi toutes les 50 ms.
- **Clé dans le trousseau du système** — Credential Manager sous Windows, Keychain sur
  macOS. Jamais en clair sur le disque ; les réglages affichent où elle a réellement
  atterri.
- **Mise à jour automatique** sur Windows **et** macOS : l'application vérifie une
  signature cryptographique avant d'installer quoi que ce soit.
- **Neuf langues au clavier** — la liste garde les quatre dernières utilisées en tête.

## Ce qui se passe pendant une traduction

Le front appelle la commande Rust `translate_text`, qui streame la réponse SSE
d'Anthropic et émet les événements que le hook accumule.

Le texte sélectionné est encapsulé dans un bloc `<source_text>`, et le prompt système dit
explicitement que ce bloc est de la **donnée**, jamais une consigne. Sans cette
précaution, coller « Comment réinitialiser mon mot de passe ? » faisait répondre le
modèle à la question au lieu de la traduire. Le tour assistant est prérempli
(`<translation>`), ce qui ne laisse pas la place à une phrase d'introduction.

## Développement

```bash
npm install
npm run tauri dev
```

```bash
npm run tauri build
```

Les bundles sortent dans `src-tauri/target/release/bundle/`.

> `run-dev.bat` et `build-release.bat` sont **spécifiques Windows** : ils appellent
> `vcvars64.bat`. Ne pas les utiliser sur un Mac.

> **Le code macOS ne se vérifie pas sous Windows.** Tout le bloc
> `#[cfg(target_os = "macos")]` est retiré à la compilation : `cargo check` passe au vert
> sur du code macOS qui ne compile pas. Seul un passage du CI le prouve.

## Publier une version

Tout passe par GitHub Actions — **les binaires macOS ne peuvent se construire que sur
macOS**, et l'intérêt de la mise à jour automatique serait nul s'il fallait ressortir un
Mac à chaque version.

1. Aligner la version dans `src-tauri/tauri.conf.json` **et** `package.json`, commiter.
2. `git tag vX.Y.Z && git push origin main --tags`
3. Le workflow construit Windows et macOS (Apple Silicon et Intel), signe les artefacts,
   et dépose une release **en brouillon** avec `latest.json`.
4. Vérifier que les trois jobs ont déposé leurs fichiers, puis publier :
   `gh release edit vX.Y.Z --draft=false`

L'ordre compte : tant que la release est en brouillon, `releases/latest` continue de
servir la version précédente — aucune machine ne voit une release incomplète.

Le site se met à jour tout seul : il lit les fichiers de la dernière release pour ses
liens de téléchargement, et les notes pour son journal des versions.

> **La clé de signature est irremplaçable.** `.tauri/polyglot.key` est gitignorée. Si
> elle est perdue, les versions déjà installées ne pourront plus jamais se mettre à jour :
> elles n'acceptent que des artefacts signés par cette clé précise.

## Architecture

```
src/                       front React 19 + Tailwind 4 + shadcn/ui
  pages/MainWindow.tsx     Tabs (Translate / Correct) + TitleBar + Settings
  hooks/                   traduction, correction, réglages, double copie, updater
  store/                   Zustand — état global et état de mise à jour
src-tauri/src/
  lib.rs                   plugins, raccourci global, tray, monitor presse-papiers
  anthropic.rs             client HTTP mutualisé, SSE, retry, messages d'erreur
  clipboard_monitor.rs     détection de la double copie
  window.rs                affichage et mémorisation de la fenêtre précédente
  commands/                translate, correct, paste, settings
site/                      vitrine Next.js bilingue
```

## Données

Tout est local, dans `%APPDATA%\com.polyglot.app` (Windows) ou
`~/Library/Application Support/com.polyglot.app` (macOS) :

- `settings.json` — langues, préférences (la clé API n'y est **pas**)
- la clé Anthropic vit dans le trousseau du système

Ni le texte source ni sa traduction ne sont conservés. Le presse-papiers n'est
volontairement pas restauré après un remplacement : garder la traduction dedans est plus
utile que de rendre l'ancien contenu.

## Limites connues

- **Sur macOS, le collage exige l'autorisation d'accessibilité** — *Réglages Système →
  Confidentialité et sécurité → Accessibilité*. Sans elle tout fonctionne sauf le
  remplacement final : le texte reste dans le presse-papiers.
- **Les builds ne sont pas signés par un éditeur.** Windows affiche un avertissement
  SmartScreen, macOS demande un clic droit → « Ouvrir » au premier lancement. La mise à
  jour automatique, elle, vérifie sa propre signature et ne dépend pas de ces
  certificats.
- **Le raccourci global est codé en dur** ; le rendre configurable reste à faire.
- **Pas de tests automatisés.** Le parsing tolérant des corrections et le décodage SSE
  seraient les deux premiers à en mériter.
