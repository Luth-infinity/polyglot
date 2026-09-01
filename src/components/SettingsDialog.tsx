import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LanguageSelector } from "./LanguageSelector";
import { UpdateSection } from "./UpdateBadge";
import { useSettings } from "@/hooks/useSettings";
import { Preferences, useAppStore } from "@/store/appStore";

// Registered as CONTROL+SHIFT+T on every platform, macOS included.
const SHORTCUT = ["Ctrl", "Shift", "T"];

export function SettingsDialog() {
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const apiKey = useAppStore((s) => s.apiKey);
  const preferences = useAppStore((s) => s.preferences);
  const { saveApiKey, savePreferences } = useSettings();

  const [keyInput, setKeyInput] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localPrefs, setLocalPrefs] = useState<Preferences>(preferences);

  // The store loads asynchronously, so the dialog has to resync when it opens —
  // otherwise it showed an empty key over a perfectly valid stored one.
  useEffect(() => {
    if (settingsOpen) {
      setKeyInput(apiKey);
      setLocalPrefs(preferences);
      setShowKey(false);
      setSaved(false);
    }
  }, [settingsOpen, apiKey, preferences]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (keyInput !== apiKey) await saveApiKey(keyInput.trim());
      await savePreferences(localPrefs);
      setSaved(true);
      setTimeout(() => setSettingsOpen(false), 550);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="flex max-h-[calc(100vh-1.5rem)] w-[440px] flex-col gap-0 p-0 sm:max-w-[440px]">
        <DialogHeader className="shrink-0 px-5 pt-5 pb-4">
          <DialogTitle className="text-base">Settings</DialogTitle>
          <DialogDescription className="text-xs">
            Stored locally on this machine and used only to call the Anthropic API.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-muted-foreground">
              <KeyRound className="size-3" />
              Claude API key
            </Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                spellCheck={false}
                autoComplete="off"
                className="pr-9 font-mono text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowKey((v) => !v)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 -translate-y-1/2"
              >
                {showKey ? <EyeOff /> : <Eye />}
                <span className="sr-only">{showKey ? "Hide" : "Show"} key</span>
              </Button>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Model: <span className="font-mono">claude-haiku-4-5</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Default languages</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-card rounded-lg border p-1">
                <p className="text-muted-foreground px-2 pt-1 text-[10px] uppercase tracking-wider">
                  Source
                </p>
                <LanguageSelector
                  value={localPrefs.default_source_lang}
                  onChange={(v) => setLocalPrefs((p) => ({ ...p, default_source_lang: v }))}
                  showAuto
                  aria-label="Default source language"
                />
              </div>
              <div className="bg-card rounded-lg border p-1">
                <p className="text-muted-foreground px-2 pt-1 text-[10px] uppercase tracking-wider">
                  Target
                </p>
                <LanguageSelector
                  value={localPrefs.default_target_lang}
                  onChange={(v) => setLocalPrefs((p) => ({ ...p, default_target_lang: v }))}
                  aria-label="Default target language"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Version</Label>
            <UpdateSection />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Shortcuts</Label>
            <div className="bg-card divide-border divide-y rounded-lg border text-xs">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-muted-foreground">Show Polyglot</span>
                <span className="flex gap-1">
                  {SHORTCUT.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-muted-foreground">Capture the selected text</span>
                <span className="flex items-center gap-1">
                  <Kbd>Ctrl</Kbd>
                  <Kbd>C</Kbd>
                  <span className="text-muted-foreground/60">×2</span>
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-muted-foreground">Hide the window</span>
                <Kbd>Esc</Kbd>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter className="shrink-0 px-5 py-3">
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || saved} className="min-w-20">
            {saving ? (
              <Loader2 className="animate-spin" />
            ) : saved ? (
              <>
                <Check />
                Saved
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
