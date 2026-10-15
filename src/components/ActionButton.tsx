import { Pressable, Text } from 'react-native';

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  accessibilityHint?: string;
  icon?: 'scissors' | 'arrow' | 'logout' | 'check';
  disabled?: boolean;
};



export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  accessibilityHint,
  icon,
  disabled = false,
}: ActionButtonProps) {
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-[54px] flex-row items-center justify-center gap-3 rounded-xl px-5 active:opacity-75 disabled:opacity-50 ${
        primary
          ? 'bg-[#1900ff]'
          : 'border border-[#4A4943] bg-[#fe0400]'
      }`}
    >
      {icon ? (
        <Text
          accessible={false}
          className={`text-lg ${
            primary ? 'text-[#171713]' : 'text-[#D6A85F]'
          }`}
        >
          
        </Text>
      ) : null}
      <Text
        className={`text-base font-bold ${
          primary ? 'text-[#f9f9f7]' : 'text-[#F4F0E7]'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
