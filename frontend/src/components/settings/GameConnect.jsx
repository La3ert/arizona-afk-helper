import { useState } from 'react';
import Title from '../Title.jsx';
import Button from '../Button.jsx';

export default function GameConnect({ socket }) {
  const [code, setCode] = useState(() => localStorage.getItem('afk_helper_key') || '');

  const [inputCode, setInputCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const generateBlock = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let block = '';
    for (let i = 0; i < 4; i++) {
      block += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return block;
  };

  const saveCode = (newCode) => {
    setCode(newCode);
    localStorage.setItem('afk_helper_key', newCode);
  };

  const handleGenerate = () => {
    setIsVerifying(true);
    setErrorMsg('');

    const attemptGeneration = () => {
      const newCode = `AFKHELPER-${generateBlock()}-${generateBlock()}-${generateBlock()}-${generateBlock()}`;

      socket.emit('register_new_code', newCode, (response) => {
        if (response.exists) {
          attemptGeneration();
        } else {
          saveCode(newCode);
          setIsVerifying(false);
        }
      });
    };

    attemptGeneration();
  };

  const handleConnect = () => {
    if (!inputCode) return;
    setIsVerifying(true);
    setErrorMsg('');

    socket.emit('verify_code', inputCode, (response) => {
      if (response.valid) {
        saveCode(inputCode);
      } else {
        setErrorMsg('Key not found or invalid');
      }
      setIsVerifying(false);
    });
  };

  const handleUnlink = () => {
    setCode('');
    setInputCode('');
    localStorage.removeItem('afk_helper_key');
  };

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => console.error('Ошибка копирования:', err));
  };

  if (code) {
    return (
      <div className={'game-connect'}>
        <Title title={'Connection Active'} />
        <p className={'game-connect__description'}>
          Your dashboard is linked to this key. Enter it in the /afkhelper menu in the game.
        </p>
        <div className={'game-connect__code-box'}>
          <span className='game-connect__code'>{code}</span>
          <button className='game-connect__copy-btn' onClick={handleCopy}>
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button
          onClick={handleUnlink}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            marginTop: '10px',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Unlink current key
        </button>
      </div>
    );
  }

  return (
    <div className={'game-connect'}>
      <Title title={'Connect Game'} />

      <p className={'game-connect__description'}>
        Generate a unique key to link this browser to your game session.
      </p>
      <Button
        text={isVerifying ? 'Generating...' : 'Generate Key'}
        onClick={handleGenerate}
        disabled={isVerifying}
        className='game-connect__generate-btn'
      />

      <p className={'game-connect__description'} style={{ marginTop: '2rem' }}>
        Or enter an existing key if you already generated one on another device:
      </p>
      <div className='game-connect__input-group'>
        <input
          type='text'
          className='game-connect__input'
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value.toUpperCase())}
          placeholder='AFKHELPER-XXXX-XXXX-XXXX-XXXX'
          disabled={isVerifying}
        />
        <Button
          text={isVerifying ? 'Verifying...' : 'Connect'}
          onClick={handleConnect}
          disabled={isVerifying || !inputCode}
          className='game-connect__connect-btn'
        />
      </div>
      {errorMsg && <p style={{ color: '#ff4d4f', marginTop: '10px' }}>{errorMsg}</p>}
    </div>
  );
}
