import { useEffect, useRef } from 'react';

export default function ChatLog({ messages }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className='chatLog'>
      {messages.map((item, index) => (
        <div key={index} className='message'>
          <span
            className='message__time'
            style={{
              color: item.parts && item.parts[0] ? item.parts[0].color : '#FFFFFF',
              marginRight: '4px',
            }}
          >
            [{item.time}]
          </span>

          {item.parts?.map((part, partIndex) => (
            <span key={partIndex} style={{ color: part.color }}>
              {part.text}
            </span>
          ))}
        </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
