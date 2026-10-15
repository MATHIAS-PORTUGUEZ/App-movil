import { Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { BarberShopLogo } from '../components/BarberShopLogo';
import { SurfaceCard } from '../components/SurfaceCard';

type HomeScreenProps = {
  username: string;
  onRegister: () => void;
  onLogout: () => void;
};

export function HomeScreen({
  username,
  onRegister,
  onLogout,
}: HomeScreenProps) {
  return (
    <View className="flex-1 justify-center gap-5 py-10">
      <BarberShopLogo variant="hero" />
      <View className="flex-row items-center gap-2">
        <Text className="text-sm font-semibold uppercase tracking-[2px] text-[#ffffff]">
       BARBERÍA
        </Text>
      </View>
      <Text className="text-3xl font-bold leading-10 text-[#F4F0E7]">
        Hola, {username.trim()}.
      </Text>
      <Text className="text-base leading-6 text-[#ffffff]">
        Reserva tu próximo servicio y déjanos cuidar de tu estilo.
      </Text>

      <SurfaceCard className="mt-3 gap-4 p-5">
        <View className="h-1 w-12 rounded-full bg-[#ffffff]" />
        <Text className="text-xl font-bold text-[#F4F0E7]">
          ¿Qué servicio necesitas?
        </Text>
        <Text className="text-sm leading-5 text-[#fffffd]">
          Cuéntanos qué buscas y prepararemos tu solicitud.
        </Text>
        <ActionButton
          label="Registrar solicitud"
          onPress={onRegister}
          icon="arrow"
          accessibilityHint="Abre el formulario para solicitar un servicio"
        />
      </SurfaceCard>

      <View className="mt-2">
        <ActionButton
          label="Cerrar sesión"
          onPress={onLogout}
          variant="secondary"
          icon="logout"
        />
      </View>
    </View>
  );
}
