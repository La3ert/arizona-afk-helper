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
      {messages.map((item) => (
        <div key={item.id} className='message'>
          <span className='message__time'>[{item.time}] </span>

          {item.tag && (
            <span className='message__tag' style={{ color: item.tagColor }}>
              {item.tag}{' '}
            </span>
          )}

          {item.author && (
            <span className='message__author' style={{ color: item.nickNameColor }}>
              {item.author}[{item.playerId}]:{' '}
            </span>
          )}

          <span className='message__text' style={{ color: item.textColor }}>
            {item.text}
          </span>
        </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
