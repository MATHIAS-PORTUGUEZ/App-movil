import type { ReactNode } from 'react';
import { View } from 'react-native';

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
};

export function SurfaceCard({
  children,
  className = '',
}: SurfaceCardProps) {
  return (
    <View
      className={`rounded-2xl border border-[#34352E] bg-[#ff0000] p-5 ${className}`}
    >
      {children}
    </View>
  );
}
