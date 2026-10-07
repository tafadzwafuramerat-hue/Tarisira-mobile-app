import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type AppIconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

export function AppIcon({ name, size = 20, color = '#14231C' }: AppIconProps) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}
