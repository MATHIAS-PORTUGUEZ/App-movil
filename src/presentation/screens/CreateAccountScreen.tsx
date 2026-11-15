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
    <View className="flex-1 justify-center py-8">
      <View className="mb-7 items-center">
        <BarberShopLogo />
        <Text className="text-center text-xs font-bold uppercase tracking-[3px] text-white/70">
          Barbería
        </Text>
        <Text className="mt-3 text-center text-3xl font-bold text-[#00BFFF]">
          Crea tu cuenta
        </Text>
        <Text className="mt-2 max-w-[300px] text-center text-base leading-6 text-white/80">
          Regístrate para reservar tus próximas visitas.
        </Text>
      </View>

      <SurfaceCard className="gap-5 p-6">
        <View className="gap-1">
          <Text className="text-xl font-bold text-white">Tus datos de acceso</Text>
          <Text className="text-sm leading-5 text-white/70">
            Usa tu correo electrónico y crea una contraseña.
          </Text>
        </View>

        <Field
          label="Correo electrónico"
          value={form.email}
          onChangeText={(value) => onChange('email', value)}
          placeholder="tucorreo@ejemplo.com"
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email}
          returnKeyType="next"
        />
        <View className="gap-2">
          <Field
            label="Contraseña"
            value={form.password}
            onChangeText={(value) => onChange('password', value)}
            placeholder="Crea una contraseña"
            autoCapitalize="none"
            secureTextEntry
            showPasswordToggle
            error={errors.password}
            onSubmitEditing={onCreateAccount}
          />
          <Text className="text-xs leading-5 text-white/65">
            Usa al menos 6 caracteres. Toca el ojo para mostrar u ocultar la contraseña.
          </Text>
        </View>

        <View className="gap-3 pt-1">
          <ActionButton
            label={isCreatingAccount ? 'Creando cuenta…' : 'Crear mi cuenta'}
            onPress={onCreateAccount}
            disabled={isCreatingAccount}
            accessibilityHint="Guarda tus datos y crea una cuenta nueva"
          />
          <ActionButton
            label="Ya tengo una cuenta · Iniciar sesión"
            onPress={onBackToLogin}
            variant="secondary"
            disabled={isCreatingAccount}
          />
        </View>
      </SurfaceCard>

      <Text className="mt-5 text-center text-xs leading-5 text-white/60">
        Tu inicio de sesión se administra con Firebase.
      </Text>
    </View>
  );
}
