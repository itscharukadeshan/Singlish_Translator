/** @format */

export default function StyleSelector({ style, setStyle }) {
  return (
    <div className='flex gap-2 mb-3'>
      <button
        className={`btn btn-primary btn-sm ${
          style === "fm" ? "btn-active" : ""
        }`}
        onClick={() => setStyle("fm")}>
        FM
      </button>
      <button
        className={`btn btn-secondary btn-sm ${
          style === "isi" ? "btn-active" : ""
        }`}
        onClick={() => setStyle("isi")}>
        ISI
      </button>
    </div>
  );
}
