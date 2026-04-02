import ChatLog from '../components/chatAndCommands/ChatLog.jsx';
import Title from '../components/Title.jsx';
import ChatInput from '../components/chatAndCommands/ChatInput.jsx';

export default function ChatAndCommands({ chatMessages, onSendMessage }) {
  const handleSendMessage = (text) => {
    onSendMessage(text);
  };

  return (
    <div className='chat-page'>
      <Title title={'Chat and Commands'} />
      <ChatLog messages={chatMessages} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
