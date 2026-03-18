import Toggle from '../Toggle.jsx';
import { sessionData } from '../../sessionData.js';
import { useEffect, useState } from 'react';

export default function Toggles() {
  const [settings, setSettings] = useState({
    chatForwarding: sessionData.settings.chatForwarding,
    payDayStats: sessionData.settings.payDayStats,
    remoteControl: sessionData.settings.remoteControl,
    auto2FA: sessionData.settings.auto2FA,
  });

  useEffect(() => {
    console.log(settings);
  }, [settings]);

  const handleToggle = (settingsKey) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      [settingsKey]: !prevSettings[settingsKey],
    }));
  };

  return (
    <div className='toggles'>
      <div className='toggles__title'>Toggles</div>
      <Toggle
        text={'Chat Forwarding'}
        isChecked={settings.chatForwarding}
        onChange={() => handleToggle('chatForwarding')}
      />
      <Toggle
        text={'PayDay Stats'}
        isChecked={settings.payDayStats}
        onChange={() => handleToggle('payDayStats')}
      />
      <Toggle
        text={'Remote Chat'}
        isChecked={settings.remoteControl}
        onChange={() => handleToggle('remoteControl')}
      />
      <Toggle
        text={'Auto 2FA'}
        isChecked={settings.auto2FA}
        onChange={() => handleToggle('auto2FA')}
      />
    </div>
  );
}
