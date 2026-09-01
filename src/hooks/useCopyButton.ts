import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Copies through the Rust command rather than the clipboard plugin directly:
 * the backend mutes the double-copy watcher for the duration, so pressing Copy
 * no longer risks re-opening the window on its own.
 */
export function useCopyButton(resetAfterMs = 1400) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    []
  );

  const copy = useCallback(
    async (text: string) => {
      if (!text) return;
      try {
        await invoke("copy_to_clipboard", { text });
        setCopied(true);
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setCopied(false), resetAfterMs);
      } catch {
        setCopied(false);
      }
    },
    [resetAfterMs]
  );

  return { copy, copied };
}
