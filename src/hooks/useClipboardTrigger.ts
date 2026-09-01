import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { useAppStore } from "@/store/appStore";

export function useClipboardTrigger() {
  useEffect(() => {
    const unlisteners: Array<() => void> = [];
    let disposed = false;

    const register = (promise: Promise<() => void>) => {
      promise.then((fn) => (disposed ? fn() : unlisteners.push(fn)));
    };

    // Rust reads the clipboard and passes the text as the event payload.
    register(
      listen<string>("clipboard-double-copy", (event) => {
        const text = event.payload || "";
        if (!text.trim()) return;
        useAppStore.setState({
          sourceText: text,
          correctionInput: text,
          correctionResult: null,
          activeTab: "translate",
          // Picked up by TranslatePanel as soon as it mounts — no timer, so the
          // translation can no longer be dropped because the panel wasn't ready.
          pendingAction: "translate",
        });
      })
    );

    register(listen("open-settings", () => useAppStore.setState({ settingsOpen: true })));

    return () => {
      disposed = true;
      unlisteners.forEach((fn) => fn());
    };
  }, []);
}
