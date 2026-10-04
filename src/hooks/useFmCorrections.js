/** @format */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SEED_CORRECTIONS,
  STORAGE_KEY,
  loadCorrections,
} from "../data/fmCorrections";

export default function useFmCorrections() {
  const [entries, setEntries] = useState(() => loadCorrections());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // private mode — edits still work for this session
    }
  }, [entries]);

  // One rule per FM code: adding an existing code updates it.
  const addEntry = useCallback((fm, uni, note = "") => {
    if (typeof fm !== "string" || fm.length === 0)
      throw new Error("FM code required");
    if (fm.length > 12) throw new Error("FM code: max 12 chars");
    if (typeof uni !== "string") throw new Error("Unicode value must be text");
    if (uni.length > 12) throw new Error("Unicode: max 12 chars");
    setEntries((prev) => {
      const next = prev.filter((e) => e.fm !== fm);
      return [...next, { fm, uni, note: (note ?? "").slice(0, 60) }];
    });
  }, []);

  const removeEntry = useCallback((fm) => {
    setEntries((prev) => prev.filter((e) => e.fm !== fm));
  }, []);

  const resetAll = useCallback(() => {
    setEntries(SEED_CORRECTIONS.map((e) => ({ ...e })));
  }, []);

  const seededCount = useMemo(
    () =>
      entries.filter((e) =>
        SEED_CORRECTIONS.some((s) => s.fm === e.fm && s.uni === e.uni),
      ).length,
    [entries],
  );

  return { entries, addEntry, removeEntry, resetAll, seededCount };
}
