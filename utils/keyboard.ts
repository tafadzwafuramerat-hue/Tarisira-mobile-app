import { useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';

export function useKeyboardAwareField() {
  useEffect(() => {
    if (Platform.OS === 'ios') return;
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      // Force the scroll view to re-measure so the focused field stays visible.
      const ref = (globalThis as any).__tarisiraScrollRef;
      if (ref && ref.measure) {
        ref.measureInWindow((_x: number, _y: number, _w: number, _h: number) => {
          // no-op: kept for future custom scroll logic
        });
      }
    });
    return () => sub.remove();
  }, []);
}