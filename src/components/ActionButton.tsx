import { Pressable, Text } from 'react-native';

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  accessibilityHint?: string;
  icon?: 'scissors' | 'arrow' | 'logout' | 'check';
  disabled?: boolean;
};

const ICONS = {
  scissors: '✂',
  arrow: '→',
  logout: '↗',
  check: '✓',
} as const;

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  accessibilityHint,
  icon,
  disabled = false,
}: ActionButtonProps) {
  const primary = variant === 'primary';
  const secondary = variant === 'secondary';
  const backgroundClass =
    variant === 'success'
      ? 'bg-[#16a34a]'
      : variant === 'danger'
        ? 'bg-[#dc2626]'
        : secondary
          ? 'border border-[#4A4943] bg-[#1100fe]'
          : 'bg-[#2f00ff]';
  const iconColorClass = secondary ? 'text-[#D6A85F]' : 'text-white';
  const labelColorClass = primary ? 'text-[#f9f9f7]' : 'text-white';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-[54px] flex-row items-center justify-center gap-3 rounded-xl px-5 active:opacity-75 disabled:opacity-50 ${backgroundClass}`}
    >
      {icon ? (
        <Text
          accessible={false}
          className={`text-lg ${iconColorClass}`}
        >
          {ICONS[icon]}
        </Text>
      ) : null}
      <Text
        className={`text-base font-bold ${labelColorClass}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
