import { useCallback, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const RECENTS_KEY = "polyglot.recentLanguages";
const MAX_RECENTS = 4;

function loadRecents(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((l) => LANGUAGES.includes(l)) : [];
  } catch {
    return [];
  }
}

interface LanguageSelectorProps {
  value: string;
  onChange: (lang: string) => void;
  showAuto?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * 68 languages behind one trigger. Radix gives us type-ahead for free ("fre"
 * jumps to French); the recents group covers the two or three that get used
 * every day.
 */
export function LanguageSelector({
  value,
  onChange,
  showAuto = false,
  className,
  "aria-label": ariaLabel,
}: LanguageSelectorProps) {
  const [recents, setRecents] = useState<string[]>(loadRecents);

  const handleChange = useCallback(
    (lang: string) => {
      onChange(lang);
      if (lang === "auto") return;
      setRecents((prev) => {
        const next = [lang, ...prev.filter((l) => l !== lang)].slice(0, MAX_RECENTS);
        try {
          localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
        } catch {
          // Private mode / quota: recents are a convenience, never a hard failure.
        }
        return next;
      });
    },
    [onChange]
  );

  const visibleRecents = useMemo(() => recents.filter((l) => l !== value), [recents, value]);

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className={cn(
          "h-7 w-full border-0 bg-transparent px-2 text-xs font-medium shadow-none",
          "hover:bg-accent/60 focus-visible:ring-[2px] data-[state=open]:bg-accent/60",
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {showAuto && (
          <SelectItem value="auto" className="text-xs">
            <span className="text-primary font-medium">Auto-detect</span>
          </SelectItem>
        )}

        {visibleRecents.length > 0 && (
          <>
            {showAuto && <SelectSeparator />}
            <SelectGroup>
              <SelectLabel className="text-[10px] uppercase tracking-wider">Recent</SelectLabel>
              {visibleRecents.map((lang) => (
                <SelectItem key={`recent-${lang}`} value={lang} className="text-xs">
                  {lang}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
          </>
        )}

        <SelectGroup>
          <SelectLabel className="text-[10px] uppercase tracking-wider">All languages</SelectLabel>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang} value={lang} className="text-xs">
              {lang}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
