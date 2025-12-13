/** @format */

export default function Toast({ show, message }) {
  return (
    <div
      className={`toast toast-bottom toast-center transition-opacity ${
        show ? "opacity-100" : "opacity-0"
      }`}>
      <div className='alert alert-success'>{message}</div>
    </div>
  );
}
