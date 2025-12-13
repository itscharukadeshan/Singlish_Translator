/** @format */

export default function OutputBox({ value }) {
  return (
    <textarea
      className='textarea textarea-bordered w-full bg-base-200'
      value={value}
      readOnly
      rows={6}
    />
  );
}
