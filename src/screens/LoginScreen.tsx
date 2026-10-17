import { Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { BarberShopLogo } from '../components/BarberShopLogo';
import { Field } from '../components/Field';
import { SurfaceCard } from '../components/SurfaceCard';
import type { LoginErrors } from '../domain/models';

type LoginScreenProps = {
  username: string;
  password: string;
  errors: LoginErrors;
  isSigningIn: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSignIn: () => void;
};

export function LoginScreen({
  username,
  password,
  errors,
  isSigningIn,
  onUsernameChange,
  onPasswordChange,
  onSignIn,
}: LoginScreenProps) {
  return (
    <View className="flex-1 justify-center py-10">
      <View className="mb-8 items-center">
        <BarberShopLogo />
        <Text className="text-center text-sm font-semibold uppercase tracking-[3px] text-[#f6f4f2]">
        Barbería
        </Text>
        <Text className="mt-3 text-center text-3xl font-bold text-[#F4F0E7]">
          Tu estilo empieza 
        </Text>
        <Text className="mt-2 text-center text-base text-[#ffffff]">
          Inicia sesión para continuar
        </Text>
      </View>

      <SurfaceCard className="gap-5 p-6">
        <View className="mb-1">
          <Text className="text-xl font-bold text-[#F4F0E7]">
            Bienvenido
          </Text>
          <Text className="mt-1 text-sm text-[#fafaf9]">
            Ingresa tus datos de acceso.
          </Text>
        </View>
        <Field
          label="Usuario"
          value={username}
          onChangeText={onUsernameChange}
          placeholder="Escribe tu usuario"
          autoCapitalize="none"
          error={errors.username}
          returnKeyType="next"
        />
        <Field
          label="Contraseña"
          value={password}
          onChangeText={onPasswordChange}
          placeholder="Escribe tu contraseña"
          secureTextEntry
          error={errors.password}
          onSubmitEditing={onSignIn}
          
        />
        <ActionButton
          label={isSigningIn ? 'Ingresando…' : 'Ingresar'}
          onPress={onSignIn}
          icon={isSigningIn ? undefined : 'arrow'}
          disabled={isSigningIn}
          accessibilityHint="Valida tus datos e inicia sesión"
        />
      </SurfaceCard>
      <Text className="mt-6 text-center text-xs text-[#ffffff]">
        Atención personalizada · Estilo a tu medida
      </Text>
    </View>
  );
}
