/** @format */

import { useState, useEffect } from "react";
import InputBox from "./components/InputBox";
import OutputBox from "./components/OutputBox";
import StyleSelector from "./components/StyleSelector";
import Toast from "./components/Toast";
import useConverter from "./hooks/useConverter";
import FontSelector from "./components/FontSelector";

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [style, setStyle] = useState("fm");
  const [autoCopy, setAutoCopy] = useState(true);
  const [showToast, setShowToast] = useState(false);

  const { convertText } = useConverter();
  // const [font, setFont] = useState("font-sans");

  useEffect(() => {
    const result = convertText(input, style);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOutput(result);
    if (autoCopy && result) {
      navigator.clipboard
        .writeText(result)
        .then(() => {
          setShowToast(true);
          setTimeout(() => setShowToast(false), 1200);
        })
        .catch(console.error);
    }
  }, [input, style, autoCopy]);

  const handleManualCopy = () => {
    if (output) {
      navigator.clipboard
        .writeText(output)
        .then(() => {
          setShowToast(true);
          setTimeout(() => setShowToast(false), 1200);
        })
        .catch(console.error);
    }
  };

  return (
    <div className='max-w-2xl mx-auto p-4'>
      <h1 className='text-xl font-semibold text-center mb-4'>
        Sinhala Converter
      </h1>

      <InputBox value={input} onChange={setInput} />

      {/* <FontSelector font={font} setFont={setFont} />  */}

      <StyleSelector style={style} setStyle={setStyle} />

      <div className='flex items-center gap-2 mb-3'>
        <input
          type='checkbox'
          className='toggle toggle-primary'
          checked={autoCopy}
          onChange={() => setAutoCopy(!autoCopy)}
        />
        <span>Auto Copy</span>
      </div>

      <OutputBox value={output} />

      {!autoCopy && (
        <button
          className='btn btn-sm btn-secondary mt-2'
          onClick={handleManualCopy}>
          Copy
        </button>
      )}

      <Toast show={showToast} message='Copied to clipboard' />
    </div>
  );
}
