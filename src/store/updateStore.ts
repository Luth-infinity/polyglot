import { create } from "zustand";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "up-to-date"
  | "error";

interface UpdateState {
  status: UpdateStatus;
  /** Version proposed by the endpoint, once one is available. */
  version: string | null;
  /** Version currently running, read from the bundle at startup. */
  currentVersion: string;
  notes: string | null;
  /** 0-100, or null while the total size is unknown. */
  progress: number | null;
  error: string | null;
  /** True once a check has completed, so Settings can stop saying "unknown". */
  checked: boolean;
  /** Dismissed for this session — the badge hides, Settings still shows it. */
  dismissed: boolean;
  reset: () => void;
}

export const useUpdateStore = create<UpdateState>((set) => ({
  status: "idle",
  version: null,
  currentVersion: "",
  notes: null,
  progress: null,
  error: null,
  checked: false,
  dismissed: false,
  reset: () =>
    set({ status: "idle", version: null, notes: null, progress: null, error: null }),
}));
