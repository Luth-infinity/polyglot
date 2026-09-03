import type { Contenu, Locale } from './content';

/**
 * Les cinq étapes sont **dessinées**, pas capturées.
 *
 * La console d'Anthropic exige un compte pour montrer quoi que ce soit : une
 * capture supposerait de photographier le compte de quelqu'un, clé et
 * facturation comprises. Ces schémas disent la même chose sans faire passer
 * un dessin pour une photo, et ils ne vieilliront pas au premier changement
 * de leur interface.
 */

function Fenetre({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 320 180" className="w-full" role="img" aria-label={url}>
      <rect x="0.5" y="0.5" width="319" height="179" rx="9" className="fill-canvas stroke-line" />
      <line x1="0" y1="30" x2="320" y2="30" className="stroke-line" />
      {[12, 22, 32].map((cx) => (
        <circle key={cx} cx={cx} cy="15" r="3" className="fill-ink-soft opacity-40" />
      ))}
      <rect x="46" y="8" width="262" height="14" rx="7" className="fill-page" />
      <text x="56" y="18.5" className="fill-ink-soft" fontSize="8" fontFamily="monospace">
        {url}
      </text>
      {children}
    </svg>
  );
}

/** 1 — la création de compte. */
function EtapeCompte() {
  return (
    <Fenetre url="console.anthropic.com">
      <rect x="90" y="48" width="140" height="112" rx="8" className="fill-card stroke-line" />
      <rect x="104" y="62" width="112" height="8" rx="4" className="fill-ink-soft opacity-30" />
      {[84, 106].map((y) => (
        <g key={y}>
          <rect x="104" y={y} width="112" height="16" rx="8" className="fill-page stroke-line" />
          <rect
            x="114"
            y={y + 5}
            width="70"
            height="6"
            rx="3"
            className="fill-ink-soft opacity-30"
          />
        </g>
      ))}
      <rect x="104" y="134" width="112" height="16" rx="8" className="fill-ink" />
    </Fenetre>
  );
}

/** 2 — le crédit, sans lequel la clé ne sert à rien. */
function EtapeCredit() {
  return (
    <Fenetre url="console.anthropic.com/settings/billing">
      <rect x="8" y="38" width="86" height="134" rx="6" className="fill-card" />
      {[48, 66, 84, 102].map((y, i) => (
        <g key={y}>
          {i === 2 && <rect x="12" y={y - 5} width="78" height="18" rx="5" className="fill-page" />}
          <rect
            x="20"
            y={y}
            width={i === 2 ? 48 : 44}
            height="7"
            rx="3.5"
            className={i === 2 ? 'fill-emerald-400' : 'fill-ink-soft opacity-30'}
          />
        </g>
      ))}
      <rect x="104" y="48" width="204" height="52" rx="7" className="fill-card stroke-line" />
      <text x="118" y="72" className="fill-ink-soft" fontSize="8">
        Credit balance
      </text>
      <text x="118" y="90" className="fill-ink" fontSize="15" fontWeight="600">
        5,00 €
      </text>
      <rect x="232" y="66" width="62" height="18" rx="9" className="fill-ink" />
      <text x="263" y="78" className="fill-page" fontSize="8" fontWeight="600" textAnchor="middle">
        Add credit
      </text>
    </Fenetre>
  );
}

/** 3 — la section « API Keys ». */
function EtapeSection() {
  return (
    <Fenetre url="console.anthropic.com/settings/keys">
      <rect x="8" y="38" width="86" height="134" rx="6" className="fill-card" />
      {[48, 66, 84, 102].map((y, i) => (
        <g key={y}>
          {i === 1 && <rect x="12" y={y - 5} width="78" height="18" rx="5" className="fill-page" />}
          <rect
            x="20"
            y={y}
            width={i === 1 ? 52 : 44}
            height="7"
            rx="3.5"
            className={i === 1 ? 'fill-emerald-400' : 'fill-ink-soft opacity-30'}
          />
        </g>
      ))}
      <rect x="104" y="46" width="70" height="9" rx="4" className="fill-ink-soft opacity-40" />
      <rect x="104" y="70" width="204" height="30" rx="6" className="fill-card stroke-line" />
      <rect x="104" y="108" width="204" height="30" rx="6" className="fill-card stroke-line" />
      <rect x="246" y="44" width="62" height="16" rx="8" className="fill-ink" />
      <text x="277" y="55" className="fill-page" fontSize="7.5" fontWeight="600" textAnchor="middle">
        Create Key
      </text>
    </Fenetre>
  );
}

/** 4 — la clé, affichée une seule fois. */
function EtapeCopie() {
  return (
    <Fenetre url="console.anthropic.com/settings/keys">
      <rect x="0" y="31" width="320" height="149" className="fill-ink opacity-20" />
      <rect x="46" y="60" width="228" height="88" rx="9" className="fill-card stroke-line" />
      <rect x="62" y="76" width="120" height="8" rx="4" className="fill-ink-soft opacity-40" />
      <rect x="62" y="96" width="196" height="20" rx="5" className="fill-page stroke-line" />
      <text x="70" y="109.5" className="fill-emerald-400" fontSize="8.5" fontFamily="monospace">
        sk-ant-••••••••••••••••
      </text>
      <rect x="232" y="100" width="20" height="12" rx="3" className="fill-ink" />
      <rect x="62" y="126" width="150" height="6" rx="3" className="fill-ink-soft opacity-25" />
    </Fenetre>
  );
}

/** 5 — les réglages de Polyglot, pour boucler la boucle. */
function EtapeCollage() {
  return (
    <svg viewBox="0 0 320 180" className="w-full" role="img" aria-label="Polyglot">
      <rect x="0.5" y="0.5" width="319" height="179" rx="9" className="fill-canvas stroke-line" />
      <line x1="0" y1="38" x2="320" y2="38" className="stroke-line" />
      <rect x="14" y="12" width="16" height="16" rx="5" className="fill-ink" />
      <rect x="38" y="16" width="60" height="7" rx="3.5" className="fill-ink-soft opacity-50" />

      <rect x="14" y="58" width="44" height="7" rx="3.5" className="fill-ink-soft opacity-40" />
      <rect x="14" y="72" width="292" height="22" rx="6" className="fill-card stroke-emerald-400" />
      <text x="24" y="86.5" className="fill-emerald-400" fontSize="9" fontFamily="monospace">
        sk-ant-••••••••••••••••
      </text>

      <rect x="14" y="110" width="80" height="7" rx="3.5" className="fill-ink-soft opacity-40" />
      <rect x="14" y="124" width="292" height="22" rx="6" className="fill-card stroke-line" />
      <text x="24" y="138.5" className="fill-ink-soft" fontSize="9" fontFamily="monospace">
        Ctrl + Shift + T
      </text>

      <rect x="228" y="158" width="78" height="14" rx="7" className="fill-ink" />
    </svg>
  );
}

const ILLUSTRATIONS = [EtapeCompte, EtapeCredit, EtapeSection, EtapeCopie, EtapeCollage];

export default function Tutoriel({ t, locale }: { t: Contenu; locale: Locale }) {
  const accueil = locale === 'fr' ? '/fr' : '/';
  const CADRE = 'rounded-2xl bg-card ring-1 ring-line p-5 sm:p-6';

  return (
    <>
      <header className="border-line/70 bg-page/80 sticky top-0 z-10 border-b backdrop-blur">
        <nav className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
          <a href={accueil} className="text-[15px] font-semibold tracking-tight">
            Polyglot
          </a>
          <span className="flex-1" />
          <a
            href={locale === 'fr' ? '/api-key' : '/fr/api-key'}
            hrefLang={locale === 'fr' ? 'en' : 'fr'}
            className="text-ink-soft hover:text-ink rounded-full px-2.5 py-1 text-[13px] font-medium transition-colors"
          >
            {locale === 'fr' ? 'EN' : 'FR'}
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="headline text-[40px] sm:text-[52px]">{t.cle.titre}</h1>
        <p className="text-ink-soft mt-6 max-w-[54ch] text-[17px] leading-relaxed">
          {t.cle.chapeau}
        </p>
        <p className="text-ink-soft mt-4 max-w-[54ch] text-sm leading-relaxed">{t.cle.pourquoi}</p>

        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noreferrer"
          className="bg-ink text-page mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-[15px] font-medium transition-transform hover:scale-[1.02]"
        >
          console.anthropic.com ↗
        </a>

        <ol className="mt-14 grid gap-4">
          {t.cle.etapes.map((etape, i) => {
            const Illustration = ILLUSTRATIONS[i];
            return (
              <li key={etape.titre} className={`${CADRE} grid gap-5 sm:grid-cols-[1fr_320px]`}>
                <div className="min-w-0 self-center">
                  <span className="headline text-ink-soft text-[24px]">{i + 1}</span>
                  <h2 className="mt-2 text-[17px] font-semibold tracking-tight">{etape.titre}</h2>
                  <p className="text-ink-soft mt-2 text-sm leading-relaxed">{etape.texte}</p>
                </div>
                <div className="self-center">{Illustration && <Illustration />}</div>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {[t.cle.cout, t.cle.securite].map((bloc) => (
            <div key={bloc.titre} className={CADRE}>
              <h2 className="text-[17px] font-semibold tracking-tight">{bloc.titre}</h2>
              <p className="text-ink-soft mt-2 text-sm leading-relaxed">{bloc.texte}</p>
            </div>
          ))}
        </div>

        <a
          href={accueil}
          className="text-ink-soft hover:text-ink mt-12 inline-block text-sm underline-offset-4 hover:underline"
        >
          ← {t.cle.retour}
        </a>
      </main>
    </>
  );
}
