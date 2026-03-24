import Button from '../Button.jsx';
import { useState } from 'react';

export default function ChatInput({ onSendMessage }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() === '') return;

    onSendMessage(text);

    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className='chat-input'>
      <input
        className='chat-input__input'
        placeholder='Type message or command...'
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button text={'Send'} onClick={handleSend} />
    </div>
  );
}
