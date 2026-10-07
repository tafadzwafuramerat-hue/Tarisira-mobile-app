import React from 'react';
import { Tabs } from 'expo-router';
import { TopBar } from '../../components/TopBar';
import { AppIcon } from '../../components/AppIcon';
import { C } from '../../constants/theme';

const icon = (name: React.ComponentProps<typeof AppIcon>['name']) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <AppIcon name={name} size={20} color={focused ? C.dark : C.muted} />;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        header: ({ options }) => <TopBar title={options.title === 'Home' ? undefined : options.title} />,
        tabBarActiveTintColor: C.dark,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: C.line },
        sceneStyle: { backgroundColor: C.page },
      }}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: icon('view-dashboard-outline') }} />
      <Tabs.Screen name="stock" options={{ title: 'Stock', tabBarIcon: icon('package-variant-closed') }} />
      <Tabs.Screen name="sales" options={{ title: 'Sales', tabBarIcon: icon('cash-multiple') }} />
      <Tabs.Screen name="debtors" options={{ title: 'Debtors', tabBarIcon: icon('account-group-outline') }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports', tabBarIcon: icon('chart-box-outline') }} />
    </Tabs>
  );
}
