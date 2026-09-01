import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";

export function useTranslation() {
  const unlistenersRef = useRef<Array<() => void>>([]);
  const generationRef = useRef(0);
  const bufferRef = useRef<string>("");
  const flushTimerRef = useRef<number | null>(null);

  const stopStreaming = useCallback(() => {
    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, []);

  // A hidden window keeps its React tree alive, so leaked listeners and timers
  // would accumulate over a whole session.
  useEffect(
    () => () => {
      stopStreaming();
      unlistenersRef.current.forEach((fn) => fn());
      unlistenersRef.current = [];
    },
    [stopStreaming]
  );

  const flush = useCallback(() => {
    // SET (not append) — translatedText always equals the full buffer so far,
    // preventing concatenation if two translations somehow overlap.
    useAppStore.setState({ translatedText: bufferRef.current });
  }, []);

  const translate = useCallback(
    async (text?: string) => {
      const state = useAppStore.getState();
      const inputText = text ?? state.sourceText;
      if (!inputText.trim()) return;

      // Increment generation — old listeners check isActive() and bail out.
      const gen = ++generationRef.current;
      const isActive = () => generationRef.current === gen;

      unlistenersRef.current.forEach((fn) => fn());
      unlistenersRef.current = [];
      stopStreaming();

      useAppStore.setState({
        isTranslating: true,
        translatedText: "",
        translationError: null,
      });
      bufferRef.current = "";

      const eventId = `translate-${gen}`;
      flushTimerRef.current = window.setInterval(flush, 50);

      const fail = (message: string) => {
        if (!isActive()) return;
        stopStreaming();
        flush();
        useAppStore.setState({ isTranslating: false, translationError: message });
      };

      let listeners: Array<() => void>;
      try {
        listeners = await Promise.all([
          listen<string>(eventId, (event) => {
            if (!isActive()) return;
            bufferRef.current += event.payload;
          }),
          listen(`${eventId}-done`, () => {
            if (!isActive()) return;
            stopStreaming();
            flush();
            useAppStore.setState({ isTranslating: false });
          }),
          listen<string>(`${eventId}-error`, (event) => fail(event.payload)),
        ]);
      } catch {
        fail("Could not open the response stream.");
        return;
      }

      if (!isActive()) {
        listeners.forEach((fn) => fn());
        return;
      }
      unlistenersRef.current = listeners;

      try {
        await invoke("translate_text", {
          request: {
            text: inputText,
            source_lang: state.sourceLang,
            target_lang: state.targetLang,
            api_key: state.apiKey,
            stream_event: eventId,
          },
        });
      } catch (err) {
        // The backend already emitted a readable message on the -error channel;
        // this only catches the cases where it could not.
        if (isActive() && !useAppStore.getState().translationError) {
          fail(typeof err === "string" ? err : "Translation failed.");
        }
      }
    },
    [flush, stopStreaming]
  );

  return { translate };
}
