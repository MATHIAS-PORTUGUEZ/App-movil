import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  error?: string;
  multiline?: boolean;
  inputClassName?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
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
  showPasswordToggle = false,
  returnKeyType = 'done',
  onSubmitEditing,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  const isSecure = showPasswordToggle ? !visible : secureTextEntry;

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-[#E8E3D8]">{label}</Text>
      <View style={{ position: 'relative' }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#85847D"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={isSecure}
          multiline={multiline}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textAlignVertical={multiline ? 'top' : 'center'}
          accessibilityLabel={label}
          style={[
            styles.input,
            multiline ? styles.multiline : styles.singleLine,
            focused && !error ? styles.focused : null,
            error ? styles.errorBorder : null,
            showPasswordToggle ? { paddingRight: 48 } : null,
          ]}
        />
        {showPasswordToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            accessibilityHint={visible ? 'Oculta el texto de la contraseña' : 'Muestra el texto de la contraseña'}
            accessibilityState={{ selected: visible }}
            onPress={() => setVisible((v) => !v)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={visible ? 'eye-outline' : 'eye-off-outline'}
              size={25}
              color="#F6F4F2"
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" className="text-sm text-[#FCA5A5]">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: '#252A3D',
    borderColor: '#2E3450',
  },
  singleLine: {
    minHeight: 54,
  },
  multiline: {
    minHeight: 120,
  },
  focused: {
    borderColor: '#00BFFF',
  },
  errorBorder: {
    borderColor: '#F87171',
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
  },
});
