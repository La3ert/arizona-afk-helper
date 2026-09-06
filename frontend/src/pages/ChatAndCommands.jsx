import ChatLog from '../components/chatAndCommands/ChatLog.jsx';
import Title from '../components/Title.jsx';
import ChatInput from '../components/chatAndCommands/ChatInput.jsx';

export default function ChatAndCommands({ chatMessages, onSendMessage, settings }) {
  const handleSendMessage = (text) => {
    onSendMessage(text);
  };

  if (!settings) {
    return <div style={{ color: 'white', padding: '2rem' }}>Loading settings...</div>;
  }

  return (
    <div className='chat-page'>
      <Title title={'Chat and Commands'} />
      <ChatLog messages={chatMessages} />
      {settings?.remoteControl && <ChatInput onSendMessage={handleSendMessage} />}
    </div>
  );
}
