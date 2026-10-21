import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
            onPress={() => setVisible((v) => !v)}
            style={styles.eyeButton}
          >
            {/* Ojo abierto */}
            {visible ? (
              <View style={styles.eyeOpen}>
                <View style={styles.iris}>
                  <View style={styles.pupil} />
                </View>
              </View>
            ) : (
              /* Ojo cerrado */
              <View style={styles.eyeOpen}>
                <View style={styles.eyeClosedLine} />
              </View>
            )}
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
  // Contorno del ojo — forma oval
  eyeOpen: {
    width: 26,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00BFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Iris
  iris: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00BFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Pupila
  pupil: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E2130',
  },
  // Línea horizontal para ojo cerrado
  eyeClosedLine: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#00BFFF',
  },
});
