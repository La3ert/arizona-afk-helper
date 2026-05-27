import React from 'react';
import { iconMap } from '../utils/icons.js';
import { iconFiles } from '../utils/icon-manifest.js';

export default function ChatIcon({ code }) {
  let imageSrc = iconMap[code];

  if (!imageSrc) {
    let normalizedCode = code.replace(/^:|:$/g, '').toUpperCase();

    if (normalizedCode.startsWith('UF') && normalizedCode.length === 5) {
      normalizedCode = 'U0' + normalizedCode.substring(1);
    }

    const foundFile = iconFiles.find((filePath) => {
      const fileName = filePath.split('/').pop().toUpperCase();
      return (
        fileName.startsWith(normalizedCode + '_') ||
        fileName === normalizedCode + '.SVG' ||
        fileName === normalizedCode + '.PNG'
      );
    });

    if (foundFile) {
      imageSrc = `/icons/${foundFile}`;
    }
  }

  if (!imageSrc) {
    return <span>{code}</span>;
  }

  return <img src={imageSrc} alt={`Icon ${code}`} className='chat-icon' title={code} />;
}
