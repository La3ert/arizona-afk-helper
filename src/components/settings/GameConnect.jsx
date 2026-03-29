import { useState } from 'react';
import Title from '../Title.jsx';
import Button from '../Button.jsx';

export default function GameConnect() {
  const [code, setCode] = useState('');

  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = () => {
    const newCode = 'AFK-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setCode(newCode);
    setIsCopied(false);
  };

  const handleCopy = () => {
    if (!code) return;

    navigator.clipboard
      .writeText(code)
      .then(() => {
        setIsCopied(true);

        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      })
      .catch((err) => console.error('Ошибка копирования:', err));
  };

  return (
    <div className={'game-connect'}>
      <Title title={'Connect Game'} />
      <p className={'game-connect__description'}>
        Generate a unique key and enter it in the /afkhelper menu in the game to activate
        synchronization.
      </p>
      <Button text={'Generate Key'} onClick={handleGenerate} />{' '}
      <div className={'game-connect__code-box'}>
        <span className='game-connect__code'>{code}</span>
        <button className='game-connect__copy-btn' onClick={handleCopy}>
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
