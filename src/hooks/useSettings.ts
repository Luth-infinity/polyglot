import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect } from "react";
import { Preferences, useAppStore } from "@/store/appStore";

export function useSettings() {
  const preferences = useAppStore((s) => s.preferences);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      invoke<string>("get_api_key").catch(() => ""),
      invoke<Preferences>("get_preferences").catch(() => null),
    ]).then(([key, prefs]) => {
      if (cancelled) return;
      useAppStore.setState({ apiKey: key || "", settingsLoaded: true });
      if (prefs) {
        useAppStore.setState({
          preferences: prefs,
          sourceLang: prefs.default_source_lang,
          targetLang: prefs.default_target_lang,
        });
      }
    });

    // Dark-only for now; the token set in index.css supports both.
    document.documentElement.classList.add("dark");

    return () => {
      cancelled = true;
    };
  }, []);

  const saveApiKey = useCallback(async (key: string) => {
    await invoke("set_api_key", { key });
    useAppStore.setState({ apiKey: key });
  }, []);

  const savePreferences = useCallback(async (prefs: Preferences) => {
    await invoke("set_preferences", { prefs });
    useAppStore.setState({ preferences: prefs });
  }, []);

  return { saveApiKey, savePreferences, preferences };
}
