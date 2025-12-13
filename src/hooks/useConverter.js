/** @format */

import { useState, useEffect } from "react";
import mappingData from "../data/data_list.json";

export default function useConverter() {
  const [mappingFM, setMappingFM] = useState({});
  const [mappingISI, setMappingISI] = useState({});

  useEffect(() => {
    const fm = {};
    const isi = {};
    mappingData.forEach((item) => {
      if (item.uni && item.fm) fm[item.uni] = item.fm;
      if (item.uni && item.isi) isi[item.uni] = item.isi;
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMappingFM(fm);
    setMappingISI(isi);
  }, []);

  const convertText = (text, style) => {
    const mapping = style === "fm" ? mappingFM : mappingISI;
    let converted = [];
    let i = 0;
    while (i < text.length) {
      let matched = false;
      for (let l = 4; l > 0; l--) {
        const substr = text.slice(i, i + l);
        if (mapping[substr]) {
          converted.push(mapping[substr]);
          i += l;
          matched = true;
          break;
        }
      }
      if (!matched) {
        converted.push(text[i]);
        i++;
      }
    }
    return converted.join("");
  };

  return { convertText };
}
