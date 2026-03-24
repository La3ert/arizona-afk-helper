import { useState } from 'react';
import { chatLog } from '../chatLog.jsx';
import ChatLog from '../components/chatAndCommands/ChatLog.jsx';
import Title from '../components/Title.jsx';
import ChatInput from '../components/chatAndCommands/ChatInput.jsx';

export default function ChatAndCommands() {
  const [messages] = useState(chatLog);

  const handleSendMessage = (text) => {
    console.log('Отправлено в игру (Lua):', text);
  };

  return (
    <div className='chat-page'>
      <Title title={'Chat and Commands'} />
      <ChatLog messages={messages} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
