import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ArrowRightLeft, Check, Copy, CornerDownLeft, Languages, Loader2, Replace, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LanguageSelector } from "./LanguageSelector";
import { ErrorNotice } from "./ErrorNotice";
import { useCopyButton } from "@/hooks/useCopyButton";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/store/appStore";
import { MOD_KEY } from "@/lib/platform";

export function TranslatePanel() {
  const sourceText = useAppStore((s) => s.sourceText);
  const translatedText = useAppStore((s) => s.translatedText);
  const sourceLang = useAppStore((s) => s.sourceLang);
  const targetLang = useAppStore((s) => s.targetLang);
  const isTranslating = useAppStore((s) => s.isTranslating);
  const translationError = useAppStore((s) => s.translationError);
  const apiKey = useAppStore((s) => s.apiKey);
  const settingsLoaded = useAppStore((s) => s.settingsLoaded);
  const setSourceText = useAppStore((s) => s.setSourceText);
  const setSourceLang = useAppStore((s) => s.setSourceLang);
  const setTargetLang = useAppStore((s) => s.setTargetLang);

  const { translate } = useTranslation();
  const { copy, copied } = useCopyButton();
  const outputRef = useRef<HTMLDivElement>(null);

  // Runs once on mount when the clipboard trigger queued a translation. Using
  // store state rather than a timed CustomEvent means the request can no longer
  // be fired before this panel exists.
  useEffect(() => {
    const { pendingAction, setPendingAction } = useAppStore.getState();
    if (pendingAction === "translate") {
      setPendingAction(null);
      translate();
    }
  }, [translate]);

  // Keep the newest tokens in view while the answer streams in.
  useEffect(() => {
    const el = outputRef.current;
    if (el && isTranslating) el.scrollTop = el.scrollHeight;
  }, [translatedText, isTranslating]);

  const handleSwap = () => {
    if (sourceLang === "auto") return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    useAppStore.setState({ sourceText: translatedText, translatedText: sourceText });
  };

  const canTranslate = !!sourceText.trim() && !isTranslating;
  const missingKey = settingsLoaded && !apiKey;

  return (
    <div className="flex h-full flex-col gap-2.5 p-3">
      {/* Language bar */}
      <div className="pg-sheen bg-card flex shrink-0 items-center gap-1 rounded-lg border p-1">
        <LanguageSelector
          value={sourceLang}
          onChange={setSourceLang}
          showAuto
          aria-label="Source language"
          className="flex-1"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSwap}
              disabled={sourceLang === "auto"}
              className="text-muted-foreground hover:text-foreground size-7 shrink-0"
            >
              <ArrowRightLeft className="size-3.5" />
              <span className="sr-only">Swap languages</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {sourceLang === "auto" ? "Pick a source language to swap" : "Swap languages"}
          </TooltipContent>
        </Tooltip>
        <LanguageSelector
          value={targetLang}
          onChange={setTargetLang}
          aria-label="Target language"
          className="flex-1"
        />
      </div>

      {/* Panes */}
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2.5">
        <Card className="pg-sheen overflow-hidden">
          <CardContent className="relative">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  translate();
                }
              }}
              placeholder="Type or paste text — or copy twice from any app..."
              className="placeholder:text-muted-foreground/70 size-full resize-none bg-transparent p-3 pr-8 text-sm leading-relaxed outline-none"
            />
            {sourceText && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => useAppStore.setState({ sourceText: "", translatedText: "" })}
                className="text-muted-foreground hover:text-foreground absolute top-1.5 right-1.5"
              >
                <X />
                <span className="sr-only">Clear</span>
              </Button>
            )}
          </CardContent>
          <CardFooter className="text-muted-foreground text-[11px]">
            <span>{sourceText.length > 0 ? `${sourceText.length} chars` : ""}</span>
            <span className="flex items-center gap-1">
              <Kbd>{MOD_KEY}</Kbd>
              <Kbd>
                <CornerDownLeft className="size-2.5" />
              </Kbd>
            </span>
          </CardFooter>
        </Card>

        <Card className="pg-sheen bg-card/60 overflow-hidden">
          <CardContent ref={outputRef} className="overflow-y-auto p-3">
            {translatedText ? (
              <p
                data-selectable
                className="text-sm leading-relaxed whitespace-pre-wrap"
              >
                {translatedText}
                {isTranslating && (
                  <span className="bg-primary pg-caret ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5" />
                )}
              </p>
            ) : isTranslating ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-3.5 animate-spin" />
                Translating...
              </div>
            ) : (
              <div className="text-muted-foreground/50 flex h-full flex-col items-center justify-center gap-2">
                <Languages className="size-6" />
                <span className="text-xs">Translation appears here</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end gap-1">
            <Button
              variant="ghost"
              size="xs"
              disabled={!translatedText || isTranslating}
              onClick={() => copy(translatedText)}
              className="text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="text-success" /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={!translatedText || isTranslating}
                  onClick={() => invoke("replace_with_paste", { text: translatedText })}
                  className="text-primary hover:text-primary"
                >
                  <Replace />
                  Replace
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Paste over the selection in the previous app</TooltipContent>
            </Tooltip>
          </CardFooter>
        </Card>
      </div>

      {/* Status + action */}
      {translationError && <ErrorNotice message={translationError} />}
      {!translationError && missingKey && (
        <ErrorNotice
          variant="warning"
          message="No API key configured — open Settings to add your Claude API key."
        />
      )}

      <div className="flex shrink-0 justify-end">
        <Button
          variant="gradient"
          size="sm"
          onClick={() => translate()}
          disabled={!canTranslate}
          className="min-w-28"
        >
          {isTranslating ? (
            <>
              <Loader2 className="animate-spin" />
              Translating
            </>
          ) : (
            <>
              <Languages />
              Translate
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
