/** @format */

import { useEffect, useMemo, useRef, useState } from "react";
import useConverter from "./hooks/useConverter";
import useFmCorrections from "./hooks/useFmCorrections";
import Toast from "./components/Toast";
import FmKeyboard from "./components/FmKeyboard";
import FmCorrections from "./components/FmCorrections";
import {
  correctionsToUniOverrides,
  fmAbhayaToUnicodeCustom,
} from "./data/fmCorrections";
import { findUnicodeErrors } from "./data/pitakaFmToUnicode";

const EXAMPLES = [
  { label: "අම්මා", value: "අම්මා" },
  { label: "දි", value: "දි" },
  { label: "ණ", value: "ණ" },
  { label: "ශ්‍රී", value: "ශ්‍රී" },
  { label: "ශ්‍රී ලංකා", value: "ශ්‍රී ලංකා" },
  { label: "සුබ උදෑසනක්", value: "සුබ උදෑසනක්" },
];

export default function App() {
  const [input, setInput] = useState("");
  const [autoCopy, setAutoCopy] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("Copied to clipboard");
  const inputRef = useRef(null);
  const corr = useFmCorrections();

  // One list fixes both directions: FM->Unicode shields snippets from the
  // engine, Unicode->FM takes priority over the built-in table.
  const uniOverrides = useMemo(
    () => correctionsToUniOverrides(corr.entries),
    [corr.entries],
  );
  const { unicodeToFmAbhaya, stats } = useConverter(uniOverrides);
  const fmAbhayaToUnicode = useMemo(
    () => (text) => fmAbhayaToUnicodeCustom(text, corr.entries),
    [corr.entries],
  );

  // Auto direction: any Sinhala block char means Unicode input,
  // otherwise the text is FM-Abhaya codes. FM codes typed into Unicode
  // text pass conversion through untouched.
  const isFmInput = useMemo(() => !/[\u0D80-\u0DFF]/.test(input), [input]);

  const output = useMemo(
    () => (isFmInput ? fmAbhayaToUnicode(input) : unicodeToFmAbhaya(input)),
    [input, isFmInput, fmAbhayaToUnicode, unicodeToFmAbhaya],
  );

  const errors = useMemo(
    () => (isFmInput && output ? findUnicodeErrors(output) : []),
    [isFmInput, output],
  );

  // Auto-copy converted output (on by default).
  useEffect(() => {
    if (!autoCopy || !output) return;
    const t = setTimeout(() => {
      navigator.clipboard?.writeText(output).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [output, autoCopy]);

  const flash = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1400);
  };

  const doCopy = async (text, label = "Copied to clipboard") => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      flash(label);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        flash(label);
      } catch {
        flash("Copy failed — select manually");
      }
      document.body.removeChild(ta);
    }
  };

  const swap = () => {
    // Detection flips automatically once output becomes the input.
    setInput(output);
  };

  const caret = () => {
    const el = inputRef.current;
    if (!el || typeof el.selectionStart !== "number")
      return { s: input.length, e: input.length };
    return { s: el.selectionStart, e: el.selectionEnd };
  };

  const restoreCaret = (pos) => {
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        // focus may fail off-screen — input value is already updated
      }
    });
  };

  // On-screen FM keyboard inserts FM codes at the cursor. In Unicode->FM
  // mode they pass conversion through untouched, so missing letters can be
  // typed directly; in FM->Unicode mode they are the native input.
  const insertAtCursor = (text) => {
    const { s, e } = caret();
    setInput(input.slice(0, s) + text + input.slice(e));
    restoreCaret(s + text.length);
  };

  const backspaceAtCursor = () => {
    const { s, e } = caret();
    if (s !== e) {
      setInput(input.slice(0, s) + input.slice(e));
      restoreCaret(s);
    } else if (s > 0) {
      setInput(input.slice(0, s - 1) + input.slice(e));
      restoreCaret(s - 1);
    }
  };

  return (
    <div className='min-h-screen bg-base-200'>
      <div className='max-w-3xl mx-auto p-4 pb-16'>
        <header className='text-center mt-4 mb-4'>
          <h1 className='text-2xl font-bold'>
            Helakuru Unicode <span className='text-primary'>↔ FM-Abhaya</span>
          </h1>
          <p className='text-sm opacity-70 mt-1'>
            Paste Helakuru Unicode or FM-Abhaya text — direction is detected
            automatically. No install. Works offline after load.
          </p>
        </header>

        {/* Detected direction (auto-switched from what you type) */}
        <div className='flex justify-center mb-3'>
          <span className='badge badge-primary badge-sm'>
            Auto:{" "}
            {input
              ? isFmInput
                ? "FM-Abhaya → යුනිකේත"
                : "යුනිකේත → FM-Abhaya"
              : "paste text to detect"}
          </span>
        </div>

        {/* Editor panes */}
        <div className='grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 items-stretch'>
          <div className='flex flex-col gap-1'>
            <div className='flex items-center justify-between'>
              <span className='text-[11px] font-bold uppercase tracking-wider opacity-60'>
                {!isFmInput ? "Sinhala Unicode (Helakuru)" : "FM-Abhaya"}
              </span>
              <span className='text-[11px] opacity-50'>
                {input.length} chars
              </span>
            </div>
            <textarea
              className='textarea textarea-bordered w-full h-44 resize-y'
              placeholder='Paste Helakuru or FM-Abhaya text here… e.g. දි or È'
              value={input}
              ref={inputRef}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              style={!isFmInput ? undefined : { fontFamily: "FMAbhaya, sans-serif" }}
            />
            <div className='flex gap-2 items-center'>
              <button
                className='btn btn-xs btn-ghost'
                onClick={() => setInput("")}>
                Clear
              </button>
              <span className='text-[11px] opacity-50'>Try:</span>
            </div>
            <div className='flex flex-wrap gap-1'>
              {EXAMPLES.map((e) => (
                <button
                  key={e.label}
                  className='btn btn-xs btn-ghost border'
                  onClick={() => setInput(e.value)}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div className='flex md:flex-col justify-center items-center'>
            <button
              title='Swap direction'
              className='btn btn-sm btn-circle btn-outline'
              onClick={swap}>
              ⇄
            </button>
          </div>

          <div className='flex flex-col gap-1'>
            <div className='flex items-center justify-between'>
              <span className='text-[11px] font-bold uppercase tracking-wider opacity-60'>
                {!isFmInput ? "FM-Abhaya (font text)" : "Sinhala Unicode"}
              </span>
              <span className='text-[11px] opacity-50'>
                {output.length} chars
              </span>
            </div>
            <textarea
              className='textarea textarea-bordered w-full h-44 bg-base-100 resize-y'
              value={output}
              readOnly
              placeholder='Output appears here in real time…'
              style={!isFmInput ? { fontFamily: "FMAbhaya, sans-serif" } : undefined}
            />
            <div className='flex gap-2 items-center'>
              <button
                className='btn btn-xs btn-primary'
                disabled={!output}
                onClick={() => doCopy(output)}>
                Copy
              </button>
              <label className='flex items-center gap-1 text-xs cursor-pointer'>
                <input
                  type='checkbox'
                  className='toggle toggle-xs toggle-primary'
                  checked={autoCopy}
                  onChange={() => setAutoCopy(!autoCopy)}
                />
                Auto-copy
              </label>
            </div>
            {errors.length > 0 && (
              <p className='text-xs text-error'>
                Unicode errors: {errors.join(" ")}
              </p>
            )}
          </div>
        </div>

        <FmKeyboard
          onInsert={insertAtCursor}
          onBackspace={backspaceAtCursor}
          corrections={corr.entries}
          flash={flash}
        />

        <FmCorrections hook={corr} flash={flash} />

        <div className='mt-4 border rounded-lg bg-base-100 p-3 text-xs opacity-80 space-y-1'>
          <p>
            <b>How to use:</b> paste Helakuru Unicode or FM-Abhaya text —
            direction is detected automatically. Copy the result, then paste
            into Word/Photoshop with the <b>FM-Abhaya</b> font applied.
            Example: <code>දි</code> → <code>È</code>, <code>ණ</code> →{" "}
            <code>K</code>, <code>ශ්‍රී</code> → <code>›</code>.
          </p>
          <p>
            The FM-Abhaya output only looks like Sinhala when the FM-Abhaya
            font is installed and selected — otherwise it shows as ASCII codes.
            Fonts:{" "}
            <a
              className='link link-primary'
              href='https://pitaka.lk/tools/unicode/download_unicode.htm'>
              pitaka.lk Unicode fonts
            </a>
            . Conversion engine follows{" "}
            <a
              className='link link-primary'
              href='https://pitaka.lk/tools/unicode/fm_to_unicode.htm'>
              pitaka.lk FM → Unicode
            </a>{" "}
            (fixes UCSC sanjaka/yansaya errors). Table: {stats.uniEntries}{" "}
            entries, max key {stats.maxUniLen}.
          </p>
        </div>

        <footer className='text-center text-xs opacity-60 mt-8 space-y-1'>
          <p>Typing stays on your device. No server, no tracking.</p>
        </footer>
      </div>
      <Toast show={showToast} message={toastMsg} />
    </div>
  );
}
