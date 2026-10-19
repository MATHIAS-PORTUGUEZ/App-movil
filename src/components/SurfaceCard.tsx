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
      className={`rounded-2xl border border-[#2E3450] bg-[#252A3D] p-5 ${className}`}
    >
      {children}
    </View>
  );
}
