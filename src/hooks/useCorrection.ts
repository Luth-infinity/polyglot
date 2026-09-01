import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";
import { parseCorrection } from "@/lib/parseCorrection";

export function useCorrection() {
  const unlistenersRef = useRef<Array<() => void>>([]);
  const generationRef = useRef(0);
  const bufferRef = useRef<string>("");

  useEffect(
    () => () => {
      unlistenersRef.current.forEach((fn) => fn());
      unlistenersRef.current = [];
    },
    []
  );

  const correct = useCallback(async () => {
    const state = useAppStore.getState();
    if (!state.correctionInput.trim()) return;

    // Same generation guard as translation: without it a second run's deltas
    // were appended to the first run's JSON buffer.
    const gen = ++generationRef.current;
    const isActive = () => generationRef.current === gen;

    unlistenersRef.current.forEach((fn) => fn());
    unlistenersRef.current = [];
    bufferRef.current = "";

    useAppStore.setState({
      isCorrecting: true,
      correctionResult: null,
      correctionError: null,
    });

    const eventId = `correct-${gen}`;

    const fail = (message: string) => {
      if (!isActive()) return;
      useAppStore.setState({ isCorrecting: false, correctionError: message });
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
          const result = parseCorrection(bufferRef.current);
          if (result) {
            useAppStore.setState({ isCorrecting: false, correctionResult: result });
          } else {
            // Previously this only hit console.error, so the spinner just stopped
            // and nothing appeared on screen.
            fail("Could not read the model's answer. Try again.");
          }
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
      await invoke("correct_text", {
        request: {
          text: state.correctionInput,
          mode: state.correctionMode,
          language: state.correctionLang,
          api_key: state.apiKey,
          stream_event: eventId,
        },
      });
    } catch (err) {
      if (isActive() && !useAppStore.getState().correctionError) {
        fail(typeof err === "string" ? err : "Correction failed.");
      }
    }
  }, []);

  return { correct };
}
