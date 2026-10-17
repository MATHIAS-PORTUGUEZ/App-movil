import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

export type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  error?: string;
  multiline?: boolean;
  inputClassName?: string;
  keyboardType?: 'default' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  secureTextEntry?: boolean;
  returnKeyType?: 'default' | 'next' | 'done';
  onSubmitEditing?: () => void;
};

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  inputClassName,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  returnKeyType = 'done',
  onSubmitEditing,
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-[#E8E3D8]">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#85847D"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        textAlignVertical={multiline ? 'top' : 'center'}
        accessibilityLabel={label}
        className={`rounded-xl border px-4 py-3 text-base text-[#161616] bg-[#ffffff] ${
          multiline ? 'min-h-[120px]' : 'min-h-[54px]'
        } ${
          inputClassName ?? 'border-[#3D3E38] bg-[#141512]'
        } ${error ? 'border-[#F87171]' : focused ? 'border-[#D6A85F]' : ''}`}
      />
      {error ? (
        <Text accessibilityRole="alert" className="text-sm text-[#FCA5A5]">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
