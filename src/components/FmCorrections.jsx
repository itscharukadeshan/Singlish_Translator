/** @format */

import { useMemo, useState } from "react";
import {
  fmAbhayaToUnicodeCustom,
} from "../data/fmCorrections";
import { fmAbhayaToUnicode } from "../data/pitakaFmToUnicode";

function showCode(s) {
  if (s === "") return <span className='opacity-40'>(strip)</span>;
  return <code>{s}</code>;
}

export default function FmCorrections({ hook, flash }) {
  const { entries, addEntry, removeEntry, resetAll } = hook;
  const [open, setOpen] = useState(true);
  const [fm, setFm] = useState("");
  const [uni, setUni] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const rows = useMemo(
    () =>
      entries.map((e) => ({
        ...e,
        engineDefault: fmAbhayaToUnicode(e.fm),
        corrected: fmAbhayaToUnicodeCustom(e.fm, entries),
      })),
    [entries],
  );

  const submit = () => {
    setError("");
    try {
      addEntry(fm, uni, note.trim());
      setFm("");
      setUni("");
      setNote("");
      flash("Correction saved — applies instantly");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className='mt-4 border rounded-lg bg-base-100 p-3'>
      <div className='flex flex-wrap items-center gap-2 mb-2'>
        <button
          className='btn btn-sm btn-ghost border'
          onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Show"} FM corrections
        </button>
        <span className='badge badge-secondary badge-sm'>
          {entries.length} rule{entries.length === 1 ? "" : "s"}
        </span>
        <button
          className='btn btn-xs btn-ghost text-error ml-auto'
          onClick={() => {
            if (window.confirm("Reset corrections to defaults?")) {
              resetAll();
              flash("Corrections reset");
            }
          }}>
          Reset
        </button>
      </div>

      {open && (
        <div className='flex flex-col gap-2'>
          <p className='text-xs opacity-70'>
            Wrong engine mappings go here — e.g. U+201A alone is{" "}
            <b>not</b> ණි, the correct FM code is <code>Ks</code>. Each rule
            shields its FM snippet from the engine (FM→යුනිකේත) and takes
            priority in the reverse direction too. Empty Unicode strips the
            code.
          </p>

          <div className='grid md:grid-cols-[1fr_1fr_1fr_auto] gap-2'>
            <input
              className='input input-bordered input-sm w-full font-mono'
              placeholder='FM code… e.g. Ks'
              value={fm}
              onChange={(e) => setFm(e.target.value)}
              spellCheck={false}
            />
            <input
              className='input input-bordered input-sm w-full text-base'
              placeholder='Unicode… e.g. ණි'
              value={uni}
              onChange={(e) => setUni(e.target.value)}
            />
            <input
              className='input input-bordered input-sm w-full'
              placeholder='Note (optional)'
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button className='btn btn-sm btn-primary' onClick={submit}>
              Add / Update
            </button>
          </div>
          {error && (
            <div className='alert alert-error alert-sm py-2 text-sm'>
              {error}
            </div>
          )}

          <div className='overflow-x-auto border rounded'>
            <table className='table table-xs'>
              <thead>
                <tr>
                  <th>FM code</th>
                  <th>Becomes</th>
                  <th>Engine gave</th>
                  <th>Note</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.fm}>
                    <td>
                      <code>{r.fm}</code>
                    </td>
                    <td className='text-base'>
                      {r.uni === "" ? (
                        <span className='opacity-40 text-xs'>(strip)</span>
                      ) : (
                        r.uni
                      )}
                    </td>
                    <td className='text-base opacity-60'>
                      {r.engineDefault === r.corrected ? (
                        <span className='text-xs opacity-60'>same</span>
                      ) : (
                        showCode(r.engineDefault)
                      )}
                    </td>
                    <td className='opacity-70 text-xs'>{r.note}</td>
                    <td className='text-right'>
                      <button
                        className='btn btn-xs btn-ghost text-error'
                        onClick={() => removeEntry(r.fm)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className='opacity-50'>
                      No corrections — engine defaults apply.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
