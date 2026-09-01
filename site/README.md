# Site de Polyglot

Vitrine Next.js, bilingue : l'anglais à la racine, le français sous `/fr`.

```bash
npm install
npm run dev     # http://localhost:3211
npm run build
```

## Ce qui se met à jour tout seul

**Le changelog.** `app/releases.ts` lit l'API des releases GitHub et garde les cinq
dernières, revalidées toutes les heures. **Ne jamais l'écrire à la main.**

Le corps des releases est composé par le CI à partir des messages de commit depuis le
tag précédent (voir `.github/workflows/release.yml`). `summarize()` ne retient que les
lignes de plus de 25 caractères qui ne commencent ni par `#`, ni par `**`, ni par `>`,
et s'arrête à quatre puces — donc **écrire les commits importants en premier**. La ligne
d'installation commence par `**` exprès : elle reste visible sur GitHub et disparaît du
site.

Les notes sont en français, faute de convention bilingue dans les commits. `section()`
sait découper sur un titre `## English` le jour où elle existera ; d'ici là, la page
anglaise affiche le français, ce qui vaut mieux qu'un changelog vide.

## Ce qui se met à jour à la main

**Le numéro de version**, dans `VERSION` en tête de `app/vitrine.tsx`. Il sert au badge
du hero, à la section d'installation, et surtout à construire les URL de téléchargement :
le laisser en retard donne deux liens morts. Contrairement à Hublink, il n'y en a qu'un
seul — les deux plateformes sortent du même passage d'intégration continue.

**Les captures**, `public/app-translate.png` et `public/app-correct.png`. À refaire dès
que l'interface bouge :

```bash
npm --prefix .. run dev
```

puis, dans un autre terminal, depuis la racine du dépôt :

```bash
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless --disable-gpu \
  --hide-scrollbars --force-device-scale-factor=2 --window-size=780,560 \
  --virtual-time-budget=8000 \
  --screenshot="$(cygpath -w "$PWD/site/public/app-translate.png")" \
  "http://localhost:1420/?demo=translate"
```

et la même chose avec `?demo=correct`. Le paramètre `demo` remplit l'application avec un
jeu de données réaliste ; il est défini dans `src/main.tsx` et **restreint au mode
développement**, donc absent du build livré. Sans lui, la capture montrerait une
interface vide et le bandeau « No API key configured ».

Le `--force-device-scale-factor=2` donne des PNG en 1560 × 1120 : sans lui, les captures
sont floues sur un écran dense.

## Le module de dons

`app/support.ts` porte le pseudo Buy Me a Coffee, **le même que celui de Hublink** :
c'est un seul compte. Tant que la valeur est vide, la section et le lien du pied de page
disparaissent — mieux vaut rien qu'un lien mort.

## La direction artistique

Même système que le site Hublink — Inter Tight resserrée, pastilles `rounded-full`,
gris légèrement froids, aucune couleur d'accent — mais **le sol est inversé**. Hublink
est un site clair ; Polyglot est une application sombre et son site l'annonce.

Deux conséquences à ne pas oublier :

- `ink` reste la couleur du **texte**. Un bouton principal se pose donc en
  `bg-ink text-page`, et non `text-white` comme sur Hublink, sinon il est blanc sur blanc.
- Sur fond sombre, une surface se détache en **s'éclaircissant**, pas en projetant une
  ombre. Les ombres de Hublink sont remplacées par `bg-card` plus un `ring-1 ring-line`.

Le bloc de contraste (`Chiffres`) est retourné lui aussi : bloc clair sur page sombre,
là où Hublink pose un bloc encre sur page claire.

Le motif propre à Polyglot est la section `Paires` : une phrase et sa traduction, la
source en retrait, la cible en pleine lumière. Le produit parle de texte, donc le texte
sert d'illustration plutôt qu'une capture d'écran de plus.
