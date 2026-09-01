import { useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Check, ChevronDown, Copy, Replace } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCopyButton } from "@/hooks/useCopyButton";
import type { CorrectionResult as CorrectionResultType } from "@/store/appStore";
import { cn } from "@/lib/utils";

interface Props {
  result: CorrectionResultType;
}

interface Segment {
  text: string;
  reason?: string;
}

/** Splits the corrected text so each replacement can be highlighted in place. */
function buildSegments(result: CorrectionResultType): Segment[] {
  const segments: Segment[] = [];
  let remaining = result.corrected;

  for (const change of result.changes) {
    // An empty replacement matches at index 0 forever and used to emit a run of
    // empty marks, so skip anything we cannot locate meaningfully.
    if (!change.replacement?.trim()) continue;
    const idx = remaining.indexOf(change.replacement);
    if (idx === -1) continue;
    if (idx > 0) segments.push({ text: remaining.slice(0, idx) });
    segments.push({ text: change.replacement, reason: change.reason });
    remaining = remaining.slice(idx + change.replacement.length);
  }

  if (remaining) segments.push({ text: remaining });
  return segments;
}

export function CorrectionResult({ result }: Props) {
  const [showChanges, setShowChanges] = useState(true);
  const { copy, copied } = useCopyButton();

  const segments = useMemo(() => buildSegments(result), [result]);
  const changeCount = result.changes.length;

  return (
    <Card className="pg-sheen h-full overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Result</CardTitle>
          <Badge
            variant={changeCount > 0 ? "secondary" : "outline"}
            className="h-4.5 px-1.5 text-[10px] font-medium"
          >
            {changeCount === 0
              ? "No changes needed"
              : `${changeCount} change${changeCount > 1 ? "s" : ""}`}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => copy(result.corrected)}
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
                onClick={() => invoke("replace_with_paste", { text: result.corrected })}
                className="text-primary hover:text-primary"
              >
                <Replace />
                Replace
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Paste over the selection in the previous app</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto p-3">
        <p data-selectable className="text-sm leading-relaxed whitespace-pre-wrap">
          {segments.map((segment, i) =>
            segment.reason !== undefined ? (
              <mark
                key={i}
                title={segment.reason}
                className="bg-success/15 text-success decoration-success/40 rounded-[3px] px-0.5 underline decoration-dotted underline-offset-2"
              >
                {segment.text}
              </mark>
            ) : (
              <span key={i}>{segment.text}</span>
            )
          )}
        </p>
      </CardContent>

      {changeCount > 0 && (
        <div className="shrink-0 border-t">
          <button
            onClick={() => setShowChanges((v) => !v)}
            className="text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 px-3 py-1.5 text-[11px] transition-colors"
          >
            <ChevronDown
              className={cn("size-3 transition-transform", !showChanges && "-rotate-90")}
            />
            Details
          </button>
          {showChanges && (
            <div className="max-h-24 space-y-1 overflow-y-auto px-3 pb-2">
              {result.changes.map((change, i) => (
                <div key={i} className="flex items-baseline gap-1.5 text-[11px] leading-relaxed">
                  <span className="text-destructive/80 line-through">{change.original}</span>
                  <span className="text-muted-foreground/60">&rarr;</span>
                  <span className="text-success">{change.replacement}</span>
                  {change.reason && (
                    <span className="text-muted-foreground truncate">— {change.reason}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
