/** @format */

export default function InputBox({ value, onChange }) {
  return (
    <textarea
      className='textarea textarea-bordered w-full mb-3'
      placeholder='Type Unicode Sinhala...'
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={5}
    />
  );
}
