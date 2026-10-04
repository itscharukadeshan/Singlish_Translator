/** @format */

import { useMemo } from "react";
import mappingData from "../data/data_list.json";
import {
  fmAbhayaToUnicode,
  findUnicodeErrors,
} from "../data/pitakaFmToUnicode";

function buildUnicodeToFmMap(customUniToFm) {
  const uniToFM = {};
  for (const item of mappingData) {
    if (!item.uni) continue;
    if (item.fm && !(item.uni in uniToFM)) uniToFM[item.uni] = item.fm;
  }
  // User corrections win over the built-in table (e.g. ණි -> Ks, not ‚).
  if (customUniToFm) {
    for (const [uni, fm] of Object.entries(customUniToFm)) {
      if (uni && fm) uniToFM[uni] = fm;
    }
  }
  const maxUniLen = Math.max(1, ...Object.keys(uniToFM).map((k) => k.length));
  return { uniToFM, maxUniLen };
}

function convertWithMap(text, map, maxLen) {
  if (!text) return "";
  let out = "";
  let i = 0;
  while (i < text.length) {
    let matched = false;
    const upper = Math.min(maxLen, text.length - i);
    for (let l = upper; l > 0; l--) {
      const sub = text.slice(i, i + l);
      if (map[sub] !== undefined) {
        out += map[sub];
        i += l;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += text[i];
      i += 1;
    }
  }
  return out;
}

/**
 * Helakuru/Unicode <-> FM-Abhaya converter.
 * - Unicode -> FM-Abhaya: longest-match over data_list.json (max key 5,
 *   covers yansaya/rakaransaya conjuncts).
 * - FM-Abhaya -> Unicode: pitaka.lk improved algorithm
 *   (src/data/pitakaFmToUnicode.js), which fixes UCSC sanjaka/yansaya
 *   errors instead of a naive reverse map (which had 44 collisions).
 */
export default function useConverter(customUniToFm) {
  const maps = useMemo(
    () => buildUnicodeToFmMap(customUniToFm),
    [customUniToFm],
  );

  const unicodeToFmAbhaya = (text) =>
    convertWithMap(text, maps.uniToFM, maps.maxUniLen);

  return {
    unicodeToFmAbhaya,
    fmAbhayaToUnicode,
    findUnicodeErrors,
    stats: {
      uniEntries: Object.keys(maps.uniToFM).length,
      maxUniLen: maps.maxUniLen,
    },
  };
}

export { buildUnicodeToFmMap, convertWithMap };
