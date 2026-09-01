/**
 * Les deux versions du site, côte à côte.
 *
 * Un seul dictionnaire par langue plutôt qu'une bibliothèque d'internationalisation :
 * il n'y a que deux langues et une seule page, et voir les deux textes l'un sous
 * l'autre est le meilleur moyen de repérer qu'une traduction a dérivé.
 */

export type Locale = 'en' | 'fr';

export type Contenu = {
  meta: { title: string; description: string };
  nav: { fonctions: string; versions: string; autreLangue: string; telecharger: string };
  hero: {
    badge: (version: string) => string;
    titre: string;
    texte: string;
    telecharger: string;
    code: string;
  };
  shot: { alt: string };
  /** Le motif propre à Polyglot : une phrase et sa traduction. */
  paires: { legende: string; items: { source: string; langue: string; cible: string }[] };
  pourquoi: { titre: string; p1: string; p2: string; p3: string };
  fonctions: { titre: string; cartes: { titre: string; texte: string }[] };
  flux: { titre: string; sous: string; etapes: { cle: string; titre: string; texte: string }[] };
  chiffres: { titre: string; sous: string; items: { valeur: string; legende: string }[] };
  correction: { titre: string; p1: string; p2: string; alt: string };
  confiance: { titre: string; intro: string; points: [string, string][] };
  changelog: {
    titre: string;
    sous: (n: number) => string;
    actuelle: string;
    detail: string;
    vide: string;
  };
  telecharger: {
    titre: string;
    sous: (version: string) => string;
    mac: string;
    win: string;
    noteAvant: string;
    noteLien: string;
    noteApres: string;
  };
  soutenir: { titre: string; texte: string; cafe: string; etoile: string };
  footer: { signature: string; github: string; versions: string; bug: string; soutenir: string };
};

export const fr: Contenu = {
  meta: {
    title: 'Polyglot — traduire et corriger sans changer de fenêtre',
    description:
      "Copiez deux fois n'importe où : Polyglot traduit ou relit le texte, puis le recolle par-dessus votre sélection. Windows et macOS."
  },
  nav: {
    fonctions: 'Fonctions',
    versions: 'Versions',
    autreLangue: 'EN',
    telecharger: 'Télécharger'
  },
  hero: {
    badge: (version) => `Version ${version} · Windows et macOS`,
    titre: 'Traduire sans quitter des yeux ce que vous lisez',
    texte:
      "Copiez deux fois de suite, n'importe où dans le système. Polyglot apparaît avec votre texte, le traduit aussitôt, et sait le recoller par-dessus la sélection d'origine.",
    telecharger: 'Télécharger',
    code: 'Voir le code'
  },
  shot: { alt: "Polyglot, une traduction en cours à côté du texte d'origine" },
  paires: {
    legende: 'La langue source est détectée toute seule.',
    items: [
      {
        source: 'Could you send me the file before Friday?',
        langue: 'Anglais',
        cible: "Pourriez-vous m'envoyer le fichier avant vendredi ?"
      },
      {
        source: 'Die Besprechung wurde auf Montag verschoben.',
        langue: 'Allemand',
        cible: 'La réunion a été reportée à lundi.'
      },
      {
        source: '¿Podemos hablar mañana por la mañana?',
        langue: 'Espagnol',
        cible: 'Peut-on se parler demain matin ?'
      }
    ]
  },
  pourquoi: {
    titre: 'Traduire ne devrait pas coûter trois allers-retours',
    p1: "Un onglet à ouvrir, un texte à coller, une traduction à recopier, une fenêtre à refermer. Pour trois lignes d'un message, la manœuvre est plus longue que la lecture.",
    p2: "Polyglot enlève les trois allers-retours. Le texte arrive tout seul depuis le presse-papiers, la traduction démarre sans qu'on la demande, et le résultat repart à sa place d'un clic.",
    p3: "Le reste du temps, l'application n'existe pas : pas de fenêtre ouverte, pas d'icône dans la barre des tâches, juste une icône discrète dans la zone de notification."
  },
  fonctions: {
    titre: 'Ce que fait Polyglot',
    cartes: [
      {
        titre: 'La double copie',
        texte:
          "Deux Ctrl+C de suite sur la même sélection, et la fenêtre s'ouvre avec le texte déjà chargé. Une copie normale ne déclenche rien."
      },
      {
        titre: 'La traduction se lance seule',
        texte:
          "Rien à cliquer : la traduction part dès l'ouverture et s'écrit au fil de l'eau, mot après mot, comme elle arrive."
      },
      {
        titre: 'Le remplacement en place',
        texte:
          "« Replace » rend le focus à l'application précédente et colle la traduction par-dessus votre sélection. Vous ne quittez jamais votre document."
      },
      {
        titre: 'Quatre façons de relire',
        texte:
          "Orthographe seule, style, registre formel ou registre familier. Chaque correction est listée, avec sa raison, et surlignée dans le texte."
      },
      {
        titre: '67 langues',
        texte:
          "Avec détection automatique de la langue source, et les dernières langues utilisées gardées en haut de la liste."
      },
      {
        titre: 'Deux raccourcis, pas dix',
        texte:
          'Ctrl+Shift+T pour ouvrir, Échap pour refermer. Ctrl+Entrée relance la traduction si vous modifiez le texte à la main.'
      }
    ]
  },
  flux: {
    titre: 'Trois gestes, dont deux que vous faites déjà',
    sous: "Le seul geste nouveau est le second Ctrl+C. Le reste, vous le connaissez.",
    etapes: [
      {
        cle: 'Ctrl + C ×2',
        titre: 'Vous copiez deux fois',
        texte:
          "Sur la même sélection, dans le navigateur, un mail, un PDF. Polyglot surveille le presse-papiers et reconnaît la double copie."
      },
      {
        cle: 'Automatique',
        titre: 'La traduction démarre',
        texte:
          "La fenêtre s'ouvre au centre avec votre texte à gauche, la traduction s'écrit à droite. Rien à cliquer."
      },
      {
        cle: 'Replace',
        titre: 'Le texte repart à sa place',
        texte:
          "Un clic, la fenêtre disparaît, l'application d'origine reprend la main et la traduction se colle par-dessus la sélection."
      }
    ]
  },
  chiffres: {
    titre: 'Une application qui reste à sa place',
    sous: "Polyglot parle à l'API d'Anthropic, et à rien d'autre. Pas de serveur intermédiaire, pas de compte à créer, pas de statistiques d'usage.",
    items: [
      { valeur: '67', legende: 'langues, avec détection automatique de la source' },
      {
        valeur: '0',
        legende: "serveur intermédiaire : votre texte va directement à l'API, avec votre clé"
      },
      {
        valeur: '2',
        legende: 'plateformes construites à chaque version, Windows et macOS'
      }
    ]
  },
  correction: {
    titre: 'Relire, pas seulement traduire',
    p1: "Le second onglet corrige au lieu de traduire. Orthographe seule si vous voulez rester maître du texte, ou réécriture complète vers un registre formel ou familier.",
    p2: "Chaque changement est surligné dans le résultat et détaillé en dessous : ce qui a été remplacé, par quoi, et pourquoi. Vous gardez la main sur ce que vous acceptez.",
    alt: 'Le panneau de relecture, avec les corrections surlignées et détaillées'
  },
  confiance: {
    titre: 'Ce qu’il faut savoir',
    intro:
      "Polyglot fonctionne avec votre propre clé Anthropic. Il n'y a pas d'abonnement : vous payez vos traductions au fournisseur, directement.",
    points: [
      [
        'Votre clé reste chez vous',
        "Elle est rangée dans le trousseau du système — le gestionnaire d'identifiants sous Windows, le trousseau sous macOS — et non dans un fichier de configuration en clair."
      ],
      [
        'Les mises à jour sont signées',
        "L'application vérifie une signature cryptographique avant d'installer quoi que ce soit. Une pastille apparaît, vous cliquez, elle redémarre à jour."
      ],
      [
        'Le code est lisible',
        'Le dépôt est public. Ce que fait la clé, où va le texte, ce qui est envoyé : tout est vérifiable ligne à ligne.'
      ],
      [
        'macOS demande une autorisation',
        "Le collage automatique passe par les fonctions d'accessibilité. Sans l'autorisation, tout marche sauf le collage final."
      ]
    ]
  },
  changelog: {
    titre: 'Ce qui a changé',
    sous: (n) => `Les ${n} dernières versions, telles que publiées sur GitHub.`,
    actuelle: 'actuelle',
    detail: 'Voir la version complète',
    vide: 'Pas de résumé pour cette version.'
  },
  telecharger: {
    titre: 'Installer Polyglot',
    sous: (version) =>
      `Version ${version}, disponible pour Windows et macOS. Les versions suivantes s'installeront toutes seules depuis l'application.`,
    mac: 'Télécharger pour macOS',
    win: 'Télécharger pour Windows',
    noteAvant: 'Toutes les versions et leurs notes sont sur la ',
    noteLien: 'page des releases',
    noteApres: ". Sur macOS, pensez à autoriser Polyglot dans les réglages d'accessibilité."
  },
  soutenir: {
    titre: 'Si Polyglot vous fait gagner du temps',
    texte:
      "L'application est gratuite et le restera. Si elle vous sert au quotidien, un café fait plaisir — et une étoile sur le dépôt aussi, ça ne coûte rien.",
    cafe: 'Offrir un café',
    etoile: 'Mettre une étoile'
  },
  footer: {
    signature: 'Polyglot — traduire et corriger sur place',
    github: 'GitHub',
    versions: 'Versions',
    bug: 'Signaler un problème',
    soutenir: 'Soutenir'
  }
};

export const en: Contenu = {
  meta: {
    title: 'Polyglot — translate and proofread without switching windows',
    description:
      'Copy twice from anywhere: Polyglot translates or proofreads the text, then pastes it back over your selection. Windows and macOS.'
  },
  nav: {
    fonctions: 'Features',
    versions: 'Releases',
    autreLangue: 'FR',
    telecharger: 'Download'
  },
  hero: {
    badge: (version) => `Version ${version} · Windows and macOS`,
    titre: 'Translate without looking away from what you are reading',
    texte:
      'Copy twice in a row, anywhere on your system. Polyglot appears with your text, translates it straight away, and can paste the result back over the original selection.',
    telecharger: 'Download',
    code: 'View the code'
  },
  shot: { alt: 'Polyglot translating, next to the original text' },
  paires: {
    legende: 'The source language is detected on its own.',
    items: [
      {
        source: "Pourriez-vous m'envoyer le fichier avant vendredi ?",
        langue: 'French',
        cible: 'Could you send me the file before Friday?'
      },
      {
        source: 'Die Besprechung wurde auf Montag verschoben.',
        langue: 'German',
        cible: 'The meeting has been moved to Monday.'
      },
      {
        source: '¿Podemos hablar mañana por la mañana?',
        langue: 'Spanish',
        cible: 'Can we talk tomorrow morning?'
      }
    ]
  },
  pourquoi: {
    titre: 'Translating should not cost three round trips',
    p1: 'Open a tab, paste the text, copy the translation back, close the window. For three lines of a message, the manoeuvre takes longer than the reading.',
    p2: 'Polyglot removes the round trips. The text arrives on its own from the clipboard, the translation starts without being asked, and the result goes back where it came from in one click.',
    p3: 'The rest of the time the app does not exist: no open window, no taskbar entry, just a small icon in the notification area.'
  },
  fonctions: {
    titre: 'What Polyglot does',
    cartes: [
      {
        titre: 'The double copy',
        texte:
          'Two Ctrl+C in a row on the same selection, and the window opens with the text already loaded. A normal copy triggers nothing.'
      },
      {
        titre: 'Translation starts itself',
        texte:
          'Nothing to click: the translation begins as the window opens and streams in, word by word, as it arrives.'
      },
      {
        titre: 'Replace in place',
        texte:
          'Replace hands focus back to the previous app and pastes the translation over your selection. You never leave your document.'
      },
      {
        titre: 'Four ways to proofread',
        texte:
          'Spelling only, style, formal register or casual register. Every change is listed with its reason, and highlighted in the text.'
      },
      {
        titre: '67 languages',
        texte:
          'With automatic detection of the source language, and the ones you use most kept at the top of the list.'
      },
      {
        titre: 'Two shortcuts, not ten',
        texte:
          'Ctrl+Shift+T to open, Esc to close. Ctrl+Enter re-runs the translation if you edit the text by hand.'
      }
    ]
  },
  flux: {
    titre: 'Three moves, two of which you already make',
    sous: 'The only new gesture is the second Ctrl+C. The rest you already know.',
    etapes: [
      {
        cle: 'Ctrl + C ×2',
        titre: 'You copy twice',
        texte:
          'On the same selection, in a browser, an email, a PDF. Polyglot watches the clipboard and recognises the double copy.'
      },
      {
        cle: 'Automatic',
        titre: 'The translation starts',
        texte:
          'The window opens in the centre with your text on the left and the translation writing itself on the right. Nothing to click.'
      },
      {
        cle: 'Replace',
        titre: 'The text goes back',
        texte:
          'One click, the window disappears, the original app takes focus again and the translation is pasted over the selection.'
      }
    ]
  },
  chiffres: {
    titre: 'An app that stays out of the way',
    sous: 'Polyglot talks to the Anthropic API, and to nothing else. No middleman server, no account to create, no usage tracking.',
    items: [
      { valeur: '67', legende: 'languages, with automatic source detection' },
      {
        valeur: '0',
        legende: 'middleman servers: your text goes straight to the API, with your key'
      },
      { valeur: '2', legende: 'platforms built for every release, Windows and macOS' }
    ]
  },
  correction: {
    titre: 'Proofreading, not just translating',
    p1: 'The second tab corrects instead of translating. Spelling only if you want to stay in charge of the wording, or a full rewrite into a formal or casual register.',
    p2: 'Every change is highlighted in the result and listed underneath: what was replaced, by what, and why. You decide what you keep.',
    alt: 'The proofreading panel, with changes highlighted and explained'
  },
  confiance: {
    titre: 'What you should know',
    intro:
      'Polyglot runs on your own Anthropic key. There is no subscription: you pay your translations to the provider, directly.',
    points: [
      [
        'Your key stays with you',
        'It is kept in the system keychain — Credential Manager on Windows, Keychain on macOS — rather than in a plain configuration file.'
      ],
      [
        'Updates are signed',
        'The app verifies a cryptographic signature before installing anything. A badge appears, you click, it restarts up to date.'
      ],
      [
        'The code is readable',
        'The repository is public. What the key does, where the text goes, what is sent: all of it can be checked line by line.'
      ],
      [
        'macOS asks for permission',
        'Automatic pasting goes through the accessibility APIs. Without the permission everything works except the final paste.'
      ]
    ]
  },
  changelog: {
    titre: 'What changed',
    sous: (n) => `The last ${n} releases, as published on GitHub.`,
    actuelle: 'current',
    detail: 'See the full release',
    vide: 'No summary for this release.'
  },
  telecharger: {
    titre: 'Install Polyglot',
    sous: (version) =>
      `Version ${version}, available for Windows and macOS. Later versions install themselves from inside the app.`,
    mac: 'Download for macOS',
    win: 'Download for Windows',
    noteAvant: 'Every release and its notes live on the ',
    noteLien: 'releases page',
    noteApres: '. On macOS, remember to allow Polyglot in the accessibility settings.'
  },
  soutenir: {
    titre: 'If Polyglot saves you time',
    texte:
      'The app is free and will stay that way. If it earns its place in your day, a coffee is always welcome — and a star on the repository costs nothing at all.',
    cafe: 'Buy a coffee',
    etoile: 'Leave a star'
  },
  footer: {
    signature: 'Polyglot — translate and proofread in place',
    github: 'GitHub',
    versions: 'Releases',
    bug: 'Report an issue',
    soutenir: 'Support'
  }
};
