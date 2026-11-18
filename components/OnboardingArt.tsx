import React from 'react';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';

const GREEN = '#064E3B';
const AMBER = '#F5A000';
const MINT = '#E3F4EC';
const WHITE = '#FFFFFF';

function SvgFrame({ children, size }: { children: React.ReactNode; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 240 240">
      <Circle cx="120" cy="120" r="118" fill={MINT} />
      {children}
    </Svg>
  );
}

export function ShopIllustration({ size = 240 }: { size?: number }) {
  return (
    <SvgFrame size={size}>
      <Rect x="60" y="92" width="120" height="96" rx="8" fill={WHITE} />
      <Path d="M60 92 L120 54 L180 92 Z" fill={GREEN} />
      <Rect x="96" y="128" width="48" height="60" rx="4" fill={GREEN} />
      <Rect x="108" y="142" width="10" height="10" rx="2" fill={AMBER} />
      <Circle cx="132" cy="147" r="3" fill={WHITE} />
      <Rect x="74" y="108" width="24" height="20" rx="3" fill={MINT} />
      <Rect x="142" y="108" width="24" height="20" rx="3" fill={MINT} />
      <Circle cx="120" cy="76" r="10" fill={AMBER} />
      <Path d="M100 176 Q120 160 140 176" stroke={GREEN} strokeWidth="6" strokeLinecap="round" fill="none" />
      <Rect x="164" y="132" width="28" height="44" rx="6" fill={GREEN} />
      <Rect x="168" y="136" width="20" height="30" rx="2" fill={MINT} />
      <Circle cx="178" cy="170" r="2.5" fill={WHITE} />
    </SvgFrame>
  );
}

export function ChartsIllustration({ size = 240 }: { size?: number }) {
  return (
    <SvgFrame size={size}>
      <Rect x="52" y="142" width="26" height="56" rx="4" fill={GREEN} />
      <Rect x="92" y="116" width="26" height="82" rx="4" fill={AMBER} />
      <Rect x="132" y="88" width="26" height="110" rx="4" fill={GREEN} />
      <Rect x="172" y="64" width="26" height="134" rx="4" fill={AMBER} />
      <Line x1="44" y1="200" x2="206" y2="200" stroke={GREEN} strokeWidth="4" strokeLinecap="round" />
      <Circle cx="60" cy="60" r="14" fill={WHITE} stroke={GREEN} strokeWidth="4" />
      <Path d="M60 52 L60 68 M52 60 L68 60" stroke={GREEN} strokeWidth="4" strokeLinecap="round" />
      <Rect x="150" y="30" width="60" height="14" rx="7" fill={GREEN} />
    </SvgFrame>
  );
}

export function GrowthIllustration({ size = 240 }: { size?: number }) {
  return (
    <SvgFrame size={size}>
      <Path d="M56 180 L96 140 L128 168 L186 96" stroke={GREEN} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M160 96 L186 96 L186 122" stroke={GREEN} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x="56" y="186" width="140" height="8" rx="4" fill={MINT} />
      <Circle cx="96" cy="140" r="8" fill={AMBER} />
      <Circle cx="128" cy="168" r="8" fill={AMBER} />
      <Circle cx="186" cy="96" r="8" fill={AMBER} />
      <Rect x="52" y="52" width="60" height="14" rx="7" fill={GREEN} />
      <Rect x="52" y="74" width="40" height="10" rx="5" fill={AMBER} />
      <Circle cx="176" cy="60" r="18" fill={WHITE} stroke={AMBER} strokeWidth="4" />
      <Path d="M176 50 L176 70 M166 60 L186 60" stroke={AMBER} strokeWidth="4" strokeLinecap="round" />
    </SvgFrame>
  );
}