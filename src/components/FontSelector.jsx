/** @format */

export default function FontSelector({ font, setFont }) {
  const fonts = [
    { name: "System", class: "font-sans" },
    { name: "Serif", class: "font-serif" },
  ];

  return (
    <div className='flex gap-2 mb-3 items-center'>
      <label className='mr-2'>Font:</label>
      <select
        className='select select-bordered select-sm'
        value={font}
        onChange={(e) => setFont(e.target.value)}>
        {fonts.map((f) => (
          <option key={f.class} value={f.class}>
            {f.name}
          </option>
        ))}
      </select>
    </div>
  );
}
