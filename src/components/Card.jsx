export default function Card({ image, title, value, footer, withProgressBar = false, progressPercentage = 0 }) {
  return (
    <div className='card'>
      <div className='card__title'>
        <img src={image} alt={title} className='card__title-image' />
        <div className='card__title-text'>{title}</div>
      </div>
      <div className='card__value'>{value}</div>
      <div className={'card__footer'}>
        {footer && <div className='card__footer-text'>{footer}</div>}
        {withProgressBar && (
          <div className='card__progress-bar'>
            <div
              className='card__progress-bar-fill'
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
