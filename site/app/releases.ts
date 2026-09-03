export type Release = {
  version: string;
  date: string;
  page: string;
  points: string[];
};

const DEPOT = 'Luth-infinity/polyglot';
const API = `https://api.github.com/repos/${DEPOT}/releases`;

export const PAGE_VERSIONS = `https://github.com/${DEPOT}/releases`;

export type Telechargements = {
  version: string;
  win: string | null;
  macArm: string | null;
  macIntel: string | null;
};

/**
 * Isole la partie d'une note de version rédigée dans la langue voulue.
 *
 * Les notes de Polyglot sont produites par le CI à partir des messages de
 * commit, qui sont en français. Sans section « ## English », on retombe donc
 * sur le texte disponible : mieux vaut du français lisible qu'un changelog
 * vide. La coupure existe pour le jour où les notes seront bilingues.
 */
function section(body: string, locale: 'en' | 'fr'): string {
  const coupure = body.search(/^#{1,3}\s*English\s*$/im);
  if (coupure === -1) return body;
  return locale === 'en' ? body.slice(coupure) : body.slice(0, coupure);
}

/** Garde les puces et les phrases courtes, écarte les blocs d'installation. */
function summarize(body: string): string[] {
  return body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('**') && !l.startsWith('>'))
    .map((l) => l.replace(/^[-*]\s*/, ''))
    .filter((l) => l.length > 25 && !/^`|Installation|Télécharger/i.test(l))
    .slice(0, 4);
}

/**
 * Les versions viennent des releases GitHub : le changelog du site se met à
 * jour tout seul à chaque publication, sans double saisie qui finirait par
 * diverger.
 *
 * Revalidé toutes les dix minutes : à une heure, le journal affichait encore
 * l'avant-dernière version longtemps après sa publication.
 */
export async function getReleases(locale: 'en' | 'fr' = 'fr'): Promise<Release[]> {
  try {
    const res = await fetch(API, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 600 }
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      tag_name: string;
      published_at: string;
      html_url: string;
      body: string;
      draft: boolean;
      prerelease: boolean;
    }[];

    return data
      .filter((r) => !r.draft && !r.prerelease)
      .slice(0, 5)
      .map((r) => ({
        version: r.tag_name.replace(/^v/, ''),
        date: new Date(r.published_at).toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        page: r.html_url,
        points: summarize(section(r.body || '', locale))
      }));
  } catch {
    // Le site doit se construire même si l'API GitHub est indisponible.
    return [];
  }
}


/**
 * Les liens de téléchargement sont lus sur la dernière release, jamais écrits
 * à la main : un numéro de version en dur dans la page finit toujours par
 * pointer vers un fichier supprimé.
 *
 * Les trois binaires ont des noms distincts — `x64-setup.exe` pour Windows,
 * `aarch64.dmg` pour les Mac Apple Silicon, `x64.dmg` pour les Mac Intel. Le
 * `.exe` se reconnaît à son extension, les deux `.dmg` à leur architecture.
 *
 * Une plateforme peut manquer si sa construction a échoué : le bouton renvoie
 * alors vers la page des versions plutôt que vers le vide.
 */
export async function getTelechargements(): Promise<Telechargements> {
  try {
    const res = await fetch(API, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 600 }
    });
    if (!res.ok) return { version: '', win: null, macArm: null, macIntel: null };

    const data = (await res.json()) as {
      tag_name: string;
      draft: boolean;
      prerelease: boolean;
      assets: { name: string; browser_download_url: string }[];
    }[];
    const derniere = data.filter((r) => !r.draft && !r.prerelease)[0];
    if (!derniere) return { version: '', win: null, macArm: null, macIntel: null };

    const url = (test: (nom: string) => boolean): string | null =>
      derniere.assets.find((a) => test(a.name))?.browser_download_url ?? null;

    return {
      version: derniere.tag_name.replace(/^v/, ''),
      win: url((n) => n.endsWith('.exe')),
      macArm: url((n) => n.endsWith('.dmg') && n.includes('aarch64')),
      macIntel: url((n) => n.endsWith('.dmg') && !n.includes('aarch64'))
    };
  } catch {
    return { version: '', win: null, macArm: null, macIntel: null };
  }
}
