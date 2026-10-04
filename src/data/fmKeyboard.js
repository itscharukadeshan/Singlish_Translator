/** @format */

// On-screen FM-Abhaya keyboard layout (physical QWERTY order, as in the
// classic FM-Abhaya layout chart). Each printable key carries the FM ASCII
// code it types (`code`) plus its shifted code (`shift`). Glyphs shown on
// keys are derived at runtime via the pitaka FM->Unicode engine, so the
// board always matches the converter. Users can override codes per key;
// overrides persist in localStorage.

export const STORAGE_KEY = "fm-keyboard-layout-v1";

// flex controls key width. `action` keys are handled by the component.
export const DEFAULT_ROWS = [
  [
    { id: "Backquote", code: "`", shift: "~", flex: 1 },
    { id: "Digit1", code: "1", shift: "!", flex: 1 },
    { id: "Digit2", code: "2", shift: "@", flex: 1 },
    { id: "Digit3", code: "3", shift: "#", flex: 1 },
    { id: "Digit4", code: "4", shift: "$", flex: 1 },
    { id: "Digit5", code: "5", shift: "%", flex: 1 },
    { id: "Digit6", code: "6", shift: "^", flex: 1 },
    { id: "Digit7", code: "7", shift: "&", flex: 1 },
    { id: "Digit8", code: "8", shift: "*", flex: 1 },
    { id: "Digit9", code: "9", shift: "(", flex: 1 },
    { id: "Digit0", code: "0", shift: ")", flex: 1 },
    { id: "Minus", code: "-", shift: "_", flex: 1 },
    { id: "Equal", code: "=", shift: "+", flex: 1 },
    { id: "Backspace", action: "backspace", label: "Bk Spc", flex: 2 },
  ],
  [
    { id: "Tab", action: "tab", label: "Tab", flex: 1.5 },
    { id: "KeyQ", code: "q", shift: "Q", flex: 1 },
    { id: "KeyW", code: "w", shift: "W", flex: 1 },
    { id: "KeyE", code: "e", shift: "E", flex: 1 },
    { id: "KeyR", code: "r", shift: "R", flex: 1 },
    { id: "KeyT", code: "t", shift: "T", flex: 1 },
    { id: "KeyY", code: "y", shift: "Y", flex: 1 },
    { id: "KeyU", code: "u", shift: "U", flex: 1 },
    { id: "KeyI", code: "i", shift: "I", flex: 1 },
    { id: "KeyO", code: "o", shift: "O", flex: 1 },
    { id: "KeyP", code: "p", shift: "P", flex: 1 },
    { id: "BracketLeft", code: "[", shift: "{", flex: 1 },
    { id: "BracketRight", code: "]", shift: "}", flex: 1 },
    { id: "Backslash", code: "\\", shift: "|", flex: 1.5 },
  ],
  [
    { id: "Lock", action: "lock", label: "Lock", flex: 1.75 },
    { id: "KeyA", code: "a", shift: "A", flex: 1 },
    { id: "KeyS", code: "s", shift: "S", flex: 1 },
    { id: "KeyD", code: "d", shift: "D", flex: 1 },
    { id: "KeyF", code: "f", shift: "F", flex: 1 },
    { id: "KeyG", code: "g", shift: "G", flex: 1 },
    { id: "KeyH", code: "h", shift: "H", flex: 1 },
    { id: "KeyJ", code: "j", shift: "J", flex: 1 },
    { id: "KeyK", code: "k", shift: "K", flex: 1 },
    { id: "KeyL", code: "l", shift: "L", flex: 1 },
    { id: "Semicolon", code: ";", shift: ":", flex: 1 },
    { id: "Quote", code: "'", shift: '"', flex: 1 },
    { id: "Enter", action: "enter", label: "Enter", flex: 2.25 },
  ],
  [
    { id: "ShiftLeft", action: "shift", label: "Shift", flex: 2.25 },
    { id: "KeyZ", code: "z", shift: "Z", flex: 1 },
    { id: "KeyX", code: "x", shift: "X", flex: 1 },
    { id: "KeyC", code: "c", shift: "C", flex: 1 },
    { id: "KeyV", code: "v", shift: "V", flex: 1 },
    { id: "KeyB", code: "b", shift: "B", flex: 1 },
    { id: "KeyN", code: "n", shift: "N", flex: 1 },
    { id: "KeyM", code: "m", shift: "M", flex: 1 },
    { id: "Comma", code: ",", shift: "<", flex: 1 },
    { id: "Period", code: ".", shift: ">", flex: 1 },
    { id: "Slash", code: "/", shift: "?", flex: 1 },
    { id: "ShiftRight", action: "shift", label: "Shift", flex: 2.75 },
  ],
  [{ id: "Space", code: " ", label: "Space", flex: 10 }],
];

// Lone FM codes with no standalone Unicode rendering get an explicit label
// (`f` is a prefix sign — it only converts together with a consonant).
export const SPECIAL_LABELS = { f: "ෙ" };

export function loadKeyOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function applyOverrides(rows, overrides) {
  if (!overrides || Object.keys(overrides).length === 0) return rows;
  return rows.map((row) =>
    row.map((key) => {
      const over = overrides[key.id];
      if (!over || key.action) return key;
      return {
        ...key,
        code: typeof over.code === "string" ? over.code : key.code,
        shift:
          typeof over.shift === "string" && over.shift
            ? over.shift
            : key.shift,
      };
    }),
  );
}

export function isLetterCode(code) {
  return /^[a-zA-Z]$/.test(code ?? "");
}
