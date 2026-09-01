import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { TitleBar } from "@/components/TitleBar";
import { TranslatePanel } from "@/components/TranslatePanel";
import { CorrectPanel } from "@/components/CorrectPanel";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useAppStore, type Tab } from "@/store/appStore";
import { useSettings } from "@/hooks/useSettings";
import { useClipboardTrigger } from "@/hooks/useClipboardTrigger";

export function MainWindow() {
  const activeTab = useAppStore((s) => s.activeTab);

  useSettings();
  useClipboardTrigger();

  // ESC hides the window — but not while a dialog or select is open, or the
  // window would vanish instead of just closing the popup.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.querySelector("[data-slot='dialog-content'], [data-radix-popper-content-wrapper]")) {
        return;
      }
      invoke("hide_window_cmd");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleTabChange = (value: string) => {
    const tab = value as Tab;
    const state = useAppStore.getState();

    if (tab === "correct") {
      // Carry the translation input over so the text does not have to be pasted
      // twice, and queue a run for the panel to pick up once it is mounted.
      const text = state.correctionInput.trim() ? state.correctionInput : state.sourceText;
      useAppStore.setState({
        activeTab: tab,
        correctionInput: text,
        pendingAction: text.trim() && !state.correctionResult ? "correct" : null,
      });
      return;
    }

    useAppStore.setState({ activeTab: tab });
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="bg-background flex h-screen flex-col gap-0 overflow-hidden"
    >
      <TitleBar />

      <TabsContent value="translate" className="mt-0 min-h-0 flex-1 overflow-hidden">
        <TranslatePanel />
      </TabsContent>

      <TabsContent value="correct" className="mt-0 min-h-0 flex-1 overflow-hidden">
        <CorrectPanel />
      </TabsContent>

      <SettingsDialog />
    </Tabs>
  );
}
