/** @format */

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_ROWS,
  SPECIAL_LABELS,
  STORAGE_KEY,
  applyOverrides,
  isLetterCode,
  loadKeyOverrides,
} from "../data/fmKeyboard";
import { fmAbhayaToUnicode } from "../data/pitakaFmToUnicode";
import { fmAbhayaToUnicodeCustom } from "../data/fmCorrections";

function glyphFor(code, corrections) {
  if (code === " ") return "␣";
  if (code === "\t") return "⇥";
  if (code === "\n") return "⏎";
  const converted =
    corrections && corrections.length > 0
      ? fmAbhayaToUnicodeCustom(code, corrections)
      : fmAbhayaToUnicode(code);
  if (converted !== code) return converted;
  return SPECIAL_LABELS[code] ?? code;
}

export default function FmKeyboard({
  onInsert,
  onBackspace,
  corrections,
  flash,
}) {
  const [visible, setVisible] = useState(true);
  const [editing, setEditing] = useState(false);
  const [shiftOn, setShiftOn] = useState(false);
  const [lockOn, setLockOn] = useState(false);
  const [overrides, setOverrides] = useState(() => loadKeyOverrides());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      // private mode — edits still work for this session
    }
  }, [overrides]);

  const rows = useMemo(
    () => applyOverrides(DEFAULT_ROWS, overrides),
    [overrides],
  );

  // Glyph per key for both layers, so the board matches the FM chart
  // (base glyph large, shifted glyph small) without hand transcription.
  // Respects FM corrections, so keys show what they actually convert to.
  const labels = useMemo(() => {
    const map = {};
    for (const row of rows) {
      for (const key of row) {
        if (key.action || key.code === undefined) continue;
        map[key.id] = {
          base: glyphFor(key.code, corrections),
          shifted: key.shift ? glyphFor(key.shift, corrections) : null,
        };
      }
    }
    return map;
  }, [rows, corrections]);

  const customCount = Object.keys(overrides).length;

  const press = (key) => {
    if (key.action === "backspace") {
      onBackspace();
      return;
    }
    if (key.action === "tab") {
      onInsert("\t");
      setShiftOn(false);
      return;
    }
    if (key.action === "enter") {
      onInsert("\n");
      setShiftOn(false);
      return;
    }
    if (key.action === "shift") {
      setShiftOn((v) => !v);
      return;
    }
    if (key.action === "lock") {
      setLockOn((v) => !v);
      return;
    }
    const useShift =
      shiftOn || (lockOn && isLetterCode(key.code) && isLetterCode(key.shift));
    const code = useShift && key.shift ? key.shift : key.code;
    onInsert(code);
    if (shiftOn) setShiftOn(false);
  };

  const setOverride = (id, field, value) => {
    const v = (value ?? "").slice(0, 1);
    setOverrides((prev) => {
      const next = { ...prev };
      if (!v) {
        // Empty restores the built-in code for that slot.
        if (!next[id]) return prev;
        const { [id]: _removed, ...rest } = next;
        return rest;
      }
      return { ...next, [id]: { ...next[id], [field]: v } };
    });
  };

  const editableKeys = useMemo(
    () =>
      rows
        .flat()
        .filter((k) => !k.action && k.code !== undefined && k.id !== "Space"),
    [rows],
  );

  return (
    <div className='mt-4 border rounded-lg bg-base-100 p-3'>
      <div className='flex flex-wrap items-center gap-2 mb-2'>
        <button
          className='btn btn-sm btn-ghost border'
          onClick={() => setVisible((v) => !v)}>
          {visible ? "Hide" : "Show"} FM keyboard
        </button>
        {visible && (
          <>
            <button
              className={`btn btn-xs ${editing ? "btn-primary" : "btn-ghost border"}`}
              onClick={() => setEditing((v) => !v)}>
              {editing ? "Done editing" : "Edit keys"}
            </button>
            {customCount > 0 && (
              <>
                <span className='badge badge-secondary badge-sm'>
                  {customCount} custom key{customCount > 1 ? "s" : ""}
                </span>
                <button
                  className='btn btn-xs btn-ghost text-error'
                  onClick={() => {
                    setOverrides({});
                    flash("Keyboard reset to FM-Abhaya layout");
                  }}>
                  Reset
                </button>
              </>
            )}
            <span className='text-[11px] opacity-60 ml-auto'>
              Click a key to type it{shiftOn ? " · SHIFT on" : ""}
              {lockOn ? " · LOCK on" : ""}
            </span>
          </>
        )}
      </div>

      {visible && !editing && (
        <div className='flex flex-col gap-1 select-none'>
          {rows.map((row, ri) => (
            <div key={ri} className='flex gap-1'>
              {row.map((key) => {
                if (key.action === "shift")
                  return (
                    <button
                      key={key.id + ri}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => press(key)}
                      className={`btn btn-xs h-12 p-0 ${shiftOn ? "btn-primary" : "btn-ghost border"}`}
                      style={{ flex: key.flex ?? 1 }}>
                      Shift
                    </button>
                  );
                if (key.action === "lock")
                  return (
                    <button
                      key={key.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => press(key)}
                      className={`btn btn-xs h-12 p-0 ${lockOn ? "btn-primary" : "btn-ghost border"}`}
                      style={{ flex: key.flex ?? 1 }}>
                      Lock
                    </button>
                  );
                if (key.action)
                  return (
                    <button
                      key={key.id + (key.label ?? "")}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => press(key)}
                      className='btn btn-xs btn-ghost border h-12 p-0'
                      style={{ flex: key.flex ?? 1 }}>
                      {key.label}
                    </button>
                  );
                const lab = labels[key.id] ?? { base: key.code };
                const showingShift = shiftOn || lockOn;
                return (
                  <button
                    key={key.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => press(key)}
                    title={`FM code: ${showingShift && key.shift ? key.shift : key.code}`}
                    className={`btn btn-ghost border h-12 p-0 flex-col gap-0 leading-none ${showingShift ? "bg-primary/10" : ""}`}
                    style={{ flex: key.flex ?? 1 }}>
                    <span className='text-base'>
                      {showingShift && lab.shifted ? lab.shifted : lab.base}
                    </span>
                    <span className='text-[9px] opacity-50'>
                      {showingShift && key.shift ? key.shift : key.code}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
          <p className='text-[11px] opacity-60 mt-1'>
            Keys insert FM-Abhaya codes at the cursor — including letters the
            Unicode table misses. Shift applies to the next key only; Lock
            holds capitals.
          </p>
        </div>
      )}

      {visible && editing && (
        <div className='flex flex-col gap-2'>
          <p className='text-xs opacity-70'>
            Change the FM code any key types. Clear a box to restore its
            built-in code. Saved on this device instantly.
          </p>
          <div className='overflow-x-auto max-h-72 overflow-y-auto border rounded'>
            <table className='table table-xs'>
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Base code</th>
                  <th>Shift code</th>
                  <th>Types now</th>
                </tr>
              </thead>
              <tbody>
                {editableKeys.map((key) => (
                  <tr key={key.id}>
                    <td>
                      <code>{key.id.replace(/^(Key|Digit)/, "")}</code>
                    </td>
                    <td>
                      <input
                        className='input input-bordered input-xs w-16 text-center font-mono'
                        value={key.code}
                        maxLength={1}
                        onChange={(e) =>
                          setOverride(key.id, "code", e.target.value)
                        }
                        spellCheck={false}
                      />
                    </td>
                    <td>
                      <input
                        className='input input-bordered input-xs w-16 text-center font-mono'
                        value={key.shift ?? ""}
                        maxLength={1}
                        placeholder='—'
                        onChange={(e) =>
                          setOverride(key.id, "shift", e.target.value)
                        }
                        spellCheck={false}
                      />
                    </td>
                    <td className='text-base'>
                      {glyphFor(key.code, corrections)}{" "}
                      <span className='text-error text-sm'>
                        {key.shift ? glyphFor(key.shift, corrections) : ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
