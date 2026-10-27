import { Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { BarberShopLogo } from '../components/BarberShopLogo';
import { Field } from '../components/Field';
import { SurfaceCard } from '../components/SurfaceCard';
import type {
  CreateAccountErrors,
  CreateAccountForm,
} from '../../domain/models';

type CreateAccountScreenProps = {
  form: CreateAccountForm;
  errors: CreateAccountErrors;
  isCreatingAccount: boolean;
  onChange: (field: keyof CreateAccountForm, value: string) => void;
  onCreateAccount: () => void;
  onBackToLogin: () => void;
};

export function CreateAccountScreen({
  form,
  errors,
  isCreatingAccount,
  onChange,
  onCreateAccount,
  onBackToLogin,
}: CreateAccountScreenProps) {
  return (
    <View className="flex-1 justify-center py-10">
      <View className="mb-8 items-center">
        <BarberShopLogo />
        <Text className="text-center text-sm font-semibold uppercase tracking-[3px] text-[#f6f4f2]">
          Barbería
        </Text>
        <Text className="mt-3 text-center text-3xl font-bold text-[#00BFFF]">
          Crear cuenta
        </Text>
        <Text className="mt-2 text-center text-base text-white/80">
          Elige un usuario y una contraseña para comenzar.
        </Text>
      </View>

      <SurfaceCard className="gap-5 p-6">
        <Field
          label="Usuario"
          value={form.username}
          onChangeText={(value) => onChange('username', value)}
          placeholder="Elige un nombre de usuario"
          autoCapitalize="none"
          error={errors.username}
          returnKeyType="next"
        />
        <Field
          label="Contraseña"
          value={form.password}
          onChangeText={(value) => onChange('password', value)}
          placeholder="Crea una contraseña (mínimo 6 caracteres)"
          secureTextEntry
          showPasswordToggle
          error={errors.password}
          onSubmitEditing={onCreateAccount}
        />
        <ActionButton
          label={isCreatingAccount ? 'Creando cuenta…' : 'Crear cuenta'}
          onPress={onCreateAccount}
          disabled={isCreatingAccount}
          accessibilityHint="Guarda tus datos y crea una cuenta nueva"
        />
        <ActionButton
          label="Volver a iniciar sesión"
          onPress={onBackToLogin}
          variant="secondary"
          disabled={isCreatingAccount}
        />
      </SurfaceCard>
    </View>
  );
}
