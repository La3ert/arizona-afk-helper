import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ChatAndCommands from './pages/ChatAndCommands.jsx';
import Settings from './pages/Settings.jsx';

import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');

const defaultSettings = {
  chatForwarding: true,
  payDayStats: true,
  remoteControl: false,
  auto2FA: false,
};

const defaultSessionData = {
  player: {
    nickname: 'No info',
    server: 'No info',
    isOnline: false,
    isAuthorized: false,
    level: 0,
    curExp: 0,
    maxExp: 0,
    bankBalance: 0,
    depositBalance: 0,
    AZCoinsBalance: 0,
  },
  session: {
    totalEarnedAZCoins: 0,
    totalEarnedExp: 0,
    totalEarned: 0,
    totalSalary: 0,
    totalDeposit: 0,
    totalDividends: 0,
    totalPayDays: 0,
    hourlyPayDays: 0,
  },
  lastPayDay: {
    time: null,
    earnedAZCoins: 0,
    earnedExp: 0,
    totalEarned: 0,
    salary: 0,
    deposit: 0,
    dividends: 0,
  },
};

function App() {
  const [messages, setMessages] = useState([]);
  const [sessionData, setSessionData] = useState(defaultSessionData);
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    const savedKey = localStorage.getItem('afk_helper_key');
    if (savedKey) {
      console.log('🔄 Found saved key, verifying session...', savedKey);
      socket.emit('verify_code', savedKey, (response) => {
        if (!response.valid) {
          console.warn('❌ Session expired or server restarted. Please generate a new key.');
        }
      });
    }

    socket.on('chat_message', (data) => {
      console.log('📥 Catch message from server:', data);
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    socket.on('sessionData', (data) => {
      setSessionData(data);
    });

    socket.on('settings_update', (data) => {
      setSettings(data);
    });

    return () => {
      socket.off('chat_message');
      socket.off('sessionData');
      socket.off('settings_update');
    };
  }, []);

  const sendMessageToServer = (text) => {
    socket.emit('client_message', { message: text });
  };

  const handleToggleSetting = (key, newValue) => {
    socket.emit('toggle_setting', { key: key, value: newValue });
  };

  return (
    <HashRouter>
      <Routes>
        <Route
          path='/'
          element={
            <MainLayout
              sessionData={sessionData}
              settings={settings}
              onToggle={handleToggleSetting}
            />
          }
        >
          <Route index element={<Dashboard sessionData={sessionData} />} />
          <Route
            path='chat'
            element={
              <ChatAndCommands
                chatMessages={messages}
                onSendMessage={sendMessageToServer}
                settings={settings}
              />
            }
          />
          <Route path='settings' element={<Settings socket={socket} />} />

          <Route path='*' element={<Navigate to='/' replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
