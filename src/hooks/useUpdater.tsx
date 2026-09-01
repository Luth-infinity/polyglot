import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { useUpdateStore } from "@/store/updateStore";

// Polyglot stays open for days on end. Checking only at launch would let a
// version published mid-afternoon sit unnoticed until the next reboot.
const FIRST_DELAY = 20_000;
const INTERVAL = 2 * 60 * 60 * 1000;

interface UpdaterApi {
  check: (manual?: boolean) => Promise<void>;
  install: () => Promise<void>;
  restart: () => Promise<void>;
}

const UpdaterContext = createContext<UpdaterApi | null>(null);

/**
 * Owns the single polling timer and the pending `Update` handle. The badge in
 * the title bar and the Settings panel both drive the same instance through
 * the context, so there is never a second interval running.
 *
 * The plugin verifies a minisign signature before installing anything, so a
 * tampered artifact is rejected even if the endpoint itself is compromised.
 */
export function UpdaterProvider({ children }: { children: React.ReactNode }) {
  const pendingRef = useRef<Update | null>(null);
  const inFlightRef = useRef(false);

  const runCheck = useCallback(async (manual = false) => {
    if (inFlightRef.current) return;
    // Never interrupt a download in progress with a background check.
    const { status } = useUpdateStore.getState();
    if (status === "downloading" || status === "ready") return;

    inFlightRef.current = true;
    if (manual) useUpdateStore.setState({ status: "checking", error: null });

    try {
      const update = await check();
      if (update) {
        pendingRef.current = update;
        useUpdateStore.setState({
          status: "available",
          version: update.version,
          notes: update.body ?? null,
          error: null,
          checked: true,
        });
      } else {
        pendingRef.current = null;
        useUpdateStore.setState({
          status: manual ? "up-to-date" : "idle",
          version: null,
          error: null,
          checked: true,
        });
      }
    } catch (err) {
      // Offline, endpoint down, or running `tauri dev` (no bundle to update).
      // A background failure must never pop anything on screen.
      const message = err instanceof Error ? err.message : String(err);
      useUpdateStore.setState({
        status: manual ? "error" : "idle",
        error: manual ? message : null,
        checked: true,
      });
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const install = useCallback(async () => {
    const update = pendingRef.current;
    if (!update) return;

    useUpdateStore.setState({ status: "downloading", progress: 0, error: null });

    let total = 0;
    let received = 0;

    try {
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength ?? 0;
            useUpdateStore.setState({ progress: total ? 0 : null });
            break;
          case "Progress":
            received += event.data.chunkLength;
            if (total > 0) {
              useUpdateStore.setState({
                progress: Math.min(99, Math.round((received / total) * 100)),
              });
            }
            break;
          case "Finished":
            useUpdateStore.setState({ progress: 100 });
            break;
        }
      });
      useUpdateStore.setState({ status: "ready" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      useUpdateStore.setState({ status: "error", progress: null, error: message });
    }
  }, []);

  const restart = useCallback(async () => {
    try {
      await relaunch();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      useUpdateStore.setState({ status: "error", error: message });
    }
  }, []);

  useEffect(() => {
    getVersion()
      .then((v) => useUpdateStore.setState({ currentVersion: v }))
      .catch(() => useUpdateStore.setState({ currentVersion: "" }));

    const first = window.setTimeout(() => runCheck(), FIRST_DELAY);
    const timer = window.setInterval(() => runCheck(), INTERVAL);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [runCheck]);

  const api = useMemo(
    () => ({ check: runCheck, install, restart }),
    [runCheck, install, restart]
  );

  return <UpdaterContext.Provider value={api}>{children}</UpdaterContext.Provider>;
}

export function useUpdater(): UpdaterApi {
  const api = useContext(UpdaterContext);
  if (!api) throw new Error("useUpdater must be used inside <UpdaterProvider>");
  return api;
}
