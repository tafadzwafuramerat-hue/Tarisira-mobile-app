import React from 'react';
import { Stack } from 'expo-router';
import { AppProvider } from '../context/AppContext';
import { C } from '../constants/theme';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: C.bg } }} />
    </AppProvider>
  );
}
