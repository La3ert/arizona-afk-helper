export default function Button({ text, onClick, className = '', disabled = false }) {
  return (
    <button className={`btn ${className}`.trim()} onClick={onClick} disabled={disabled}>
      {text}
    </button>
  );
}
