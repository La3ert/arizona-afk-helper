import React from 'react';
import { Menu } from 'lucide-react';

export function MobileHeader({ isOnline, isAuthorized, onOpenSidebar }) {
  return (
    <header className='mobile-header'>
      <div className='mobile-header__logo'>
        <span className='mobile-header__logo-white'>AFK</span>{' '}
        <span className='mobile-header__logo-orange'>HELPER</span>
      </div>

      <div className='mobile-header__right'>
        <div className='mobile-header__indicators'>
          <span
            className={`mobile-header__dot ${isOnline ? 'is-online' : 'is-offline'}`}
            title='Online status'
          />
          <span
            className={`mobile-header__dot ${isAuthorized ? 'is-online' : 'is-offline'}`}
            title='Auth status'
          />
        </div>

        <button className='mobile-header__burger' onClick={onOpenSidebar} aria-label='Open menu'>
          <Menu size={26} />
        </button>
      </div>
    </header>
  );
}
