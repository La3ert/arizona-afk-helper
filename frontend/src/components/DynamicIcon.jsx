export default function DynamicIcon({ type, value }) {
  return (
    <span className={`dynamic-icon ${type}`}>
      <img className='chat-icon' src={'icons/' + type + '.png'} alt={type} />
      {type !== 'call' && ' №'}
      {value}
    </span>
  );
}
