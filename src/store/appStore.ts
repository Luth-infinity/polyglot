import { create } from "zustand";

export type CorrectionMode = "grammar" | "style" | "formal" | "casual";
export type Tab = "translate" | "correct";

/// Set by whoever wants a panel to run as soon as it is mounted. Replaces the
/// old `window.dispatchEvent` + setTimeout dance, which fired before the target
/// panel had mounted its listener and silently did nothing.
export type PendingAction = null | "translate" | "correct";

export interface CorrectionChange {
  original: string;
  replacement: string;
  reason: string;
}

export interface CorrectionResult {
  corrected: string;
  changes: CorrectionChange[];
}

export interface Preferences {
  default_source_lang: string;
  default_target_lang: string;
  theme: string;
}

interface AppState {
  // Settings
  apiKey: string;
  settingsLoaded: boolean;
  preferences: Preferences;
  setApiKey: (key: string) => void;
  setSettingsLoaded: (v: boolean) => void;
  setPreferences: (prefs: Preferences) => void;

  // Tab state
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  pendingAction: PendingAction;
  setPendingAction: (a: PendingAction) => void;

  // Translation
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  isTranslating: boolean;
  translationError: string | null;
  setSourceText: (text: string) => void;
  setTranslatedText: (text: string) => void;
  setSourceLang: (lang: string) => void;
  setTargetLang: (lang: string) => void;
  setIsTranslating: (v: boolean) => void;
  setTranslationError: (e: string | null) => void;

  // Correction
  correctionInput: string;
  correctionResult: CorrectionResult | null;
  correctionMode: CorrectionMode;
  correctionLang: string;
  isCorrecting: boolean;
  correctionError: string | null;
  setCorrectionInput: (text: string) => void;
  setCorrectionResult: (r: CorrectionResult | null) => void;
  setCorrectionMode: (m: CorrectionMode) => void;
  setCorrectionLang: (lang: string) => void;
  setIsCorrecting: (v: boolean) => void;
  setCorrectionError: (e: string | null) => void;

  // UI
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  apiKey: "",
  settingsLoaded: false,
  preferences: {
    default_source_lang: "auto",
    default_target_lang: "French",
    theme: "dark",
  },
  setApiKey: (apiKey) => set({ apiKey }),
  setSettingsLoaded: (settingsLoaded) => set({ settingsLoaded }),
  setPreferences: (preferences) => set({ preferences }),

  activeTab: "translate",
  setActiveTab: (activeTab) => set({ activeTab }),
  pendingAction: null,
  setPendingAction: (pendingAction) => set({ pendingAction }),

  sourceText: "",
  translatedText: "",
  sourceLang: "auto",
  targetLang: "French",
  isTranslating: false,
  translationError: null,
  setSourceText: (sourceText) => set({ sourceText }),
  setTranslatedText: (translatedText) => set({ translatedText }),
  setSourceLang: (sourceLang) => set({ sourceLang }),
  setTargetLang: (targetLang) => set({ targetLang }),
  setIsTranslating: (isTranslating) => set({ isTranslating }),
  setTranslationError: (translationError) => set({ translationError }),

  correctionInput: "",
  correctionResult: null,
  correctionMode: "grammar",
  correctionLang: "auto",
  isCorrecting: false,
  correctionError: null,
  setCorrectionInput: (correctionInput) => set({ correctionInput }),
  setCorrectionResult: (correctionResult) => set({ correctionResult }),
  setCorrectionMode: (correctionMode) => set({ correctionMode }),
  setCorrectionLang: (correctionLang) => set({ correctionLang }),
  setIsCorrecting: (isCorrecting) => set({ isCorrecting }),
  setCorrectionError: (correctionError) => set({ correctionError }),

  settingsOpen: false,
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
}));
