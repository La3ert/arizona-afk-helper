export default function Toggle({ text, isChecked, onChange }) {
  return (
    <div className='toggle'>
      <span className='toggle__text'>{text}</span>
      <label className='toggle__label'>
        <input
          className='toggle__input'
          type='checkbox'
          defaultChecked={isChecked}
          onChange={onChange}
        />
        <span className='toggle__slider'></span>
      </label>
    </div>
  );
}
