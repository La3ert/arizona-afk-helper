import { sessionData } from '../../sessionData.js';

export default function Header() {
  return (
    <header className='header'>
      <div className='logo'>
        {/*<img src='#' alt='afk-helper' className='logo-img' />*/}
        <div className='logo-text'>
          <span className='text'>AFK </span>
          <span className='text text--primary'>HELPER</span>
        </div>
      </div>
      <div className='user-info'>
        <div className='user-icon'>{sessionData.player.nickname.charAt(0).toUpperCase()}</div>
        <div className='user-name'>{sessionData.player.nickname}</div>
        <div className='user-server'>{sessionData.player.server}</div>
        <div className='user-status'>
          <div
            className={
              'user-status__text ' +
              (sessionData.player.isOnline
                ? 'user-status__text--success'
                : 'user-status__text--danger')
            }
          >
            {sessionData.player.isOnline ? 'Online' : 'Offline'}
          </div>
          <div
            className={
              'user-status__text ' +
              (sessionData.player.isAuthorized
                ? 'user-status__text--success'
                : 'user-status__text--danger')
            }
          >
            {sessionData.player.isAuthorized ? 'Authorized' : 'Not Authorized'}
          </div>
        </div>
      </div>
    </header>
  );
}
