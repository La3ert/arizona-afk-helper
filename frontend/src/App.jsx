import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ChatAndCommands from './pages/ChatAndCommands.jsx';
import Settings from './pages/Settings.jsx';

import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

const socket = io('http://localhost:3000');

function App() {
  const [messages, setMessages] = useState([]);
  const [sessionData, setSessionData] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    socket.on('chat_message', (data) => {
      console.log('📥 Catch message from server:', data);

      setMessages((prevMessages) => {
        return [...prevMessages, data];
      });
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
    <BrowserRouter>
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
              <ChatAndCommands chatMessages={messages} onSendMessage={sendMessageToServer} />
            }
          />
          <Route path='settings' element={<Settings />} />

          <Route path='*' element={<Navigate to='/' replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
