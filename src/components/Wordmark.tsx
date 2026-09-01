import { cn } from "@/lib/utils";

/**
 * Le glyphe de l'icône, sans son squircle et en `currentColor` : il suit le
 * thème au lieu d'être une image figée. Les tracés sont ceux de
 * `SVG/icon-hublink.svg`, dans son repère, la vue étant simplement recadrée sur
 * le glyphe — les deux ne peuvent donc pas diverger silencieusement.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="121 181 783 648"
      fill="none"
      aria-hidden="true"
      className={cn("h-4 w-auto", className)}
    >
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

/** Le monogramme complet de la barre de titre : glyphe + nom. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <Mark />
      <span className="text-[13px] font-semibold tracking-tight">Polyglot</span>
    </span>
  );
}
