import React from 'react';
import { Text as NativeText, TextProps } from 'react-native';
import { shonaText } from '../constants/shona';
import { useApp } from '../context/AppContext';

export function LocalizedText({ children, ...props }: TextProps) {
  const { lang } = useApp();
  const localizedChildren = React.Children.map(children, (child) => (
    lang === 'sn' && typeof child === 'string' ? shonaText(child) : child
  ));

  return <NativeText {...props}>{localizedChildren}</NativeText>;
}
