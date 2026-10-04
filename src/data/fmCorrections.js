/** @format */

import { fmAbhayaToUnicode } from "./pitakaFmToUnicode";

export const STORAGE_KEY = "fm-corrections-v1";

// Seed: U+201A (single low-9 quote) is NOT ණි — the correct FM spelling is Ks.
// Entry 1 makes Ks→ණි explicit (and fixes Unicode→FM to emit Ks).
// Entry 2 shields U+201A from the engine so it passes through untouched.
export const SEED_CORRECTIONS = [
  { fm: "Ks", uni: "ණි", note: "Correct FM spelling of ණි" },
  { fm: "\u201A", uni: "\u201A", note: "Not ණි — pass through (type Ks instead)" },
];

export function loadCorrections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_CORRECTIONS.map((e) => ({ ...e }));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_CORRECTIONS.map((e) => ({ ...e }));
    return parsed.filter(
      (e) => e && typeof e.fm === "string" && typeof e.uni === "string",
    );
  } catch {
    return SEED_CORRECTIONS.map((e) => ({ ...e }));
  }
}

// PUA placeholders survive the pitaka pipeline untouched (it only matches
// ASCII/Sinhala literals and digits pass through, so the index itself is
// PUA-encoded, never ASCII).
const PUA_A = "\uE000";
const PUA_B = "\uE001";
const PUA_D_BASE = 57360;

function placeholder(i) {
  return PUA_A + String.fromCharCode(PUA_D_BASE + (i % 512)) + PUA_B;
}

/**
 * FM-Abhaya -> Unicode with user corrections applied first.
 * Each correction shields its FM snippet from the engine and restores the
 * custom Unicode afterwards — so corrections can override AND remove
 * built-in rules. Longest FM first, so `Ks` wins over `K`.
 */
export function fmAbhayaToUnicodeCustom(input, corrections) {
  if (!input) return "";
  const rules = (corrections ?? []).filter(
    (r) => r && typeof r.fm === "string" && r.fm.length > 0,
  );
  if (rules.length === 0) return fmAbhayaToUnicode(input);
  const sorted = [...rules].sort((a, b) => b.fm.length - a.fm.length);
  let text = input;
  const held = [];
  for (const r of sorted) {
    if (!text.includes(r.fm)) continue;
    const ph = placeholder(held.length);
    held.push({ ph, uni: r.uni ?? "" });
    text = text.split(r.fm).join(ph);
  }
  const converted = fmAbhayaToUnicode(text);
  let out = converted;
  for (const { ph, uni } of held) {
    out = out.split(ph).join(uni);
  }
  return out;
}

/**
 * Derive Unicode->FM overrides from the same list (later entries win),
 * so one correction fixes both directions. Entries with empty fm/uni
 * are skipped here.
 */
export function correctionsToUniOverrides(corrections) {
  const map = {};
  for (const r of corrections ?? []) {
    if (!r || !r.fm || !r.uni) continue;
    map[r.uni] = r.fm;
  }
  return map;
}
