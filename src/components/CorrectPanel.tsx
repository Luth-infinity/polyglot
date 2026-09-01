import { useEffect } from "react";
import { CornerDownLeft, Loader2, SpellCheck, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { LanguageSelector } from "./LanguageSelector";
import { CorrectionResult } from "./CorrectionResult";
import { ErrorNotice } from "./ErrorNotice";
import { useCorrection } from "@/hooks/useCorrection";
import { CorrectionMode, useAppStore } from "@/store/appStore";
import { MOD_KEY } from "@/lib/platform";
import { cn } from "@/lib/utils";

const MODES: Array<{ key: CorrectionMode; label: string; hint: string }> = [
  { key: "grammar", label: "Grammar", hint: "Spelling and grammar only" },
  { key: "style", label: "Style", hint: "Clearer, better flow" },
  { key: "formal", label: "Formal", hint: "Professional register" },
  { key: "casual", label: "Casual", hint: "Friendly, natural register" },
];

export function CorrectPanel() {
  const correctionInput = useAppStore((s) => s.correctionInput);
  const correctionResult = useAppStore((s) => s.correctionResult);
  const correctionMode = useAppStore((s) => s.correctionMode);
  const correctionLang = useAppStore((s) => s.correctionLang);
  const isCorrecting = useAppStore((s) => s.isCorrecting);
  const correctionError = useAppStore((s) => s.correctionError);
  const apiKey = useAppStore((s) => s.apiKey);
  const settingsLoaded = useAppStore((s) => s.settingsLoaded);
  const setCorrectionInput = useAppStore((s) => s.setCorrectionInput);
  const setCorrectionLang = useAppStore((s) => s.setCorrectionLang);

  const { correct } = useCorrection();

  useEffect(() => {
    const { pendingAction, setPendingAction } = useAppStore.getState();
    if (pendingAction === "correct") {
      setPendingAction(null);
      correct();
    }
  }, [correct]);

  const selectMode = (mode: CorrectionMode) => {
    if (mode === correctionMode) return;
    useAppStore.setState({ correctionMode: mode });
    // Changing the mode invalidates the previous answer; re-run rather than
    // leaving a result on screen that no longer matches the selected mode.
    if (correctionInput.trim() && !isCorrecting) correct();
  };

  const canCorrect = !!correctionInput.trim() && !isCorrecting;
  const missingKey = settingsLoaded && !apiKey;

  return (
    <div className="flex h-full flex-col gap-2.5 p-3">
      {/* Mode + language */}
      <div className="pg-sheen bg-card flex shrink-0 items-center gap-1 rounded-lg border p-1">
        <div className="flex items-center gap-0.5">
          {MODES.map((mode) => (
            <button
              key={mode.key}
              onClick={() => selectMode(mode.key)}
              title={mode.hint}
              className={cn(
                "focus-visible:ring-ring/50 h-7 rounded-md px-3.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2",
                correctionMode === mode.key
                  ? "pg-gradient pg-glow text-white"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <div className="bg-border mx-1 ml-auto h-5 w-px" />
        <LanguageSelector
          value={correctionLang}
          onChange={setCorrectionLang}
          showAuto
          aria-label="Text language"
          className="w-36"
        />
      </div>

      {/* Input */}
      <Card className="pg-sheen h-32 shrink-0 overflow-hidden">
        <CardContent className="relative">
          <textarea
            value={correctionInput}
            onChange={(e) => setCorrectionInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                correct();
              }
            }}
            placeholder="Paste the text to proofread..."
            className="placeholder:text-muted-foreground/70 size-full resize-none bg-transparent p-3 pr-8 text-sm leading-relaxed outline-none"
          />
          {correctionInput && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() =>
                useAppStore.setState({ correctionInput: "", correctionResult: null })
              }
              className="text-muted-foreground hover:text-foreground absolute top-1.5 right-1.5"
            >
              <X />
              <span className="sr-only">Clear</span>
            </Button>
          )}
        </CardContent>
        <CardFooter className="text-muted-foreground text-[11px]">
          <span>{correctionInput.length > 0 ? `${correctionInput.length} chars` : ""}</span>
          <span className="flex items-center gap-1">
            <Kbd>{MOD_KEY}</Kbd>
            <Kbd>
              <CornerDownLeft className="size-2.5" />
            </Kbd>
          </span>
        </CardFooter>
      </Card>

      <div className="flex shrink-0 justify-end">
        <Button
          variant="gradient"
          size="sm"
          onClick={() => correct()}
          disabled={!canCorrect}
          className="min-w-28"
        >
          {isCorrecting ? (
            <>
              <Loader2 className="animate-spin" />
              Checking
            </>
          ) : (
            <>
              <SpellCheck />
              Correct
            </>
          )}
        </Button>
      </div>

      {correctionError && <ErrorNotice message={correctionError} />}
      {!correctionError && missingKey && (
        <ErrorNotice
          variant="warning"
          message="No API key configured — open Settings to add your Claude API key."
        />
      )}

      {/* Result */}
      <div className="min-h-0 flex-1">
        {isCorrecting && !correctionResult ? (
          <div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Analysing...
          </div>
        ) : correctionResult ? (
          <CorrectionResult result={correctionResult} />
        ) : (
          !correctionError && (
            <div className="text-muted-foreground/50 flex h-full flex-col items-center justify-center gap-2">
              <Wand2 className="size-6" />
              <span className="text-xs">The corrected version appears here</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
