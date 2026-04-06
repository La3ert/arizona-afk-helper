export default function Header({ player }) {
  return (
    <header className='header'>
      <div className='logo'>
        <div className='logo-text'>
          <span className='text'>AFK </span>
          <span className='text text--primary'>HELPER</span>
        </div>
      </div>

      {player ? (
        <div className='user-info'>
          <div className='user-icon'>{player.nickname.charAt(0).toUpperCase()}</div>
          <div className='user-name'>{player.nickname}</div>
          <div className='user-server'>{player.server}</div>
          <div className='user-status'>
            <div
              className={
                'user-status__text ' +
                (player.isOnline ? 'user-status__text--success' : 'user-status__text--danger')
              }
            >
              {player.isOnline ? 'Online' : 'Offline'}
            </div>
            <div
              className={
                'user-status__text ' +
                (player.isAuthorized ? 'user-status__text--success' : 'user-status__text--danger')
              }
            >
              {player.isAuthorized ? 'Authorized' : 'Not Authorized'}
            </div>
          </div>
        </div>
      ) : (
        <div className='user-info-loader' style={{ color: 'gray', fontSize: '14px' }}>
          Waiting for player data... ⏳
        </div>
      )}
    </header>
  );
}
