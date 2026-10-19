import { Pressable, Text } from 'react-native';

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  accessibilityHint?: string;
  disabled?: boolean;
};

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  accessibilityHint,
  disabled = false,
}: ActionButtonProps) {
  const primary = variant === 'primary';
  const secondary = variant === 'secondary';
  const backgroundClass =
    variant === 'success'
      ? 'bg-[#00BFFF]'
      : variant === 'danger'
        ? 'bg-[#E05560]'
        : secondary
          ? 'border border-[#2E3450] bg-[#252A3D]'
          : 'bg-[#00BFFF]';
  const labelColorClass = primary ? 'text-[#1E2130]' : secondary ? 'text-white' : 'text-[#1E2130]';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-[54px] flex-row items-center justify-center gap-3 rounded-xl px-5 active:opacity-75 disabled:opacity-50 ${backgroundClass}`}
    >
      <Text
        className={`text-base font-bold ${labelColorClass}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
