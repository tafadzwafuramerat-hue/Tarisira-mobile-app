import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

export function BrandSymbol({ size, reversed = false }: { size: number; reversed?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Rect x="17" y="21" width="84" height="14" rx="7" fill={reversed ? '#FFFFFF' : '#005F3C'} />
      <Rect x="17" y="47" width="58" height="14" rx="7" fill={reversed ? '#FFFFFF' : '#005F3C'} />
      <Path d="M 45,78 L 64,97 L 105,40" stroke="#E8A04C" strokeWidth="15.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
