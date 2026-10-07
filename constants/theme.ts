import { Platform } from 'react-native';

export const C = {
  bg: '#F2F9F5', page: '#F2F9F5', dark: '#005F3C', green: '#00A86B', mint: '#E3F4EC',
  line: '#D5EBE1', muted: '#6FA88F', ink: '#14231C', orange: '#000000',
  red: '#E5252A', pink: '#FDE8E8', disabled: '#7FAA95',
};
export const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
export const money = (n: number) => '$' + (Number.isInteger(n) ? n : n.toFixed(2));
