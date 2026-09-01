/** `navigator.platform` is deprecated but still the most reliable signal inside a webview. */
export const IS_MAC = /mac/i.test(navigator.platform || navigator.userAgent);

/** Label for the modifier used by the in-app shortcuts (Ctrl+Enter / Cmd+Enter). */
export const MOD_KEY = IS_MAC ? "\u2318" : "Ctrl";
