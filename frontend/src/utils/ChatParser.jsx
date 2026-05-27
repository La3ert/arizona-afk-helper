import React from 'react';
import ChatIcon from '../components/ChatIcon';
import DynamicIcon from '../components/DynamicIcon';
import { iconMap } from './icons.js';

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const iconKeys = Object.keys(iconMap)
  .sort((a, b) => b.length - a.length)
  .map(escapeRegExp);

const staticPattern = iconKeys.join('|');
const dynamicPattern = ':(?:house|lavka|biz|call)\\d+:';
const newIconPattern = ':[a-zA-Z0-9]+(?:_[a-zA-Z0-9]+)?:';

const testPattern = new RegExp(`^(${staticPattern}|${dynamicPattern}|${newIconPattern})$`);
const splitPattern = new RegExp(`(${staticPattern}|${dynamicPattern}|${newIconPattern})`, 'g');

export const parseChatText = (text) => {
  if (!text) return null;

  const parts = text.split(splitPattern);

  return parts.map((part, index) => {
    if (part && testPattern.test(part)) {
      if (/^:(house|lavka|biz|call)\d+:$/.test(part)) {
        const parsed = part.match(/^:([a-z]+)(\d+):$/);
        const type = parsed[1];
        const value = parsed[2];
        return <DynamicIcon key={index} type={type} value={value} />;
      }
      return <ChatIcon key={index} code={part} />;
    }

    return part;
  });
};
