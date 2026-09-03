import Image from 'next/image';
import { Reveal } from './reveal';
import { getReleases, getTelechargements, PAGE_VERSIONS, type Telechargements } from './releases';
import { SUPPORT_URL } from './support';
import type { Contenu, Locale } from './content';
import { LangLink } from './lang-link';

/**
 * La page, une seule fois, alimentée par le dictionnaire de la langue.
 *
 * Le fichier ne s'appelle pas `Page.tsx` : sous Windows, ce serait le même
 * fichier que la route `page.tsx`.
 */

const REPO = 'https://github.com/Luth-infinity/polyglot';
const RELEASE = `${REPO}/releases/latest`;
type Props = { t: Contenu; locale: Locale };

// L'anglais est servi à la racine, le français sous /fr.
const autreLangue = (locale: Locale) => (locale === 'en' ? '/fr' : '/');

/**
 * Le glyphe de l'icône, sans son squircle : sur un fond sombre, l'icône
 * complète disparaîtrait. Tracés repris de `SVG/icon-hublink.svg`.
 */
function Mark({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="121 181 783 648" fill="none" aria-hidden="true" className={className}>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M280 210 H745 A130 130 0 0 1 875 340 V530 A130 130 0 0 1 745 660 H455 L318 800 V660 H280 A130 130 0 0 1 150 530 V340 A130 130 0 0 1 280 210 Z"
          strokeWidth="58"
        />
        <path d="M300 545 L392 340 L484 545" strokeWidth="54" />
        <path d="M334 478 H450" strokeWidth="54" />
      </g>
      <rect x="560" y="355" width="175" height="175" rx="44" fill="currentColor" />
    </svg>
  );
}

const LIEN_NAV =
  'hidden rounded-full px-3 py-1.5 text-sm text-ink-soft transition-colors hover:text-ink sm:block';

// Sur fond sombre, une surface se détache en s'éclaircissant, pas en projetant
// une ombre : l'ombre de Hublink est remplacée par un filet et un fond plus haut.
const CADRE_IMAGE = 'reveal overflow-hidden rounded-[20px] bg-card p-2 ring-1 ring-line';

function Nav({ t, locale }: Props) {
  return (
    <div className="sticky top-4 z-50 flex justify-center px-4">
      <nav className="bg-card/80 ring-line flex items-center gap-1 rounded-full p-1.5 pl-4 ring-1 backdrop-blur">
        <a
          href="#top"
          className="mr-3 flex items-center gap-2 text-[15px] font-semibold tracking-tight"
        >
          <Mark className="size-5" />
          Polyglot
        </a>
        <a href="#fonctions" className={LIEN_NAV}>
          {t.nav.fonctions}
        </a>
        <a href="#versions" className={LIEN_NAV}>
          {t.nav.versions}
        </a>
        <a href={REPO} className={LIEN_NAV}>
          GitHub
        </a>
        <LangLink
          href={autreLangue(locale)}
          hrefLang={locale === 'en' ? 'fr' : 'en'}
          className="text-ink-soft hover:text-ink rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors"
        >
          {t.nav.autreLangue}
        </LangLink>
        <a
          href="#telecharger"
          className="bg-ink text-page ml-1 rounded-full px-4 py-2 text-sm font-medium transition-transform hover:scale-[1.02]"
        >
          {t.nav.telecharger}
        </a>
      </nav>
    </div>
  );
}

function Hero({ t, version }: { t: Contenu; version: string }) {
  return (
    <header id="top" className="mx-auto max-w-6xl px-4 pt-16 pb-10 text-center sm:pt-24">
      <p className="reveal bg-card ring-line text-ink-soft mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] ring-1">
        <span className="size-1.5 rounded-full bg-emerald-400" />
        {t.hero.badge(version || '—')}
      </p>
      <h1 className="reveal headline mx-auto max-w-[16ch] text-[13vw] sm:text-[76px] lg:text-[92px]">
        {t.hero.titre}
      </h1>
      <p className="reveal text-ink-soft mx-auto mt-6 max-w-[52ch] text-[17px] leading-relaxed">
        {t.hero.texte}
      </p>
      <div className="reveal mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href="#telecharger"
          className="bg-ink text-page rounded-full px-6 py-3 text-[15px] font-medium transition-transform hover:scale-[1.02]"
        >
          {t.hero.telecharger}
        </a>
        <a
          href={REPO}
          className="bg-card ring-line hover:bg-canvas rounded-full px-6 py-3 text-[15px] font-medium ring-1 transition-colors"
        >
          {t.hero.code}
        </a>
      </div>
    </header>
  );
}

function Shot({ t }: { t: Contenu }) {
  return (
    <div className="reveal px-4 pb-4">
      <div className={`mx-auto max-w-5xl ${CADRE_IMAGE}`}>
        <Image
          src="/app-translate.png"
          alt={t.shot.alt}
          width={1560}
          height={1120}
          priority
          className="w-full rounded-[13px]"
        />
      </div>
    </div>
  );
}

/**
 * Le motif propre à Polyglot. Le produit traite du texte : autant le montrer
 * par le texte lui-même plutôt que par une capture d'écran de plus.
 */
function Paires({ t }: { t: Contenu }) {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-px overflow-hidden rounded-[24px] sm:grid-cols-3">
          {t.paires.items.map((p) => (
            <div key={p.source} className="reveal bg-card ring-line p-7 ring-1">
              <p className="text-ink-soft text-[11px] font-medium tracking-[0.14em] uppercase">
                {p.langue}
              </p>
              <p className="text-ink-soft mt-4 text-[16px] leading-relaxed">{p.source}</p>
              <p className="text-ink-soft/40 mt-4 text-[13px]">↓</p>
              <p className="mt-4 text-[16px] leading-relaxed font-medium">{p.cible}</p>
            </div>
          ))}
        </div>
        <p className="reveal text-ink-soft mt-5 text-center text-[13px]">{t.paires.legende}</p>
      </div>
    </section>
  );
}

function Pourquoi({ t }: { t: Contenu }) {
  return (
    <section id="pourquoi" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="reveal headline text-[40px] sm:text-[54px]">{t.pourquoi.titre}</h2>
        <div className="reveal text-ink-soft mt-8 grid gap-x-12 gap-y-5 text-[17px] leading-relaxed lg:grid-cols-2">
          <p>{t.pourquoi.p1}</p>
          <p>{t.pourquoi.p2}</p>
          <p className="text-ink font-medium lg:col-span-2">{t.pourquoi.p3}</p>
        </div>
      </div>
    </section>
  );
}

function Fonctions({ t }: { t: Contenu }) {
  return (
    <section id="fonctions" className="px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="reveal headline max-w-[14ch] text-[40px] sm:text-[54px]">
          {t.fonctions.titre}
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.fonctions.cartes.map((f) => (
            <article key={f.titre} className="reveal bg-card ring-line rounded-2xl p-6 ring-1">
              <h3 className="text-[17px] font-semibold tracking-tight">{f.titre}</h3>
              <p className="text-ink-soft mt-3 text-[15px] leading-relaxed">{f.texte}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Flux({ t }: { t: Contenu }) {
  return (
    <section id="flux" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="reveal headline max-w-[16ch] text-[40px] sm:text-[54px]">{t.flux.titre}</h2>
        <p className="reveal text-ink-soft mt-6 text-[17px] leading-relaxed">{t.flux.sous}</p>
        <ol className="mt-12 grid gap-4 lg:grid-cols-3">
          {t.flux.etapes.map((e, i) => (
            <li key={e.titre} className="reveal bg-card ring-line rounded-2xl p-7 ring-1">
              <div className="flex items-center gap-3">
                <span className="bg-ink text-page flex size-6 items-center justify-center rounded-full text-[12px] font-semibold">
                  {i + 1}
                </span>
                <span className="bg-canvas ring-line text-ink-soft rounded-full px-2.5 py-1 font-mono text-[11px] ring-1">
                  {e.cle}
                </span>
              </div>
              <h3 className="mt-5 text-[17px] font-semibold tracking-tight">{e.titre}</h3>
              <p className="text-ink-soft mt-3 text-[15px] leading-relaxed">{e.texte}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Chiffres({ t }: { t: Contenu }) {
  return (
    <section id="chiffres" className="px-4 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Le bloc de contraste de Hublink, retourné : leur page est claire avec
            un bloc encre, celle-ci est sombre avec un bloc clair. */}
        <div className="reveal bg-ink text-page rounded-[24px] px-6 py-14 text-center sm:px-12">
          <h2 className="headline mx-auto max-w-[18ch] text-[34px] sm:text-[46px]">
            {t.chiffres.titre}
          </h2>
          <p className="text-page/60 mx-auto mt-4 max-w-[56ch] text-[15px] leading-relaxed">
            {t.chiffres.sous}
          </p>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {t.chiffres.items.map((c) => (
              <div key={c.legende}>
                <p className="headline text-[30px] sm:text-[36px]">{c.valeur}</p>
                <p className="text-page/55 mx-auto mt-3 max-w-[26ch] text-[14px] leading-relaxed">
                  {c.legende}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Correction({ t }: { t: Contenu }) {
  return (
    <section id="correction" className="px-4 pb-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div className="reveal">
          <h2 className="headline text-[40px] sm:text-[52px]">{t.correction.titre}</h2>
          <p className="text-ink-soft mt-6 max-w-[46ch] text-[17px] leading-relaxed">
            {t.correction.p1}
          </p>
          <p className="text-ink-soft mt-4 max-w-[46ch] text-[17px] leading-relaxed">
            {t.correction.p2}
          </p>
        </div>
        <div className={CADRE_IMAGE}>
          <Image
            src="/app-correct.png"
            alt={t.correction.alt}
            width={1560}
            height={1120}
            className="w-full rounded-[13px]"
          />
        </div>
      </div>
    </section>
  );
}

function Confiance({ t }: { t: Contenu }) {
  return (
    <section id="confiance" className="px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="reveal headline text-[40px] sm:text-[54px]">{t.confiance.titre}</h2>
        <p className="reveal text-ink-soft mt-6 max-w-[64ch] text-[17px] leading-relaxed">
          {t.confiance.intro}
        </p>
        <ul className="reveal mt-8 grid gap-4 sm:grid-cols-2">
          {t.confiance.points.map(([titre, texte]) => (
            <li key={titre} className="bg-card ring-line rounded-2xl p-5 ring-1">
              <p className="text-[15px] font-semibold tracking-tight">{titre}</p>
              <p className="text-ink-soft mt-2 text-[15px] leading-relaxed">{texte}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

async function Changelog({ t, locale }: Props) {
  const releases = await getReleases(locale);
  // Rien plutôt qu'une section vide si l'API GitHub n'a pas répondu.
  if (releases.length === 0) return null;

  return (
    <section id="versions" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="reveal headline text-[40px] sm:text-[54px]">{t.changelog.titre}</h2>
        <p className="reveal text-ink-soft mt-6 text-[17px] leading-relaxed">
          {t.changelog.sous(releases.length)}
        </p>

        <ol className="reveal bg-card ring-line mt-10 space-y-px overflow-hidden rounded-2xl ring-1">
          {releases.map((release, index) => (
            <li
              key={release.version}
              className="border-line grid gap-4 p-6 sm:grid-cols-[160px_1fr] sm:gap-8"
              style={index > 0 ? { borderTopWidth: 1 } : undefined}
            >
              <div>
                <p className="flex items-baseline gap-2 text-[17px] font-semibold tracking-tight">
                  {release.version}
                  {index === 0 && (
                    <span className="bg-ink text-page rounded-full px-2 py-0.5 text-[10px] font-medium">
                      {t.changelog.actuelle}
                    </span>
                  )}
                </p>
                <p className="text-ink-soft mt-1 text-[13px]">{release.date}</p>
              </div>
              {/* Les notes de version viennent des messages de commit, rédigés
                  en français : on le signale au navigateur plutôt que de laisser
                  croire à de l'anglais mal écrit. */}
              <div lang="fr">
                {release.points.length > 0 ? (
                  <ul className="text-ink-soft space-y-2 text-[15px] leading-relaxed">
                    {release.points.map((point) => (
                      <li key={point} className="flex gap-2.5">
                        <span className="bg-ink-soft/50 mt-2 size-1 shrink-0 rounded-full" />
                        {point}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-ink-soft text-[15px]">{t.changelog.vide}</p>
                )}
                <a
                  href={release.page}
                  lang={locale}
                  className="text-ink-soft hover:text-ink mt-3 inline-block text-[13px] underline underline-offset-4"
                >
                  {t.changelog.detail}
                </a>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Telecharger({ t, dl, locale }: { t: Contenu; dl: Telechargements; locale: Locale }) {
  const principal =
    'bg-ink text-page w-full rounded-full px-6 py-3.5 text-[15px] font-medium transition-transform hover:scale-[1.02] sm:w-auto';

  return (
    <section id="telecharger" className="px-4 pb-24">
      <div className="mx-auto max-w-6xl text-center">
        <Image
          src="/icon.png"
          alt=""
          width={128}
          height={128}
          className="ring-line mx-auto size-16 rounded-[22%] ring-1"
        />
        <h2 className="reveal headline mt-6 text-[40px] sm:text-[54px]">{t.telecharger.titre}</h2>
        <p className="reveal text-ink-soft mx-auto mt-5 max-w-[60ch] text-[17px] leading-relaxed">
          {t.telecharger.sous(dl.version || '—')}
        </p>

        {/* Le visiteur ne télécharge qu'une plateforme : le script du <head>
            pose `data-os` avant le rendu, et l'autre bouton ne s'affiche pas.
            Plateforme inconnue ou JS coupé : les deux restent là. */}
        <div className="reveal mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a data-cta="win" href={dl.win ?? PAGE_VERSIONS} className={principal}>
            {t.telecharger.win}
          </a>
          <a data-cta="mac" href={dl.macArm ?? PAGE_VERSIONS} className={principal}>
            {t.telecharger.mac}
          </a>
        </div>

        <p className="reveal text-ink-soft mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13px]">
          <a
            data-cta="mac"
            href={dl.macIntel ?? PAGE_VERSIONS}
            className="hover:text-ink underline underline-offset-4"
          >
            {t.telecharger.macIntel}
          </a>
          <a href={PAGE_VERSIONS} className="hover:text-ink underline underline-offset-4">
            {t.telecharger.noteLien}
          </a>
          <a
            href={locale === 'fr' ? '/fr/api-key' : '/api-key'}
            className="hover:text-ink underline underline-offset-4"
          >
            {t.cle.lien}
          </a>
        </p>

        <p className="reveal text-ink-soft mx-auto mt-5 max-w-[60ch] text-[13px] leading-relaxed">
          {t.telecharger.signature}
        </p>
      </div>
    </section>
  );
}

function Soutenir({ t }: { t: Contenu }) {
  // Rien plutôt qu'un lien mort : la section disparaît tant que le pseudo n'est
  // pas renseigné dans support.ts.
  if (!SUPPORT_URL) return null;

  return (
    <section id="soutenir" className="px-4 pb-24">
      <div className="mx-auto max-w-6xl">
        <div className="reveal bg-card ring-line rounded-[24px] p-8 ring-1 sm:p-12">
          <h2 className="headline max-w-[20ch] text-[32px] sm:text-[42px]">{t.soutenir.titre}</h2>
          <p className="text-ink-soft mt-5 text-[16px] leading-relaxed">{t.soutenir.texte}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="bg-ink text-page rounded-full px-6 py-3 text-[15px] font-medium transition-transform hover:scale-[1.02]"
            >
              {t.soutenir.cafe}
            </a>
            <a
              href={`${REPO}/stargazers`}
              className="text-ink-soft ring-line hover:text-ink rounded-full px-5 py-3 text-[15px] font-medium ring-1 transition-colors"
            >
              {t.soutenir.etoile}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ t }: { t: Contenu }) {
  return (
    <footer className="px-4 pb-10">
      <div className="border-line mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
        <p className="text-ink-soft flex items-center gap-2 text-[14px]">
          <Mark className="size-4" />
          {t.footer.signature}
        </p>
        <div className="text-ink-soft flex items-center gap-5 text-[14px]">
          <a href={REPO} className="hover:text-ink">
            {t.footer.github}
          </a>
          <a href={RELEASE} className="hover:text-ink">
            {t.footer.versions}
          </a>
          <a href={`${REPO}/issues`} className="hover:text-ink">
            {t.footer.bug}
          </a>
          {SUPPORT_URL && (
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-ink"
            >
              {t.footer.soutenir}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}

export default async function Vitrine({ t, locale }: Props) {
  const dl = await getTelechargements();

  return (
    <>
      <Reveal />
      <Nav t={t} locale={locale} />
      <main lang={locale} className="mx-auto max-w-[1600px] pb-px">
        <div className="bg-canvas mt-4 rounded-[28px] pt-2 pb-px">
          <Hero t={t} version={dl.version} />
          <Shot t={t} />
          <Paires t={t} />
          <Pourquoi t={t} />
          <Fonctions t={t} />
          <Flux t={t} />
          <Chiffres t={t} />
          <Correction t={t} />
          <Confiance t={t} />
          <Changelog t={t} locale={locale} />
          <Telecharger t={t} dl={dl} locale={locale} />
          <Soutenir t={t} />
          <Footer t={t} />
        </div>
      </main>
    </>
  );
}
