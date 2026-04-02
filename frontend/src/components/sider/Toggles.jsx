import Toggle from '../Toggle.jsx';
import { useEffect, useState } from 'react';

export default function Toggles({ settings, onToggle }) {
  const handleToggle = (settingsKey) => {};

  if (!settings) {
    return <div className='toggles'>Загрузка настроек...</div>;
  }

  return (
    <div className='toggles'>
      <div className='toggles__title'>Toggles</div>
      <Toggle
        text={'Chat Forwarding'}
        isChecked={settings.chatForwarding}
        onChange={() => onToggle('chatForwarding', !settings.chatForwarding)}
      />
      <Toggle
        text={'PayDay Stats'}
        isChecked={settings.payDayStats}
        onChange={() => onToggle('payDayStats', !settings.payDayStats)}
      />
      <Toggle
        text={'Remote Chat'}
        isChecked={settings.remoteControl}
        onChange={() => onToggle('remoteControl', !settings.remoteControl)}
      />
      <Toggle
        text={'Auto 2FA'}
        isChecked={settings.auto2FA}
        onChange={() => onToggle('auto2FA', !settings.auto2FA)}
      />
    </div>
  );
}
